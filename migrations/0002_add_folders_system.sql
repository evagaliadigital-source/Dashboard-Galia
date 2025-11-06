-- Migration: Agregar sistema de carpetas para recursos
-- Fecha: 2025-10-24

-- Tabla de carpetas (estructura jerárquica)
CREATE TABLE IF NOT EXISTS folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  parent_id INTEGER,
  description TEXT,
  color TEXT DEFAULT '#7B5FB8',
  icon TEXT DEFAULT '📁',
  sort_order INTEGER DEFAULT 0,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Agregar folder_id a recursos existentes
ALTER TABLE resources ADD COLUMN folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL;

-- Índices para optimizar navegación de carpetas
CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_resources_folder ON resources(folder_id);

-- Insertar carpetas por defecto
INSERT INTO folders (name, parent_id, description, color, icon, sort_order, created_by) VALUES
  ('Marketing', NULL, 'Materiales de marketing y publicidad', '#E91E8C', '📢', 1, 1),
  ('Diseño', NULL, 'Recursos de diseño gráfico', '#9B4DCA', '🎨', 2, 1),
  ('Documentos', NULL, 'Documentos corporativos y legales', '#7B5FB8', '📄', 3, 1),
  ('Plantillas', NULL, 'Plantillas reutilizables', '#00D9C0', '📋', 4, 1),
  ('Logos', 2, 'Logos de clientes', '#9B4DCA', '🎯', 1, 1),
  ('Banners', 2, 'Banners y portadas', '#9B4DCA', '🖼️', 2, 1),
  ('Redes Sociales', 1, 'Contenido para redes sociales', '#E91E8C', '📱', 1, 1),
  ('Email Marketing', 1, 'Plantillas de email', '#E91E8C', '📧', 2, 1);
