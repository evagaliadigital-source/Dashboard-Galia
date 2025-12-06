-- ============================================================================
-- MIGRATION 0010: Sistema completo de notas
-- ============================================================================

-- Tabla principal de notas
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT CHECK(category IN ('estrategia', 'reunion', 'llamada', 'idea', 'seguimiento', 'otro')) DEFAULT 'otro',
  
  -- Vinculación con otras entidades
  linked_type TEXT CHECK(linked_type IN ('lead', 'client', 'project', 'task', 'event', 'none')) DEFAULT 'none',
  linked_id INTEGER,
  
  -- Tags para búsqueda
  tags TEXT, -- JSON array de tags
  
  -- Prioridad y estado
  priority TEXT CHECK(priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  is_pinned INTEGER DEFAULT 0,
  
  -- Recordatorios
  reminder_date DATETIME,
  reminder_sent INTEGER DEFAULT 0,
  
  -- Metadata
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign keys
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_notes_created_by ON notes(created_by);
CREATE INDEX IF NOT EXISTS idx_notes_linked ON notes(linked_type, linked_id);
CREATE INDEX IF NOT EXISTS idx_notes_category ON notes(category);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(is_pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_reminder ON notes(reminder_date) WHERE reminder_sent = 0;

-- Notas de ejemplo
INSERT INTO notes (title, content, category, created_by) VALUES
  ('Estrategia de prospección', 'Contactar leads HOT los martes y jueves entre 10-12h. La tasa de conversión sube un 40% en estas franjas horarias.', 'estrategia', 1),
  ('Ideas campaña Navidad', 'Proponer packs especiales para peluquerías: Pack Instagram (3 posts + 1 reel), Pack Completo (Instagram + Facebook + Google Ads)', 'idea', 1);
