import { Hono } from 'hono';
import { Bindings, Client } from '../types/database';
import { authMiddleware, requireRole } from '../middleware/auth';

const clients = new Hono<{ Bindings: Bindings }>();

// Apply auth middleware to all routes
clients.use('*', authMiddleware);

// Get all clients (admin and team only)
clients.get('/', requireRole('admin', 'team'), async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT c.*, u.name as user_name, u.email as user_email 
     FROM clients c 
     LEFT JOIN users u ON c.user_id = u.id 
     ORDER BY c.created_at DESC`
  ).all();

  return c.json({ clients: results });
});

// Get single client
clients.get('/:id', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');

  const client = await c.env.DB.prepare(
    `SELECT c.*, u.name as user_name, u.email as user_email 
     FROM clients c 
     LEFT JOIN users u ON c.user_id = u.id 
     WHERE c.id = ?`
  ).bind(id).first();

  if (!client) {
    return c.json({ error: 'Cliente no encontrado' }, 404);
  }

  // Clients can only see their own data
  if (user.role === 'client' && client.user_id !== user.id) {
    return c.json({ error: 'Sin permisos' }, 403);
  }

  return c.json({ client });
});

// Create client (admin and team only)
clients.post('/', requireRole('admin', 'team'), async (c) => {
  const data = await c.req.json();
  
  const result = await c.env.DB.prepare(
    `INSERT INTO clients (
      business_name, contact_name, email, phone, address, city, country,
      website, instagram, facebook, subscription_status, subscription_start,
      subscription_end, monthly_fee, notes, user_id,
      lead_quality, client_status, collective
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    data.business_name,
    data.contact_name,
    data.email,
    data.phone,
    data.address || null,
    data.city || null,
    data.country || 'España',
    data.website || null,
    data.instagram || null,
    data.facebook || null,
    data.subscription_status || 'trial',
    data.subscription_start || null,
    data.subscription_end || null,
    data.monthly_fee || null,
    data.notes || null,
    data.user_id || null,
    data.lead_quality || 'cold',
    data.client_status || 'prospect',
    data.collective || null
  ).run();

  const newClient = await c.env.DB.prepare(
    'SELECT * FROM clients WHERE id = ?'
  ).bind(result.meta.last_row_id).first();

  return c.json({ client: newClient }, 201);
});

// Update client
clients.put('/:id', requireRole('admin', 'team'), async (c) => {
  const id = c.req.param('id');
  const data = await c.req.json();

  await c.env.DB.prepare(
    `UPDATE clients SET 
      business_name = ?, contact_name = ?, email = ?, phone = ?,
      address = ?, city = ?, country = ?, website = ?,
      instagram = ?, facebook = ?, subscription_status = ?,
      subscription_start = ?, subscription_end = ?, monthly_fee = ?,
      notes = ?, lead_quality = ?, client_status = ?, collective = ?,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(
    data.business_name,
    data.contact_name,
    data.email,
    data.phone,
    data.address || null,
    data.city || null,
    data.country || 'España',
    data.website || null,
    data.instagram || null,
    data.facebook || null,
    data.subscription_status,
    data.subscription_start || null,
    data.subscription_end || null,
    data.monthly_fee || null,
    data.notes || null,
    data.lead_quality || 'cold',
    data.client_status || 'prospect',
    data.collective || null,
    id
  ).run();

  const updatedClient = await c.env.DB.prepare(
    'SELECT * FROM clients WHERE id = ?'
  ).bind(id).first();

  return c.json({ client: updatedClient });
});

// Delete client (admin only)
clients.delete('/:id', requireRole('admin'), async (c) => {
  const id = c.req.param('id');

  await c.env.DB.prepare('DELETE FROM clients WHERE id = ?').bind(id).run();

  return c.json({ message: 'Cliente eliminado' });
});

// Get client's projects
clients.get('/:id/projects', async (c) => {
  const id = c.req.param('id');
  const user = c.get('user');

  // Check access
  if (user.role === 'client') {
    const client = await c.env.DB.prepare(
      'SELECT user_id FROM clients WHERE id = ?'
    ).bind(id).first();
    
    if (!client || client.user_id !== user.id) {
      return c.json({ error: 'Sin permisos' }, 403);
    }
  }

  const { results } = await c.env.DB.prepare(
    `SELECT p.*, u.name as assigned_name, c.name as creator_name
     FROM projects p
     LEFT JOIN users u ON p.assigned_to = u.id
     LEFT JOIN users c ON p.created_by = c.id
     WHERE p.client_id = ?
     ORDER BY p.created_at DESC`
  ).bind(id).all();

  return c.json({ projects: results });
});

// Get client's communications
clients.get('/:id/communications', requireRole('admin', 'team'), async (c) => {
  const id = c.req.param('id');

  const { results } = await c.env.DB.prepare(
    `SELECT com.*, u.name as user_name
     FROM communications com
     LEFT JOIN users u ON com.user_id = u.id
     WHERE com.client_id = ?
     ORDER BY com.communication_date DESC`
  ).bind(id).all();

  return c.json({ communications: results });
});

// Add communication
clients.post('/:id/communications', requireRole('admin', 'team'), async (c) => {
  const id = c.req.param('id');
  const data = await c.req.json();
  const user = c.get('user');

  const result = await c.env.DB.prepare(
    `INSERT INTO communications (client_id, user_id, type, subject, content)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(
    id,
    user.id,
    data.type,
    data.subject || null,
    data.content || null
  ).run();

  const newComm = await c.env.DB.prepare(
    `SELECT com.*, u.name as user_name
     FROM communications com
     LEFT JOIN users u ON com.user_id = u.id
     WHERE com.id = ?`
  ).bind(result.meta.last_row_id).first();

  return c.json({ communication: newComm }, 201);
});

export default clients;
