import { Hono } from 'hono';
import { Bindings } from '../types/database';
import { authMiddleware, requireRole } from '../middleware/auth';

const events = new Hono<{ Bindings: Bindings }>();

events.use('*', authMiddleware);

// Get all events
events.get('/', async (c) => {
  const user = c.get('user');
  const start = c.req.query('start'); // Filter by date range
  const end = c.req.query('end');

  let query = `
    SELECT e.*, c.business_name as client_name, p.name as project_name,
           u.name as creator_name
    FROM events e
    LEFT JOIN clients c ON e.client_id = c.id
    LEFT JOIN projects p ON e.project_id = p.id
    LEFT JOIN users u ON e.created_by = u.id
    WHERE 1=1
  `;

  const bindings: any[] = [];

  // Clients only see their events
  if (user.role === 'client') {
    query += ' AND c.user_id = ?';
    bindings.push(user.id);
  }

  if (start) {
    query += ' AND e.start_datetime >= ?';
    bindings.push(start);
  }

  if (end) {
    query += ' AND e.start_datetime <= ?';
    bindings.push(end);
  }

  query += ' ORDER BY e.start_datetime ASC';

  const { results } = await c.env.DB.prepare(query).bind(...bindings).all();
  return c.json({ events: results });
});

// Get single event
events.get('/:id', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');

  const event = await c.env.DB.prepare(
    `SELECT e.*, c.business_name as client_name, c.user_id as client_user_id,
            p.name as project_name, u.name as creator_name
     FROM events e
     LEFT JOIN clients c ON e.client_id = c.id
     LEFT JOIN projects p ON e.project_id = p.id
     LEFT JOIN users u ON e.created_by = u.id
     WHERE e.id = ?`
  ).bind(id).first();

  if (!event) {
    return c.json({ error: 'Evento no encontrado' }, 404);
  }

  if (user.role === 'client' && event.client_user_id !== user.id) {
    return c.json({ error: 'Sin permisos' }, 403);
  }

  return c.json({ event });
});

// Create event
events.post('/', requireRole('admin', 'team'), async (c) => {
  const data = await c.req.json();
  const user = c.get('user');

  const result = await c.env.DB.prepare(
    `INSERT INTO events (
      title, description, event_type, client_id, project_id,
      start_datetime, end_datetime, location, attendees, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    data.title,
    data.description || null,
    data.event_type || 'meeting',
    data.client_id || null,
    data.project_id || null,
    data.start_datetime,
    data.end_datetime || null,
    data.location || null,
    data.attendees || null,
    user.id
  ).run();

  const newEvent = await c.env.DB.prepare(
    'SELECT * FROM events WHERE id = ?'
  ).bind(result.meta.last_row_id).first();

  return c.json({ event: newEvent }, 201);
});

// Update event
events.put('/:id', requireRole('admin', 'team'), async (c) => {
  const id = c.req.param('id');
  const data = await c.req.json();

  await c.env.DB.prepare(
    `UPDATE events SET 
      title = ?, description = ?, event_type = ?, client_id = ?,
      project_id = ?, start_datetime = ?, end_datetime = ?,
      location = ?, attendees = ?
     WHERE id = ?`
  ).bind(
    data.title,
    data.description || null,
    data.event_type,
    data.client_id || null,
    data.project_id || null,
    data.start_datetime,
    data.end_datetime || null,
    data.location || null,
    data.attendees || null,
    id
  ).run();

  const updatedEvent = await c.env.DB.prepare(
    'SELECT * FROM events WHERE id = ?'
  ).bind(id).first();

  return c.json({ event: updatedEvent });
});

// Delete event
events.delete('/:id', requireRole('admin', 'team'), async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM events WHERE id = ?').bind(id).run();
  return c.json({ message: 'Evento eliminado' });
});

export default events;
