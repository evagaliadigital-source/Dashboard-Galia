import { Hono } from 'hono';
import { Bindings } from '../types/database';
import { authMiddleware, requireRole } from '../middleware/auth';

const projects = new Hono<{ Bindings: Bindings }>();

projects.use('*', authMiddleware);

// Get all projects
projects.get('/', async (c) => {
  const user = c.get('user');
  const projectType = c.req.query('type'); // Filter: 'client' | 'internal' | 'company'
  
  let query = `
    SELECT p.*, c.business_name as client_name, 
           u.name as assigned_name, cr.name as creator_name
    FROM projects p
    LEFT JOIN clients c ON p.client_id = c.id
    LEFT JOIN users u ON p.assigned_to = u.id
    LEFT JOIN users cr ON p.created_by = cr.id
  `;

  const conditions = [];
  const bindings = [];

  // Clients only see their projects
  if (user.role === 'client') {
    conditions.push('c.user_id = ?');
    bindings.push(user.id);
  }

  // Filter by project type if specified
  if (projectType && ['client', 'internal', 'company'].includes(projectType)) {
    conditions.push('p.project_type = ?');
    bindings.push(projectType);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY p.created_at DESC';

  const { results } = await c.env.DB.prepare(query).bind(...bindings).all();
  return c.json({ projects: results });
});

// Get single project
projects.get('/:id', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');

  const project = await c.env.DB.prepare(
    `SELECT p.*, c.business_name as client_name, c.user_id as client_user_id,
            u.name as assigned_name, cr.name as creator_name
     FROM projects p
     LEFT JOIN clients c ON p.client_id = c.id
     LEFT JOIN users u ON p.assigned_to = u.id
     LEFT JOIN users cr ON p.created_by = cr.id
     WHERE p.id = ?`
  ).bind(id).first();

  if (!project) {
    return c.json({ error: 'Proyecto no encontrado' }, 404);
  }

  // Check client access
  if (user.role === 'client' && project.client_user_id !== user.id) {
    return c.json({ error: 'Sin permisos' }, 403);
  }

  return c.json({ project });
});

// Create project
projects.post('/', requireRole('admin', 'team'), async (c) => {
  const data = await c.req.json();
  const user = c.get('user');

  // Determine project_type: if client_id exists, it's 'client', otherwise use provided type or default to 'internal'
  let projectType = data.project_type || 'internal';
  if (data.client_id) {
    projectType = 'client';
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO projects (
      client_id, name, description, status, priority, start_date,
      deadline, budget, brief, assigned_to, created_by, project_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    data.client_id || null,
    data.name,
    data.description || null,
    data.status || 'pending',
    data.priority || 'medium',
    data.start_date || null,
    data.deadline || null,
    data.budget || null,
    data.brief || null,
    data.assigned_to || null,
    user.id,
    projectType
  ).run();

  const newProject = await c.env.DB.prepare(
    'SELECT * FROM projects WHERE id = ?'
  ).bind(result.meta.last_row_id).first();

  return c.json({ project: newProject }, 201);
});

// Update project
projects.put('/:id', requireRole('admin', 'team'), async (c) => {
  const id = c.req.param('id');
  const data = await c.req.json();

  // Get current project to merge with updates
  const currentProject = await c.env.DB.prepare(
    'SELECT * FROM projects WHERE id = ?'
  ).bind(id).first();

  if (!currentProject) {
    return c.json({ error: 'Proyecto no encontrado' }, 404);
  }

  // Merge current data with updates
  const merged = {
    name: data.name ?? currentProject.name,
    description: data.description ?? currentProject.description,
    status: data.status ?? currentProject.status,
    priority: data.priority ?? currentProject.priority,
    start_date: data.start_date ?? currentProject.start_date,
    deadline: data.deadline ?? currentProject.deadline,
    budget: data.budget ?? currentProject.budget,
    brief: data.brief ?? currentProject.brief,
    assigned_to: data.assigned_to ?? currentProject.assigned_to,
    client_id: data.client_id ?? currentProject.client_id,
    project_type: data.project_type ?? currentProject.project_type
  };

  const completed_at = merged.status === 'completed' && !currentProject.completed_at 
    ? new Date().toISOString() 
    : (data.completed_at ?? currentProject.completed_at);

  // Determine project_type: if client_id exists, it's 'client', otherwise use provided type
  let projectType = merged.project_type;
  if (merged.client_id) {
    projectType = 'client';
  }

  await c.env.DB.prepare(
    `UPDATE projects SET 
      name = ?, description = ?, status = ?, priority = ?,
      start_date = ?, deadline = ?, budget = ?, brief = ?,
      assigned_to = ?, completed_at = ?, project_type = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(
    merged.name,
    merged.description,
    merged.status,
    merged.priority,
    merged.start_date,
    merged.deadline,
    merged.budget,
    merged.brief,
    merged.assigned_to,
    completed_at,
    projectType,
    id
  ).run();

  const updatedProject = await c.env.DB.prepare(
    'SELECT * FROM projects WHERE id = ?'
  ).bind(id).first();

  return c.json({ project: updatedProject });
});

// Delete project
projects.delete('/:id', requireRole('admin'), async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
  return c.json({ message: 'Proyecto eliminado' });
});

// Get project tasks
projects.get('/:id/tasks', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');

  // Check access for clients
  if (user.role === 'client') {
    const project = await c.env.DB.prepare(
      `SELECT c.user_id FROM projects p
       LEFT JOIN clients c ON p.client_id = c.id
       WHERE p.id = ?`
    ).bind(id).first();
    
    if (!project || project.user_id !== user.id) {
      return c.json({ error: 'Sin permisos' }, 403);
    }
  }

  const { results } = await c.env.DB.prepare(
    `SELECT t.*, u.name as assigned_name
     FROM tasks t
     LEFT JOIN users u ON t.assigned_to = u.id
     WHERE t.project_id = ?
     ORDER BY t.created_at DESC`
  ).bind(id).all();

  return c.json({ tasks: results });
});

// Create task for project
projects.post('/:id/tasks', requireRole('admin', 'team'), async (c) => {
  const project_id = c.req.param('id');
  const data = await c.req.json();

  const result = await c.env.DB.prepare(
    `INSERT INTO tasks (
      project_id, title, description, status, priority,
      assigned_to, due_date, checklist
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    project_id,
    data.title,
    data.description || null,
    data.status || 'pending',
    data.priority || 'medium',
    data.assigned_to || null,
    data.due_date || null,
    data.checklist || null
  ).run();

  const newTask = await c.env.DB.prepare(
    'SELECT * FROM tasks WHERE id = ?'
  ).bind(result.meta.last_row_id).first();

  return c.json({ task: newTask }, 201);
});

// Get project comments
projects.get('/:id/comments', async (c) => {
  const id = c.req.param('id');

  const { results } = await c.env.DB.prepare(
    `SELECT c.*, u.name as user_name, u.avatar_url
     FROM comments c
     LEFT JOIN users u ON c.user_id = u.id
     WHERE c.entity_type = 'project' AND c.entity_id = ?
     ORDER BY c.created_at DESC`
  ).bind(id).all();

  return c.json({ comments: results });
});

// Add comment to project
projects.post('/:id/comments', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const { content } = await c.req.json();
  const user = c.get('user');

  const result = await c.env.DB.prepare(
    `INSERT INTO comments (entity_type, entity_id, user_id, content)
     VALUES ('project', ?, ?, ?)`
  ).bind(id, user.id, content).run();

  const newComment = await c.env.DB.prepare(
    `SELECT c.*, u.name as user_name, u.avatar_url
     FROM comments c
     LEFT JOIN users u ON c.user_id = u.id
     WHERE c.id = ?`
  ).bind(result.meta.last_row_id).first();

  return c.json({ comment: newComment }, 201);
});

export default projects;
