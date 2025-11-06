import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  DOCUMENTS: R2Bucket;
};

const documents = new Hono<{ Bindings: Bindings }>();

// ============================================
// CLASIFICACIÓN MANUAL - Sin IA
// ============================================
// Todos los documentos se suben a "Sin Clasificar" por defecto
// El usuario los organiza manualmente con drag & drop

// ============================================
// UPLOAD DOCUMENTO
// ============================================
documents.post('/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No se proporcionó ningún archivo' }, 400);
    }
    
    // Validar tamaño (máximo 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return c.json({ 
        error: 'Archivo demasiado grande. Máximo 50MB permitido.' 
      }, 400);
    }
    
    // Generar key único para R2
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const r2Key = `uploads/${timestamp}-${randomStr}-${sanitizedName}`;
    
    // 1. Subir a R2
    const fileBuffer = await file.arrayBuffer();
    await c.env.DOCUMENTS.put(r2Key, fileBuffer, {
      httpMetadata: {
        contentType: file.type || 'application/octet-stream'
      },
      customMetadata: {
        originalName: file.name,
        uploadDate: new Date().toISOString()
      }
    });
    
    // 2. Guardar metadata en D1 (SIN carpeta = "Sin Clasificar")
    const result = await c.env.DB.prepare(`
      INSERT INTO documents (
        filename,
        original_filename,
        file_type,
        file_size,
        mime_type,
        r2_key,
        folder_id,
        uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      sanitizedName,
      file.name,
      file.type.split('/')[1] || 'unknown',
      file.size,
      file.type,
      r2Key,
      null, // Sin clasificar inicialmente
      1 // TODO: obtener user ID del contexto
    ).run();
    
    return c.json({
      success: true,
      document: {
        id: result.meta.last_row_id,
        filename: file.name,
        size: file.size,
        type: file.type
      },
      message: `✅ Documento subido. Organízalo arrastrándolo a una carpeta.`
    });
    
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return c.json({ 
      error: 'Error al subir el documento',
      details: error.message 
    }, 500);
  }
});

// ============================================
// LISTAR DOCUMENTOS
// ============================================
documents.get('/', async (c) => {
  try {
    const folderId = c.req.query('folder');
    const search = c.req.query('search');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    
    let query = `
      SELECT 
        d.*,
        f.name as folder_name,
        f.icon as folder_icon,
        f.color as folder_color,
        p.name as project_name,
        c.business_name as client_name,
        u.name as uploaded_by_name
      FROM documents d
      LEFT JOIN folders f ON d.folder_id = f.id
      LEFT JOIN projects p ON d.project_id = p.id
      LEFT JOIN clients c ON d.client_id = c.id
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.deleted_at IS NULL
    `;
    
    const bindings: any[] = [];
    
    if (folderId === 'unclassified') {
      // Filtrar solo documentos sin clasificar
      query += ' AND d.folder_id IS NULL';
    } else if (folderId) {
      // Filtrar por carpeta específica
      query += ' AND d.folder_id = ?';
      bindings.push(parseInt(folderId));
    }
    
    if (search) {
      query += ' AND (d.filename LIKE ? OR d.description LIKE ? OR d.tags LIKE ?)';
      const searchPattern = `%${search}%`;
      bindings.push(searchPattern, searchPattern, searchPattern);
    }
    
    query += ' ORDER BY d.uploaded_at DESC LIMIT ? OFFSET ?';
    bindings.push(limit, offset);
    
    const { results } = await c.env.DB.prepare(query)
      .bind(...bindings)
      .all();
    
    // Obtener estadísticas de carpetas
    const { results: folderStats } = await c.env.DB.prepare(`
      SELECT * FROM folder_document_stats
    `).all();
    
    return c.json({
      documents: results,
      folders: folderStats,
      pagination: {
        limit,
        offset,
        total: results.length
      }
    });
    
  } catch (error: any) {
    console.error('Error listing documents:', error);
    return c.json({ 
      error: 'Error al listar documentos',
      details: error.message 
    }, 500);
  }
});

// ============================================
// DESCARGAR DOCUMENTO
// ============================================
documents.get('/:id/download', async (c) => {
  try {
    const id = c.req.param('id');
    
    // Obtener metadata del documento
    const doc = await c.env.DB.prepare(`
      SELECT * FROM documents WHERE id = ? AND deleted_at IS NULL
    `).bind(id).first();
    
    if (!doc) {
      return c.json({ error: 'Documento no encontrado' }, 404);
    }
    
    // Obtener archivo de R2
    const file = await c.env.DOCUMENTS.get(doc.r2_key as string);
    
    if (!file) {
      return c.json({ error: 'Archivo no encontrado en almacenamiento' }, 404);
    }
    
    // Actualizar last_accessed_at
    await c.env.DB.prepare(`
      UPDATE documents SET last_accessed_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(id).run();
    
    // Retornar archivo con headers apropiados
    return new Response(file.body, {
      headers: {
        'Content-Type': doc.mime_type as string || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${doc.original_filename}"`,
        'Content-Length': doc.file_size?.toString() || '0'
      }
    });
    
  } catch (error: any) {
    console.error('Error downloading document:', error);
    return c.json({ 
      error: 'Error al descargar documento',
      details: error.message 
    }, 500);
  }
});

// ============================================
// ACTUALIZAR DOCUMENTO (mover carpeta, etc)
// ============================================
documents.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    
    const updates: string[] = [];
    const bindings: any[] = [];
    
    if (data.folder_id !== undefined) {
      updates.push('folder_id = ?');
      bindings.push(data.folder_id);
    }
    
    if (data.description !== undefined) {
      updates.push('description = ?');
      bindings.push(data.description);
    }
    
    if (data.tags !== undefined) {
      updates.push('tags = ?');
      bindings.push(JSON.stringify(data.tags));
    }
    
    if (data.project_id !== undefined) {
      updates.push('project_id = ?');
      bindings.push(data.project_id);
    }
    
    if (data.client_id !== undefined) {
      updates.push('client_id = ?');
      bindings.push(data.client_id);
    }
    
    if (updates.length === 0) {
      return c.json({ error: 'No hay cambios para aplicar' }, 400);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    bindings.push(id);
    
    await c.env.DB.prepare(`
      UPDATE documents SET ${updates.join(', ')} WHERE id = ?
    `).bind(...bindings).run();
    
    return c.json({ 
      success: true,
      message: 'Documento actualizado correctamente'
    });
    
  } catch (error: any) {
    console.error('Error updating document:', error);
    return c.json({ 
      error: 'Error al actualizar documento',
      details: error.message 
    }, 500);
  }
});

// ============================================
// ELIMINAR DOCUMENTO (soft delete)
// ============================================
documents.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    // Soft delete
    await c.env.DB.prepare(`
      UPDATE documents SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(id).run();
    
    return c.json({ 
      success: true,
      message: 'Documento eliminado correctamente'
    });
    
  } catch (error: any) {
    console.error('Error deleting document:', error);
    return c.json({ 
      error: 'Error al eliminar documento',
      details: error.message 
    }, 500);
  }
});

// ============================================
// OBTENER ESTADÍSTICAS
// ============================================
documents.get('/stats/summary', async (c) => {
  try {
    const { results: stats } = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_documents,
        SUM(file_size) as total_size_bytes,
        ROUND(SUM(file_size) / 1024.0 / 1024.0, 2) as total_size_mb,
        COUNT(CASE WHEN folder_id IS NULL THEN 1 END) as unclassified_count,
        COUNT(CASE WHEN folder_id IS NOT NULL THEN 1 END) as classified_count
      FROM documents
      WHERE deleted_at IS NULL
    `).all();
    
    const { results: folderStats } = await c.env.DB.prepare(`
      SELECT * FROM folder_document_stats
    `).all();
    
    return c.json({
      summary: stats[0],
      folders: folderStats
    });
    
  } catch (error: any) {
    console.error('Error getting stats:', error);
    return c.json({ 
      error: 'Error al obtener estadísticas',
      details: error.message 
    }, 500);
  }
});

// ============================================
// LISTAR CARPETAS CON ESTADÍSTICAS
// ============================================
documents.get('/folders', async (c) => {
  try {
    // Obtener carpetas básicas primero
    const { results: folders } = await c.env.DB.prepare(`
      SELECT 
        id,
        name,
        description,
        icon,
        color,
        sort_order
      FROM folders
      WHERE name LIKE 'Documentos -%'
      ORDER BY sort_order
    `).all();
    
    // Agregar estadísticas a cada carpeta
    for (const folder of folders) {
      const { results: stats } = await c.env.DB.prepare(`
        SELECT 
          COUNT(*) as document_count,
          COALESCE(SUM(file_size), 0) as total_size_bytes,
          COALESCE(ROUND(SUM(file_size) / 1024.0 / 1024.0, 2), 0) as total_size_mb
        FROM documents
        WHERE folder_id = ? AND deleted_at IS NULL
      `).bind(folder.id).all();
      
      Object.assign(folder, stats[0]);
    }
    
    // Obtener cuenta de sin clasificar
    const { results: unclassified } = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as document_count,
        SUM(file_size) as total_size_bytes,
        ROUND(SUM(file_size) / 1024.0 / 1024.0, 2) as total_size_mb
      FROM documents
      WHERE folder_id IS NULL AND deleted_at IS NULL
    `).all();
    
    return c.json({
      folders,
      unclassified: {
        id: 'unclassified',
        name: '📥 Sin Clasificar',
        description: 'Documentos pendientes de organizar',
        icon: '📥',
        color: '#6B7280',
        sort_order: 1,
        ...unclassified[0]
      }
    });
    
  } catch (error: any) {
    console.error('Error getting folders:', error);
    return c.json({ 
      error: 'Error al obtener carpetas',
      details: error.message 
    }, 500);
  }
});

export default documents;
