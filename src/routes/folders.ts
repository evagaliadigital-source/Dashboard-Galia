import { Hono } from 'hono';
import { Bindings } from '../types/database';
import { authMiddleware, requireRole } from '../middleware/auth';

const folders = new Hono<{ Bindings: Bindings }>();

folders.use('*', authMiddleware);

// Get all folders with hierarchy and resource count
folders.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT 
      f.*,
      u.name as creator_name,
      COUNT(DISTINCT r.id) as resource_count
    FROM folders f
    LEFT JOIN users u ON f.created_by = u.id
    LEFT JOIN resources r ON r.folder_id = f.id
    GROUP BY f.id
    ORDER BY f.parent_id NULLS FIRST, f.sort_order ASC, f.name ASC
  `).all();

  return c.json({ folders: results });
});

// Get folder by ID with children and resources
folders.get('/:id', async (c) => {
  const id = c.req.param('id');

  const folder = await c.env.DB.prepare(
    `SELECT f.*, u.name as creator_name
     FROM folders f
     LEFT JOIN users u ON f.created_by = u.id
     WHERE f.id = ?`
  ).bind(id).first();

  if (!folder) {
    return c.json({ error: 'Carpeta no encontrada' }, 404);
  }

  // Get child folders
  const { results: children } = await c.env.DB.prepare(
    `SELECT f.*, COUNT(DISTINCT r.id) as resource_count
     FROM folders f
     LEFT JOIN resources r ON r.folder_id = f.id
     WHERE f.parent_id = ?
     GROUP BY f.id
     ORDER BY f.sort_order ASC, f.name ASC`
  ).bind(id).all();

  // Get resources in this folder
  const { results: resources } = await c.env.DB.prepare(
    `SELECT r.*, u.name as uploader_name
     FROM resources r
     LEFT JOIN users u ON r.uploaded_by = u.id
     WHERE r.folder_id = ?
     ORDER BY r.created_at DESC`
  ).bind(id).all();

  return c.json({ folder, children, resources });
});

// Get root folders and resources (no folder assigned)
folders.get('/root/contents', async (c) => {
  // Get root folders (parent_id is null)
  const { results: rootFolders } = await c.env.DB.prepare(
    `SELECT f.*, COUNT(DISTINCT r.id) as resource_count
     FROM folders f
     LEFT JOIN resources r ON r.folder_id = f.id
     WHERE f.parent_id IS NULL
     GROUP BY f.id
     ORDER BY f.sort_order ASC, f.name ASC`
  ).all();

  // Get resources without folder (folder_id is null)
  const user = c.get('user');
  let query = `SELECT r.*, u.name as uploader_name
     FROM resources r
     LEFT JOIN users u ON r.uploaded_by = u.id
     WHERE r.folder_id IS NULL`;
  
  // Filter based on role
  if (user.role === 'client') {
    query += " AND r.access_level = 'public'";
  } else if (user.role === 'team') {
    query += " AND r.access_level IN ('public', 'team')";
  }
  
  query += ' ORDER BY r.created_at DESC';

  const { results: rootResources } = await c.env.DB.prepare(query).all();

  return c.json({ folders: rootFolders, resources: rootResources });
});

// Get breadcrumb path for a folder
folders.get('/:id/breadcrumb', async (c) => {
  const id = c.req.param('id');
  const breadcrumb = [];

  let currentId: string | null = id;
  while (currentId) {
    const folder = await c.env.DB.prepare(
      'SELECT id, name, parent_id, icon FROM folders WHERE id = ?'
    ).bind(currentId).first();

    if (!folder) break;

    breadcrumb.unshift({
      id: folder.id,
      name: folder.name,
      icon: folder.icon
    });

    currentId = folder.parent_id;
  }

  return c.json({ breadcrumb });
});

// Create folder
folders.post('/', requireRole('admin', 'team'), async (c) => {
  const data = await c.req.json();
  const user = c.get('user');

  const result = await c.env.DB.prepare(
    `INSERT INTO folders (
      name, parent_id, description, color, icon, sort_order, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    data.name,
    data.parent_id || null,
    data.description || null,
    data.color || '#7B5FB8',
    data.icon || '📁',
    data.sort_order || 0,
    user.id
  ).run();

  const newFolder = await c.env.DB.prepare(
    'SELECT * FROM folders WHERE id = ?'
  ).bind(result.meta.last_row_id).first();

  return c.json({ folder: newFolder }, 201);
});

// Update folder
folders.put('/:id', requireRole('admin', 'team'), async (c) => {
  const id = c.req.param('id');
  const data = await c.req.json();

  await c.env.DB.prepare(
    `UPDATE folders SET 
      name = ?, parent_id = ?, description = ?,
      color = ?, icon = ?, sort_order = ?,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(
    data.name,
    data.parent_id || null,
    data.description || null,
    data.color,
    data.icon,
    data.sort_order || 0,
    id
  ).run();

  const updatedFolder = await c.env.DB.prepare(
    'SELECT * FROM folders WHERE id = ?'
  ).bind(id).first();

  return c.json({ folder: updatedFolder });
});

// Delete folder (only if empty)
folders.delete('/:id', requireRole('admin'), async (c) => {
  const id = c.req.param('id');

  // Check if folder has children
  const childrenCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM folders WHERE parent_id = ?'
  ).bind(id).first();

  if (childrenCount && childrenCount.count > 0) {
    return c.json({ error: 'No se puede eliminar una carpeta con subcarpetas' }, 400);
  }

  // Check if folder has resources
  const resourcesCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM resources WHERE folder_id = ?'
  ).bind(id).first();

  if (resourcesCount && resourcesCount.count > 0) {
    return c.json({ error: 'No se puede eliminar una carpeta con recursos' }, 400);
  }

  await c.env.DB.prepare('DELETE FROM folders WHERE id = ?').bind(id).run();
  return c.json({ message: 'Carpeta eliminada' });
});

// Move folder to another parent
folders.patch('/:id/move', requireRole('admin', 'team'), async (c) => {
  const id = c.req.param('id');
  const { parent_id } = await c.req.json();

  // Validate not moving to itself or its descendants
  if (parent_id) {
    let currentId: string | null = parent_id;
    while (currentId) {
      if (currentId === id) {
        return c.json({ error: 'No se puede mover una carpeta dentro de sí misma' }, 400);
      }
      const parent = await c.env.DB.prepare(
        'SELECT parent_id FROM folders WHERE id = ?'
      ).bind(currentId).first();
      currentId = parent?.parent_id || null;
    }
  }

  await c.env.DB.prepare(
    'UPDATE folders SET parent_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(parent_id || null, id).run();

  return c.json({ message: 'Carpeta movida exitosamente' });
});

export default folders;
