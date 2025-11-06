-- Migración 0008: Simplificar sistema de documentos para clasificación manual
-- Elimina campos de IA automática, mantiene solo folder_id nullable

-- 1. Eliminar campos de clasificación automática (SQLite no soporta DROP COLUMN)
-- Solución: Crear nueva tabla y migrar datos

-- Paso 0: Eliminar vistas dependientes primero
DROP VIEW IF EXISTS documents_with_details;
DROP VIEW IF EXISTS folder_document_stats;
DROP VIEW IF EXISTS view_documents_with_details;

-- Paso 1: Crear tabla temporal con estructura simplificada
CREATE TABLE IF NOT EXISTS documents_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT,
  r2_key TEXT UNIQUE NOT NULL,
  r2_bucket TEXT DEFAULT 'galia-documents',
  
  -- Clasificación MANUAL (nullable = sin clasificar)
  folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL,
  
  -- Relaciones opcionales
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  
  -- Metadata
  uploaded_by INTEGER REFERENCES users(id),
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_accessed_at DATETIME,
  deleted_at DATETIME, -- Soft delete
  notes TEXT,
  tags TEXT,
  
  -- Índices
  CONSTRAINT fk_folder FOREIGN KEY (folder_id) REFERENCES folders(id),
  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_client FOREIGN KEY (client_id) REFERENCES clients(id),
  CONSTRAINT fk_task FOREIGN KEY (task_id) REFERENCES tasks(id),
  CONSTRAINT fk_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Paso 2: Copiar datos existentes (si hay tabla anterior)
INSERT OR IGNORE INTO documents_new (
  id, filename, original_filename, file_type, file_size, mime_type,
  r2_key, r2_bucket, folder_id, project_id, client_id, task_id,
  uploaded_by, uploaded_at, updated_at, notes, tags
)
SELECT 
  id, filename, original_filename, file_type, file_size, mime_type,
  r2_key, r2_bucket, 
  NULL as folder_id, -- Resetear clasificación (todos sin clasificar)
  project_id, client_id, task_id,
  uploaded_by, created_at as uploaded_at, updated_at, notes, tags
FROM documents WHERE 1=0; -- Solo estructura, no copiar datos viejos (por si existen)

-- Paso 3: Eliminar tabla antigua y renombrar
DROP TABLE IF EXISTS documents;
ALTER TABLE documents_new RENAME TO documents;

-- Paso 4: Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_client ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_documents_file_type ON documents(file_type);

-- Paso 5: Recrear vista simplificada
DROP VIEW IF EXISTS view_documents_with_details;

CREATE VIEW view_documents_with_details AS
SELECT 
  d.id,
  d.filename,
  d.original_filename,
  d.file_type,
  d.file_size,
  d.mime_type,
  d.r2_key,
  d.r2_bucket,
  d.folder_id,
  d.project_id,
  d.client_id,
  d.task_id,
  d.uploaded_by,
  d.uploaded_at,
  d.updated_at,
  d.notes,
  d.tags,
  
  -- Folder info
  f.name as folder_name,
  f.icon as folder_icon,
  f.color as folder_color,
  
  -- Client info
  c.business_name as client_name,
  
  -- Project info
  p.name as project_name,
  
  -- Uploader info
  u.name as uploader_name,
  u.email as uploader_email
  
FROM documents d
LEFT JOIN folders f ON d.folder_id = f.id
LEFT JOIN clients c ON d.client_id = c.id
LEFT JOIN projects p ON d.project_id = p.id
LEFT JOIN users u ON d.uploaded_by = u.id;

-- Paso 6: Agregar carpeta especial "Sin Clasificar" si no existe
INSERT OR IGNORE INTO folders (id, name, description, icon, color, sort_order, created_by, created_at)
VALUES (1, '📥 Sin Clasificar', 'Documentos pendientes de organizar', '📥', '#6B7280', 1, 1, CURRENT_TIMESTAMP);

-- Actualizar sort_order de carpetas existentes para que "Sin Clasificar" sea la primera
UPDATE folders SET sort_order = sort_order + 100 WHERE id != 1;
UPDATE folders SET sort_order = 1 WHERE id = 1;

-- Paso 7: Recrear vista folder_document_stats (eliminada al inicio)
DROP VIEW IF EXISTS folder_document_stats;

CREATE VIEW folder_document_stats AS
SELECT 
  f.id,
  f.name,
  f.icon,
  f.color,
  COUNT(d.id) as document_count,
  COALESCE(SUM(d.file_size), 0) as total_size_bytes,
  COALESCE(ROUND(SUM(d.file_size) / 1024.0 / 1024.0, 2), 0) as total_size_mb
FROM folders f
LEFT JOIN documents d ON f.id = d.folder_id AND d.deleted_at IS NULL
WHERE f.name LIKE 'Documentos -%' OR f.name = 'Sin Clasificar' OR f.name = '📥 Sin Clasificar'
GROUP BY f.id, f.name, f.icon, f.color
ORDER BY f.sort_order;
