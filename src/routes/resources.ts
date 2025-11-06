import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  RESOURCES: R2Bucket;
};

const resources = new Hono<{ Bindings: Bindings }>();

// ============================================
// BIBLIOTECA DE RECURSOS INTERNOS
// ============================================
// Materiales reutilizables del equipo (plantillas, logos, guías)
// Organización manual con drag & drop por carpetas

// ============================================
// UPLOAD RECURSO
// ============================================
resources.post('/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string || file?.name;
    const description = formData.get('description') as string || '';
    const category = formData.get('category') as string || 'other';
    const access_level = formData.get('access_level') as string || 'team';
    
    if (!file) {
      return c.json({ error: 'No se proporcionó ningún archivo' }, 400);
    }
    
    // Validar tamaño (máximo 100MB para recursos)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return c.json({ 
        error: 'Archivo demasiado grande. Máximo 100MB permitido.' 
      }, 400);
    }
    
    // Generar key único para R2
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const r2Key = `resources/${timestamp}-${randomStr}-${sanitizedName}`;
    
    // 1. Subir a R2
    const fileBuffer = await file.arrayBuffer();
    await c.env.RESOURCES.put(r2Key, fileBuffer, {
      httpMetadata: {
        contentType: file.type || 'application/octet-stream'
      },
      customMetadata: {
        originalName: file.name,
        uploadDate: new Date().toISOString(),
        title: title
      }
    });
    
    // 2. Guardar en D1 (sin folder_id = "Sin Clasificar")
    const fileType = file.name.split('.').pop()?.toLowerCase() || 'unknown';
    
    const result = await c.env.DB.prepare(`
      INSERT INTO resources (
        title, filename, original_filename, file_type, file_size, mime_type,
        r2_key, folder_id, description, category, access_level, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      title,
      sanitizedName,
      file.name,
      fileType,
      file.size,
      file.type,
      r2Key,
      null, // Sin clasificar por defecto
      description,
      category,
      access_level,
      1 // TODO: Obtener del usuario autenticado
    ).run();
    
    return c.json({ 
      success: true, 
      message: '✅ Recurso subido. Organízalo arrastrándolo a una carpeta.',
      resource: {
        id: result.meta.last_row_id,
        title: title,
        filename: sanitizedName,
        file_type: fileType,
        file_size: file.size
      }
    });
    
  } catch (error) {
    console.error('Error uploading resource:', error);
    return c.json({ 
      error: 'Error al subir el recurso: ' + (error as Error).message 
    }, 500);
  }
});

// ============================================
// LISTAR RECURSOS
// ============================================
resources.get('/', async (c) => {
  try {
    const folder_id = c.req.query('folder_id');
    const category = c.req.query('category');
    const search = c.req.query('search');
    
    let query = `
      SELECT 
        r.*,
        u.name as uploaded_by_name
      FROM resources r
      LEFT JOIN users u ON r.uploaded_by = u.id
      WHERE r.deleted_at IS NULL
    `;
    
    const bindings: any[] = [];
    
    if (folder_id === 'unclassified') {
      query += ` AND r.folder_id IS NULL`;
    } else if (folder_id) {
      query += ` AND r.folder_id = ?`;
      bindings.push(folder_id);
    }
    
    if (category && category !== 'all') {
      query += ` AND r.category = ?`;
      bindings.push(category);
    }
    
    if (search) {
      query += ` AND (r.title LIKE ? OR r.description LIKE ? OR r.tags LIKE ?)`;
      const searchPattern = `%${search}%`;
      bindings.push(searchPattern, searchPattern, searchPattern);
    }
    
    query += ` ORDER BY r.created_at DESC`;
    
    const { results } = await c.env.DB.prepare(query).bind(...bindings).all();
    
    return c.json({ resources: results });
    
  } catch (error) {
    console.error('Error fetching resources:', error);
    return c.json({ error: 'Error al obtener recursos' }, 500);
  }
});

// ============================================
// OBTENER CARPETAS CON ESTADÍSTICAS
// ============================================
resources.get('/folders', async (c) => {
  try {
    // Obtener carpetas de recursos
    const { results: folders } = await c.env.DB.prepare(`
      SELECT id, name, description, icon, color, sort_order 
      FROM folders
      WHERE name IN ('Marketing', 'Diseño', 'Plantillas', 'Documentos')
         OR parent_id IN (SELECT id FROM folders WHERE name IN ('Marketing', 'Diseño'))
      ORDER BY sort_order, name
    `).all();
    
    // Obtener estadísticas para cada carpeta
    for (const folder of folders) {
      const stats = await c.env.DB.prepare(`
        SELECT 
          COUNT(*) as resource_count,
          COALESCE(SUM(file_size), 0) as total_size_bytes
        FROM resources
        WHERE folder_id = ? AND deleted_at IS NULL
      `).bind(folder.id).first();
      
      Object.assign(folder, stats);
    }
    
    // Obtener recursos sin clasificar
    const unclassifiedStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as resource_count,
        COALESCE(SUM(file_size), 0) as total_size_bytes
      FROM resources
      WHERE folder_id IS NULL AND deleted_at IS NULL
    `).first();
    
    return c.json({ 
      folders,
      unclassified: {
        name: 'Sin Clasificar',
        icon: '📥',
        color: '#94A3B8',
        ...unclassifiedStats
      }
    });
    
  } catch (error) {
    console.error('Error fetching folders:', error);
    return c.json({ error: 'Error al obtener carpetas' }, 500);
  }
});

// ============================================
// MOVER RECURSO A CARPETA
// ============================================
resources.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { folder_id } = await c.req.json();
    
    await c.env.DB.prepare(`
      UPDATE resources 
      SET folder_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(folder_id, id).run();
    
    return c.json({ 
      success: true, 
      message: '✅ Recurso movido correctamente' 
    });
    
  } catch (error) {
    console.error('Error moving resource:', error);
    return c.json({ error: 'Error al mover recurso' }, 500);
  }
});

// ============================================
// DESCARGAR/PREVIEW RECURSO
// ============================================
resources.get('/:id/download', async (c) => {
  try {
    const id = c.req.param('id');
    
    // Obtener info del recurso
    const resource = await c.env.DB.prepare(`
      SELECT * FROM resources WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first();
    
    if (!resource) {
      return c.json({ error: 'Recurso no encontrado' }, 404);
    }
    
    // Obtener archivo de R2
    const object = await c.env.RESOURCES.get(resource.r2_key as string);
    
    if (!object) {
      return c.json({ error: 'Archivo no encontrado en almacenamiento' }, 404);
    }
    
    // Actualizar last_accessed_at
    await c.env.DB.prepare(`
      UPDATE resources SET last_accessed_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(id).run();
    
    // Retornar archivo
    return new Response(object.body, {
      headers: {
        'Content-Type': resource.mime_type as string || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${resource.original_filename}"`,
        'Cache-Control': 'public, max-age=3600'
      }
    });
    
  } catch (error) {
    console.error('Error downloading resource:', error);
    return c.json({ error: 'Error al descargar recurso' }, 500);
  }
});

// ============================================
// ELIMINAR RECURSO (SOFT DELETE)
// ============================================
resources.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    await c.env.DB.prepare(`
      UPDATE resources 
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(id).run();
    
    return c.json({ 
      success: true, 
      message: '✅ Recurso eliminado' 
    });
    
  } catch (error) {
    console.error('Error deleting resource:', error);
    return c.json({ error: 'Error al eliminar recurso' }, 500);
  }
});

// ============================================
// ACTUALIZAR METADATOS DEL RECURSO
// ============================================
resources.patch('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { title, description, category, tags, access_level } = await c.req.json();
    
    const updates: string[] = [];
    const bindings: any[] = [];
    
    if (title) {
      updates.push('title = ?');
      bindings.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      bindings.push(description);
    }
    if (category) {
      updates.push('category = ?');
      bindings.push(category);
    }
    if (tags !== undefined) {
      updates.push('tags = ?');
      bindings.push(JSON.stringify(tags));
    }
    if (access_level) {
      updates.push('access_level = ?');
      bindings.push(access_level);
    }
    
    if (updates.length === 0) {
      return c.json({ error: 'No se proporcionaron campos para actualizar' }, 400);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    bindings.push(id);
    
    await c.env.DB.prepare(`
      UPDATE resources SET ${updates.join(', ')} WHERE id = ?
    `).bind(...bindings).run();
    
    return c.json({ 
      success: true, 
      message: '✅ Recurso actualizado' 
    });
    
  } catch (error) {
    console.error('Error updating resource:', error);
    return c.json({ error: 'Error al actualizar recurso' }, 500);
  }
});

export default resources;
