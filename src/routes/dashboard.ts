import { Hono } from 'hono';
import { Bindings } from '../types/database';
import { authMiddleware, requireRole } from '../middleware/auth';

const dashboard = new Hono<{ Bindings: Bindings }>();

dashboard.use('*', authMiddleware);

// Get dashboard metrics (admin and team)
dashboard.get('/metrics', requireRole('admin', 'team'), async (c) => {
  // Total clients
  const totalClients = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM clients'
  ).first();

  // Active clients
  const activeClients = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM clients WHERE subscription_status = 'active'"
  ).first();

  // Total projects
  const totalProjects = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM projects'
  ).first();

  // Active projects
  const activeProjects = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM projects WHERE status IN ('in_progress', 'review')"
  ).first();

  // Pending tasks
  const pendingTasks = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'"
  ).first();

  // Overdue tasks
  const overdueTasks = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM tasks WHERE status != 'completed' AND due_date < datetime('now')"
  ).first();

  // Upcoming events (next 7 days)
  const upcomingEvents = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM events WHERE start_datetime BETWEEN datetime('now') AND datetime('now', '+7 days')"
  ).first();

  // Monthly revenue (active subscriptions)
  const monthlyRevenue = await c.env.DB.prepare(
    "SELECT SUM(monthly_fee) as total FROM clients WHERE subscription_status = 'active'"
  ).first();

  // Projects by status
  const projectsByStatus = await c.env.DB.prepare(
    'SELECT status, COUNT(*) as count FROM projects GROUP BY status'
  ).all();

  // Tasks by priority (incomplete)
  const tasksByPriority = await c.env.DB.prepare(
    "SELECT priority, COUNT(*) as count FROM tasks WHERE status != 'completed' GROUP BY priority"
  ).all();

  return c.json({
    metrics: {
      clients: {
        total: totalClients?.count || 0,
        active: activeClients?.count || 0
      },
      projects: {
        total: totalProjects?.count || 0,
        active: activeProjects?.count || 0
      },
      tasks: {
        pending: pendingTasks?.count || 0,
        overdue: overdueTasks?.count || 0
      },
      events: {
        upcoming: upcomingEvents?.count || 0
      },
      revenue: {
        monthly: monthlyRevenue?.total || 0
      },
      projectsByStatus: projectsByStatus.results,
      tasksByPriority: tasksByPriority.results
    }
  });
});

// Get recent activity
dashboard.get('/activity', requireRole('admin', 'team'), async (c) => {
  // Recent projects
  const recentProjects = await c.env.DB.prepare(
    `SELECT p.id, p.name, p.status, p.created_at, c.business_name as client_name
     FROM projects p
     LEFT JOIN clients c ON p.client_id = c.id
     ORDER BY p.created_at DESC
     LIMIT 5`
  ).all();

  // Recent tasks
  const recentTasks = await c.env.DB.prepare(
    `SELECT t.id, t.title, t.status, t.created_at, p.name as project_name
     FROM tasks t
     LEFT JOIN projects p ON t.project_id = p.id
     ORDER BY t.created_at DESC
     LIMIT 5`
  ).all();

  // Recent communications
  const recentComms = await c.env.DB.prepare(
    `SELECT com.id, com.type, com.subject, com.communication_date,
            c.business_name as client_name, u.name as user_name
     FROM communications com
     LEFT JOIN clients c ON com.client_id = c.id
     LEFT JOIN users u ON com.user_id = u.id
     ORDER BY com.communication_date DESC
     LIMIT 5`
  ).all();

  return c.json({
    activity: {
      recentProjects: recentProjects.results,
      recentTasks: recentTasks.results,
      recentCommunications: recentComms.results
    }
  });
});

// Client dashboard (limited view)
dashboard.get('/client', requireRole('client'), async (c) => {
  const user = c.get('user');

  // Get client info
  const client = await c.env.DB.prepare(
    'SELECT * FROM clients WHERE user_id = ?'
  ).bind(user.id).first();

  if (!client) {
    return c.json({ error: 'Cliente no encontrado' }, 404);
  }

  // Client's projects count
  const projectsCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM projects WHERE client_id = ?'
  ).bind(client.id).first();

  // Client's active projects
  const activeProjects = await c.env.DB.prepare(
    `SELECT * FROM projects 
     WHERE client_id = ? AND status IN ('in_progress', 'review')
     ORDER BY created_at DESC`
  ).bind(client.id).all();

  // Client's pending tasks
  const pendingTasks = await c.env.DB.prepare(
    `SELECT t.* FROM tasks t
     LEFT JOIN projects p ON t.project_id = p.id
     WHERE p.client_id = ? AND t.status != 'completed'
     ORDER BY t.due_date ASC
     LIMIT 10`
  ).bind(client.id).all();

  // Upcoming events
  const upcomingEvents = await c.env.DB.prepare(
    `SELECT * FROM events 
     WHERE client_id = ? AND start_datetime >= datetime('now')
     ORDER BY start_datetime ASC
     LIMIT 5`
  ).bind(client.id).all();

  return c.json({
    client: client,
    metrics: {
      totalProjects: projectsCount?.count || 0,
      activeProjects: activeProjects.results.length
    },
    activeProjects: activeProjects.results,
    pendingTasks: pendingTasks.results,
    upcomingEvents: upcomingEvents.results
  });
});

export default dashboard;
