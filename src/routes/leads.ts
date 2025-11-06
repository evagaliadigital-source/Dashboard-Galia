import { Hono } from 'hono';
import { Bindings } from '../types/database';
import { authMiddleware, requireRole } from '../middleware/auth';

const leads = new Hono<{ Bindings: Bindings }>();

leads.use('*', authMiddleware);

// Get all leads (excluding deleted)
leads.get('/', requireRole('admin', 'team'), async (c) => {
  const { DB } = c.env;
  
  try {
    const { results } = await DB.prepare(
      `SELECT * FROM leads 
       WHERE deleted_at IS NULL 
       ORDER BY 
         CASE stage 
           WHEN 'new_lead' THEN 1 
           WHEN 'contacted' THEN 2 
           WHEN 'qualified' THEN 3 
           WHEN 'negotiation' THEN 4 
           WHEN 'proposal' THEN 5 
           WHEN 'won' THEN 6 
           WHEN 'lost' THEN 7 
         END,
         created_at DESC`
    ).all();
    
    return c.json({ leads: results });
  } catch (error: any) {
    console.error('Error getting leads:', error);
    return c.json({ error: 'Error al obtener leads', details: error.message }, 500);
  }
});

// Get single lead
leads.get('/:id', requireRole('admin', 'team'), async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  
  try {
    const lead = await DB.prepare(
      'SELECT * FROM leads WHERE id = ? AND deleted_at IS NULL'
    ).bind(id).first();
    
    if (!lead) {
      return c.json({ error: 'Lead no encontrado' }, 404);
    }
    
    return c.json({ lead });
  } catch (error: any) {
    console.error('Error getting lead:', error);
    return c.json({ error: 'Error al obtener lead', details: error.message }, 500);
  }
});

// Create new lead
leads.post('/', requireRole('admin', 'team'), async (c) => {
  const { DB } = c.env;
  const user = c.get('user');
  
  try {
    const body = await c.req.json();
    
    const result = await DB.prepare(
      `INSERT INTO leads (
        business_name, contact_name, email, phone,
        address, city, website, instagram,
        stage, lead_quality, lead_source,
        estimated_value, probability,
        first_contact_date, last_contact_date, next_followup_date,
        collective, notes, assigned_to
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      body.business_name,
      body.contact_name,
      body.email,
      body.phone,
      body.address || null,
      body.city || null,
      body.website || null,
      body.instagram || null,
      body.stage || 'new_lead',
      body.lead_quality || 'cold',
      body.lead_source || null,
      body.estimated_value || 0,
      body.probability || 50,
      body.first_contact_date || null,
      body.last_contact_date || null,
      body.next_followup_date || null,
      body.collective || null,
      body.notes || null,
      body.assigned_to || user.id
    ).run();
    
    return c.json({ 
      success: true, 
      id: result.meta.last_row_id,
      message: 'Lead creado correctamente' 
    }, 201);
  } catch (error: any) {
    console.error('Error creating lead:', error);
    return c.json({ error: 'Error al crear lead', details: error.message }, 500);
  }
});

// Update lead
leads.put('/:id', requireRole('admin', 'team'), async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  
  try {
    const body = await c.req.json();
    
    await DB.prepare(
      `UPDATE leads SET
        business_name = ?,
        contact_name = ?,
        email = ?,
        phone = ?,
        address = ?,
        city = ?,
        website = ?,
        instagram = ?,
        stage = ?,
        lead_quality = ?,
        lead_source = ?,
        estimated_value = ?,
        probability = ?,
        first_contact_date = ?,
        last_contact_date = ?,
        next_followup_date = ?,
        expected_close_date = ?,
        collective = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NULL`
    ).bind(
      body.business_name,
      body.contact_name,
      body.email,
      body.phone,
      body.address || null,
      body.city || null,
      body.website || null,
      body.instagram || null,
      body.stage,
      body.lead_quality,
      body.lead_source || null,
      body.estimated_value || 0,
      body.probability || 50,
      body.first_contact_date || null,
      body.last_contact_date || null,
      body.next_followup_date || null,
      body.expected_close_date || null,
      body.collective || null,
      body.notes || null,
      id
    ).run();
    
    return c.json({ success: true, message: 'Lead actualizado correctamente' });
  } catch (error: any) {
    console.error('Error updating lead:', error);
    return c.json({ error: 'Error al actualizar lead', details: error.message }, 500);
  }
});

// Update lead stage (for drag & drop)
leads.patch('/:id/stage', requireRole('admin', 'team'), async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  
  try {
    const { stage } = await c.req.json();
    
    await DB.prepare(
      `UPDATE leads SET
        stage = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NULL`
    ).bind(stage, id).run();
    
    return c.json({ success: true, message: 'Etapa actualizada' });
  } catch (error: any) {
    console.error('Error updating stage:', error);
    return c.json({ error: 'Error al actualizar etapa', details: error.message }, 500);
  }
});

// Convert lead to client
leads.post('/:id/convert', requireRole('admin', 'team'), async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  
  try {
    // Get lead data
    const lead = await DB.prepare(
      'SELECT * FROM leads WHERE id = ? AND deleted_at IS NULL'
    ).bind(id).first();
    
    if (!lead) {
      return c.json({ error: 'Lead no encontrado' }, 404);
    }
    
    // Create client from lead
    const clientResult = await DB.prepare(
      `INSERT INTO clients (
        business_name, contact_name, email, phone,
        address, city, website, instagram,
        client_status, lead_quality, collective,
        subscription_status, monthly_fee, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, 'active', 60, ?)`
    ).bind(
      lead.business_name,
      lead.contact_name,
      lead.email,
      lead.phone,
      lead.address,
      lead.city,
      lead.website,
      lead.instagram,
      lead.lead_quality,
      lead.collective,
      lead.notes
    ).run();
    
    const clientId = clientResult.meta.last_row_id;
    
    // Update lead as won and converted
    await DB.prepare(
      `UPDATE leads SET
        stage = 'won',
        converted_to_client_id = ?,
        conversion_date = CURRENT_DATE,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`
    ).bind(clientId, id).run();
    
    return c.json({ 
      success: true, 
      clientId,
      message: '✅ Lead convertido a cliente correctamente' 
    });
  } catch (error: any) {
    console.error('Error converting lead:', error);
    return c.json({ error: 'Error al convertir lead', details: error.message }, 500);
  }
});

// Soft delete lead
leads.delete('/:id', requireRole('admin'), async (c) => {
  const { DB } = c.env;
  const id = c.req.param('id');
  const user = c.get('user');
  
  try {
    await DB.prepare(
      `UPDATE leads SET
        deleted_at = CURRENT_TIMESTAMP,
        deleted_by = ?
      WHERE id = ?`
    ).bind(user.id, id).run();
    
    return c.json({ success: true, message: 'Lead eliminado correctamente' });
  } catch (error: any) {
    console.error('Error deleting lead:', error);
    return c.json({ error: 'Error al eliminar lead', details: error.message }, 500);
  }
});

// Get pipeline metrics
leads.get('/metrics/pipeline', requireRole('admin', 'team'), async (c) => {
  const { DB } = c.env;
  
  try {
    // Count by stage
    const { results: stageStats } = await DB.prepare(
      `SELECT stage, COUNT(*) as count, SUM(estimated_value) as total_value
       FROM leads 
       WHERE deleted_at IS NULL AND stage NOT IN ('won', 'lost')
       GROUP BY stage`
    ).all();
    
    // Won/Lost stats
    const wonCount = await DB.prepare(
      'SELECT COUNT(*) as count, SUM(estimated_value) as total_value FROM leads WHERE stage = "won" AND deleted_at IS NULL'
    ).first();
    
    const lostCount = await DB.prepare(
      'SELECT COUNT(*) as count FROM leads WHERE stage = "lost" AND deleted_at IS NULL'
    ).first();
    
    // Conversion rate
    const totalLeads = await DB.prepare(
      'SELECT COUNT(*) as count FROM leads WHERE deleted_at IS NULL AND stage NOT IN ("won", "lost")'
    ).first();
    
    return c.json({
      stageStats: stageStats,
      won: wonCount,
      lost: lostCount,
      activeLeads: totalLeads?.count || 0,
      conversionRate: wonCount && totalLeads ? ((wonCount.count / (wonCount.count + totalLeads.count)) * 100).toFixed(1) : 0
    });
  } catch (error: any) {
    console.error('Error getting metrics:', error);
    return c.json({ error: 'Error al obtener métricas', details: error.message }, 500);
  }
});

export default leads;
