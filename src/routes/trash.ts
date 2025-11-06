import { Hono } from 'hono';
import { Bindings } from '../types/database';
import { authMiddleware, requireRole } from '../middleware/auth';

const trash = new Hono<{ Bindings: Bindings }>();

trash.use('*', authMiddleware);

// Get all deleted items
trash.get('/', requireRole('admin', 'team'), async (c) => {
  const { DB } = c.env;

  try {
    // Get deleted clients
    const { results: deletedClients } = await DB.prepare(
      `SELECT 
        id, business_name, contact_name, email, phone,
        deleted_at, deleted_by
      FROM clients 
      WHERE deleted_at IS NOT NULL 
      ORDER BY deleted_at DESC`
    ).all();

    // Get deleted projects
    const { results: deletedProjects } = await DB.prepare(
      `SELECT 
        p.id, p.name, p.status,
        p.deleted_at, p.deleted_by,
        c.business_name as client_name
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.deleted_at IS NOT NULL 
      ORDER BY p.deleted_at DESC`
    ).all();

    // Get deleted tasks
    const { results: deletedTasks } = await DB.prepare(
      `SELECT 
        t.id, t.title, t.status,
        t.deleted_at, t.deleted_by,
        p.name as project_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.deleted_at IS NOT NULL 
      ORDER BY t.deleted_at DESC`
    ).all();

    // Get deleted resources
    const { results: deletedResources } = await DB.prepare(
      `SELECT 
        id, title, category as resource_type,
        deleted_at, deleted_by
      FROM resources 
      WHERE deleted_at IS NOT NULL 
      ORDER BY deleted_at DESC`
    ).all();

    // Get deleted documents (optional - table may not exist)
    let deletedDocuments: any[] = [];
    try {
      const documentsResult = await DB.prepare(
        `SELECT 
          id, filename, original_filename, file_size,
          deleted_at, deleted_by
        FROM documents 
        WHERE deleted_at IS NOT NULL 
        ORDER BY deleted_at DESC`
      ).all();
      deletedDocuments = documentsResult.results;
    } catch (error) {
      // Documents table doesn't exist yet, skip it
      console.log('Documents table not found, skipping...');
    }

    // Get user names for deleted_by
    const userIds = [
      ...new Set([
        ...deletedClients.map((c: any) => c.deleted_by),
        ...deletedProjects.map((p: any) => p.deleted_by),
        ...deletedTasks.map((t: any) => t.deleted_by),
        ...deletedResources.map((r: any) => r.deleted_by),
        ...deletedDocuments.map((d: any) => d.deleted_by)
      ].filter(Boolean))
    ];

    const users: { [key: number]: string } = {};
    if (userIds.length > 0) {
      const placeholders = userIds.map(() => '?').join(',');
      const { results: userResults } = await DB.prepare(
        `SELECT id, name FROM users WHERE id IN (${placeholders})`
      ).bind(...userIds).all();
      
      userResults.forEach((user: any) => {
        users[user.id] = user.name;
      });
    }

    // Format response with type and deleted_by_name
    const items = {
      clients: deletedClients.map((client: any) => ({
        ...client,
        type: 'client',
        display_name: client.business_name || client.contact_name || 'Cliente sin nombre',
        deleted_by_name: users[client.deleted_by] || 'Usuario desconocido'
      })),
      projects: deletedProjects.map((project: any) => ({
        ...project,
        type: 'project',
        display_name: project.name || 'Proyecto sin nombre',
        deleted_by_name: users[project.deleted_by] || 'Usuario desconocido'
      })),
      tasks: deletedTasks.map((task: any) => ({
        ...task,
        type: 'task',
        display_name: task.title || 'Tarea sin nombre',
        deleted_by_name: users[task.deleted_by] || 'Usuario desconocido'
      })),
      resources: deletedResources.map((resource: any) => ({
        ...resource,
        type: 'resource',
        display_name: resource.title || 'Recurso sin nombre',
        deleted_by_name: users[resource.deleted_by] || 'Usuario desconocido'
      })),
      documents: deletedDocuments.map((document: any) => ({
        ...document,
        type: 'document',
        display_name: document.original_filename || document.filename || 'Documento sin nombre',
        deleted_by_name: users[document.deleted_by] || 'Usuario desconocido'
      }))
    };

    return c.json(items);
  } catch (error: any) {
    console.error('Error getting trash items:', error);
    return c.json({ error: 'Error al obtener elementos de la papelera', details: error.message }, 500);
  }
});

// Restore item
trash.post('/restore/:type/:id', requireRole('admin', 'team'), async (c) => {
  const { DB } = c.env;
  const type = c.req.param('type');
  const id = c.req.param('id');

  try {
    let table: string;
    let itemName: string;

    switch (type) {
      case 'client':
        table = 'clients';
        itemName = 'cliente';
        break;
      case 'project':
        table = 'projects';
        itemName = 'proyecto';
        break;
      case 'task':
        table = 'tasks';
        itemName = 'tarea';
        break;
      case 'resource':
        table = 'resources';
        itemName = 'recurso';
        break;
      case 'document':
        table = 'documents';
        itemName = 'documento';
        break;
      default:
        return c.json({ error: 'Tipo no válido' }, 400);
    }

    await DB.prepare(
      `UPDATE ${table} SET deleted_at = NULL, deleted_by = NULL WHERE id = ?`
    ).bind(id).run();

    return c.json({ 
      success: true, 
      message: `✅ ${itemName.charAt(0).toUpperCase() + itemName.slice(1)} restaurado correctamente` 
    });
  } catch (error: any) {
    console.error('Error restoring item:', error);
    return c.json({ error: 'Error al restaurar elemento', details: error.message }, 500);
  }
});

// Permanently delete item
trash.delete('/permanent/:type/:id', requireRole('admin'), async (c) => {
  const { DB } = c.env;
  const type = c.req.param('type');
  const id = c.req.param('id');

  try {
    let table: string;
    let itemName: string;

    switch (type) {
      case 'client':
        table = 'clients';
        itemName = 'cliente';
        // Delete related projects and tasks first
        await DB.prepare(`DELETE FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE client_id = ?)`).bind(id).run();
        await DB.prepare(`DELETE FROM projects WHERE client_id = ?`).bind(id).run();
        break;
      case 'project':
        table = 'projects';
        itemName = 'proyecto';
        // Delete related tasks first
        await DB.prepare(`DELETE FROM tasks WHERE project_id = ?`).bind(id).run();
        break;
      case 'task':
        table = 'tasks';
        itemName = 'tarea';
        break;
      case 'resource':
        table = 'resources';
        itemName = 'recurso';
        break;
      case 'document':
        table = 'documents';
        itemName = 'documento';
        // TODO: Delete from R2 storage if needed
        break;
      default:
        return c.json({ error: 'Tipo no válido' }, 400);
    }

    await DB.prepare(
      `DELETE FROM ${table} WHERE id = ?`
    ).bind(id).run();

    return c.json({ 
      success: true, 
      message: `✅ ${itemName.charAt(0).toUpperCase() + itemName.slice(1)} eliminado permanentemente` 
    });
  } catch (error: any) {
    console.error('Error permanently deleting item:', error);
    return c.json({ error: 'Error al eliminar permanentemente', details: error.message }, 500);
  }
});

// Empty trash (delete all permanently)
trash.delete('/empty', requireRole('admin'), async (c) => {
  const { DB } = c.env;

  try {
    // Delete in order to respect foreign keys
    await DB.prepare(`DELETE FROM tasks WHERE deleted_at IS NOT NULL`).run();
    await DB.prepare(`DELETE FROM projects WHERE deleted_at IS NOT NULL`).run();
    await DB.prepare(`DELETE FROM clients WHERE deleted_at IS NOT NULL`).run();
    await DB.prepare(`DELETE FROM resources WHERE deleted_at IS NOT NULL`).run();
    
    // Try to delete documents if table exists
    try {
      await DB.prepare(`DELETE FROM documents WHERE deleted_at IS NOT NULL`).run();
    } catch (e) {
      console.log('Documents table not found, skipping...');
    }

    return c.json({ 
      success: true, 
      message: '✅ Papelera vaciada correctamente' 
    });
  } catch (error: any) {
    console.error('Error emptying trash:', error);
    return c.json({ error: 'Error al vaciar papelera', details: error.message }, 500);
  }
});

export default trash;
