import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { Bindings } from '../types/database';

const app = new Hono<{ Bindings: Bindings }>();

// Apply auth middleware to all routes
app.use('*', authMiddleware);

// GET /api/notes - Get all notes with filters
app.get('/', async (c) => {
  try {
    const user = c.get('user');
    const { category, linked_type, linked_id, search, pinned_only } = c.req.query();

    let query = `
      SELECT * FROM notes 
      WHERE created_by = ?
    `;
    const params: any[] = [user.id];

    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }

    if (linked_type) {
      query += ` AND linked_type = ?`;
      params.push(linked_type);
    }

    if (linked_id) {
      query += ` AND linked_id = ?`;
      params.push(parseInt(linked_id));
    }

    if (pinned_only === 'true') {
      query += ` AND is_pinned = 1`;
    }

    if (search) {
      query += ` AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY is_pinned DESC, created_at DESC`;

    const { results } = await c.env.DB.prepare(query).bind(...params).all();

    return c.json(results);
  } catch (error: any) {
    console.error('Error fetching notes:', error);
    return c.json({ error: error.message }, 500);
  }
});

// GET /api/notes/:id - Get single note
app.get('/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    const note = await c.env.DB.prepare(`
      SELECT * FROM notes WHERE id = ? AND created_by = ?
    `).bind(id, user.id).first();

    if (!note) {
      return c.json({ error: 'Nota no encontrada' }, 404);
    }

    return c.json(note);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// POST /api/notes - Create note
app.post('/', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    const { title, content, category, linked_type, linked_id, tags, priority, reminder_date } = body;

    if (!title || !content) {
      return c.json({ error: 'Título y contenido son requeridos' }, 400);
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO notes (
        title, content, category, linked_type, linked_id, 
        tags, priority, reminder_date, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      title,
      content,
      category || 'otro',
      linked_type || 'none',
      linked_id || null,
      tags ? JSON.stringify(tags) : null,
      priority || 'medium',
      reminder_date || null,
      user.id
    ).run();

    const newNote = await c.env.DB.prepare(`
      SELECT * FROM notes WHERE id = ?
    `).bind(result.meta.last_row_id).first();

    return c.json(newNote, 201);
  } catch (error: any) {
    console.error('Error creating note:', error);
    return c.json({ error: error.message }, 500);
  }
});

// PUT /api/notes/:id - Update note
app.put('/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json();

    const { title, content, category, linked_type, linked_id, tags, priority, is_pinned, reminder_date } = body;

    const note = await c.env.DB.prepare(`
      SELECT * FROM notes WHERE id = ? AND created_by = ?
    `).bind(id, user.id).first();

    if (!note) {
      return c.json({ error: 'Nota no encontrada' }, 404);
    }

    await c.env.DB.prepare(`
      UPDATE notes SET
        title = ?,
        content = ?,
        category = ?,
        linked_type = ?,
        linked_id = ?,
        tags = ?,
        priority = ?,
        is_pinned = ?,
        reminder_date = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      title || note.title,
      content || note.content,
      category || note.category,
      linked_type || note.linked_type,
      linked_id !== undefined ? linked_id : note.linked_id,
      tags ? JSON.stringify(tags) : note.tags,
      priority || note.priority,
      is_pinned !== undefined ? is_pinned : note.is_pinned,
      reminder_date !== undefined ? reminder_date : note.reminder_date,
      id
    ).run();

    const updatedNote = await c.env.DB.prepare(`
      SELECT * FROM notes WHERE id = ?
    `).bind(id).first();

    return c.json(updatedNote);
  } catch (error: any) {
    console.error('Error updating note:', error);
    return c.json({ error: error.message }, 500);
  }
});

// DELETE /api/notes/:id - Delete note
app.delete('/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    const note = await c.env.DB.prepare(`
      SELECT * FROM notes WHERE id = ? AND created_by = ?
    `).bind(id, user.id).first();

    if (!note) {
      return c.json({ error: 'Nota no encontrada' }, 404);
    }

    await c.env.DB.prepare(`
      DELETE FROM notes WHERE id = ?
    `).bind(id).run();

    return c.json({ message: 'Nota eliminada' });
  } catch (error: any) {
    console.error('Error deleting note:', error);
    return c.json({ error: error.message }, 500);
  }
});

// POST /api/notes/:id/pin - Toggle pin status
app.post('/:id/pin', async (c) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    const note = await c.env.DB.prepare(`
      SELECT * FROM notes WHERE id = ? AND created_by = ?
    `).bind(id, user.id).first();

    if (!note) {
      return c.json({ error: 'Nota no encontrada' }, 404);
    }

    const newPinStatus = note.is_pinned ? 0 : 1;

    await c.env.DB.prepare(`
      UPDATE notes SET is_pinned = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(newPinStatus, id).run();

    return c.json({ is_pinned: newPinStatus });
  } catch (error: any) {
    console.error('Error toggling pin:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default app;
