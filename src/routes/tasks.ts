import { Hono } from 'hono';
import { Bindings } from '../types/database';
import { authMiddleware, requireRole } from '../middleware/auth';

const tasks = new Hono<{ Bindings: Bindings }>();

tasks.use('*', authMiddleware);

// Get all tasks (with filters)
tasks.get('/', async (c) => {
  const user = c.get('user');
  const status = c.req.query('status');
  const assigned_to = c.req.query('assigned_to');

  let query = `
    SELECT t.*, p.name as project_name, c.business_name as client_name,
           u.name as assigned_name
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN clients c ON p.client_id = c.id
    LEFT JOIN users u ON t.assigned_to = u.id
    WHERE 1=1
  `;

  const bindings: any[] = [];

  // Clients only see tasks from their projects
  if (user.role === 'client') {
    query += ' AND c.user_id = ?';
    bindings.push(user.id);
  }

  if (status) {
    query += ' AND t.status = ?';
    bindings.push(status);
  }

  if (assigned_to) {
    query += ' AND t.assigned_to = ?';
    bindings.push(parseInt(assigned_to));
  }

  query += ' ORDER BY t.due_date ASC, t.created_at DESC';

  const { results } = await c.env.DB.prepare(query).bind(...bindings).all();
  return c.json({ tasks: results });
});

// Get single task
tasks.get('/:id', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');

  const task = await c.env.DB.prepare(
    `SELECT t.*, p.name as project_name, p.client_id, c.business_name as client_name,
            c.user_id as client_user_id, u.name as assigned_name
     FROM tasks t
     LEFT JOIN projects p ON t.project_id = p.id
     LEFT JOIN clients c ON p.client_id = c.id
     LEFT JOIN users u ON t.assigned_to = u.id
     WHERE t.id = ?`
  ).bind(id).first();

  if (!task) {
    return c.json({ error: 'Tarea no encontrada' }, 404);
  }

  if (user.role === 'client' && task.client_user_id !== user.id) {
    return c.json({ error: 'Sin permisos' }, 403);
  }

  return c.json({ task });
});

// Create task
tasks.post('/', requireRole('admin', 'team'), async (c) => {
  const data = await c.req.json();
  const user = c.get('user');

  // Convert assigned_to to number if it's a string number, otherwise null
  let assignedTo = null;
  if (data.assigned_to) {
    const parsed = parseInt(data.assigned_to);
    assignedTo = isNaN(parsed) ? null : parsed;
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO tasks (
      title, description, status, priority, project_id,
      assigned_to, due_date, checklist, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    data.title,
    data.description || null,
    data.status || 'pending',
    data.priority || 'medium',
    data.project_id || null,
    assignedTo,
    data.due_date || null,
    data.checklist || null,
    user.id
  ).run();

  const newTask = await c.env.DB.prepare(
    'SELECT * FROM tasks WHERE id = ?'
  ).bind(result.meta.last_row_id).first();

  return c.json({ task: newTask }, 201);
});

// Update task
tasks.put('/:id', requireRole('admin', 'team'), async (c) => {
  const id = c.req.param('id');
  const data = await c.req.json();

  const completed_at = data.status === 'completed' && !data.completed_at
    ? new Date().toISOString()
    : data.completed_at;

  // Convert assigned_to to number if it's a string number, otherwise null
  let assignedTo = null;
  if (data.assigned_to) {
    const parsed = parseInt(data.assigned_to);
    assignedTo = isNaN(parsed) ? null : parsed;
  }

  await c.env.DB.prepare(
    `UPDATE tasks SET 
      title = ?, description = ?, status = ?, priority = ?,
      assigned_to = ?, due_date = ?, checklist = ?,
      completed_at = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(
    data.title,
    data.description || null,
    data.status,
    data.priority,
    assignedTo,
    data.due_date || null,
    data.checklist || null,
    completed_at || null,
    id
  ).run();

  const updatedTask = await c.env.DB.prepare(
    'SELECT * FROM tasks WHERE id = ?'
  ).bind(id).first();

  return c.json({ task: updatedTask });
});

// Delete task
tasks.delete('/:id', requireRole('admin', 'team'), async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM tasks WHERE id = ?').bind(id).run();
  return c.json({ message: 'Tarea eliminada' });
});

// Get task comments
tasks.get('/:id/comments', async (c) => {
  const id = c.req.param('id');

  const { results } = await c.env.DB.prepare(
    `SELECT c.*, u.name as user_name, u.avatar_url
     FROM comments c
     LEFT JOIN users u ON c.user_id = u.id
     WHERE c.entity_type = 'task' AND c.entity_id = ?
     ORDER BY c.created_at DESC`
  ).bind(id).all();

  return c.json({ comments: results });
});

// Add comment to task
tasks.post('/:id/comments', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const { content } = await c.req.json();
  const user = c.get('user');

  const result = await c.env.DB.prepare(
    `INSERT INTO comments (entity_type, entity_id, user_id, content)
     VALUES ('task', ?, ?, ?)`
  ).bind(id, user.id, content).run();

  const newComment = await c.env.DB.prepare(
    `SELECT c.*, u.name as user_name, u.avatar_url
     FROM comments c
     LEFT JOIN users u ON c.user_id = u.id
     WHERE c.id = ?`
  ).bind(result.meta.last_row_id).first();

  return c.json({ comment: newComment }, 201);
});

export default tasks;
