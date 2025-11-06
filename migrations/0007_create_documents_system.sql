-- ============================================
-- MIGRATION 0007: DOCUMENTS MANAGEMENT SYSTEM
-- ============================================
-- Sistema de gestión documental con clasificación automática por IA
-- Almacenamiento en Cloudflare R2 + metadatos en D1

-- ============================================
-- TABLA: documents (Documentos subidos)
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Información del archivo
  filename TEXT NOT NULL, -- Nombre actual del archivo
  original_filename TEXT NOT NULL, -- Nombre original al subir
  file_type TEXT NOT NULL, -- pdf, xlsx, png, docx, etc.
  file_size INTEGER NOT NULL, -- Tamaño en bytes
  mime_type TEXT, -- application/pdf, image/png, etc.
  
  -- Almacenamiento R2
  r2_key TEXT UNIQUE NOT NULL, -- Path único en R2: uploads/timestamp-filename
  r2_bucket TEXT DEFAULT 'galia-documents',
  
  -- Clasificación automática
  folder_id INTEGER REFERENCES folders(id),
  auto_classified INTEGER DEFAULT 1, -- ¿La IA lo clasificó automáticamente? (0 o 1)
  classification_confidence REAL DEFAULT 0.5, -- Confianza 0-1
  classification_method TEXT DEFAULT 'rules', -- rules, ai, manual
  
  -- Relaciones con otras entidades
  project_id INTEGER REFERENCES projects(id),
  client_id INTEGER REFERENCES clients(id),
  task_id INTEGER REFERENCES tasks(id),
  
  -- Usuario que subió
  uploaded_by INTEGER REFERENCES users(id),
  
  -- Metadatos adicionales
  description TEXT,
  tags TEXT, -- JSON array: ["contrato", "2025", "urgente"]
  notes TEXT, -- Notas internas
  
  -- Control de versiones (futuro)
  version INTEGER DEFAULT 1,
  is_latest_version INTEGER DEFAULT 1, -- 0 o 1
  parent_document_id INTEGER REFERENCES documents(id), -- Versión anterior
  
  -- Seguridad y privacidad
  is_confidential INTEGER DEFAULT 0, -- 0 o 1
  access_level TEXT DEFAULT 'team' CHECK(access_level IN ('private', 'team', 'public')),
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_accessed_at DATETIME,
  deleted_at DATETIME -- Soft delete
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_client ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_task ON documents(task_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_file_type ON documents(file_type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_r2_key ON documents(r2_key);

-- ============================================
-- SEED: Carpetas para documentos
-- ============================================
-- Insertar carpetas solo si no existen (usando nombre único)
INSERT OR IGNORE INTO folders (name, description, icon, color, sort_order, created_by) 
SELECT 'Documentos - Clientes', 'Documentos relacionados con clientes', '👥', '#3B82F6', 100, 1
WHERE NOT EXISTS (SELECT 1 FROM folders WHERE name = 'Documentos - Clientes');

INSERT OR IGNORE INTO folders (name, description, icon, color, sort_order, created_by) 
SELECT 'Documentos - Proyectos', 'Documentos de proyectos activos', '📁', '#8B5CF6', 101, 1
WHERE NOT EXISTS (SELECT 1 FROM folders WHERE name = 'Documentos - Proyectos');

INSERT OR IGNORE INTO folders (name, description, icon, color, sort_order, created_by) 
SELECT 'Documentos - Marketing', 'Materiales de marketing y campañas', '📢', '#EC4899', 102, 1
WHERE NOT EXISTS (SELECT 1 FROM folders WHERE name = 'Documentos - Marketing');

INSERT OR IGNORE INTO folders (name, description, icon, color, sort_order, created_by) 
SELECT 'Documentos - Legal', 'Contratos, acuerdos y documentos legales', '⚖️', '#EF4444', 103, 1
WHERE NOT EXISTS (SELECT 1 FROM folders WHERE name = 'Documentos - Legal');

INSERT OR IGNORE INTO folders (name, description, icon, color, sort_order, created_by) 
SELECT 'Documentos - Finanzas', 'Facturas, presupuestos y documentos financieros', '💰', '#10B981', 104, 1
WHERE NOT EXISTS (SELECT 1 FROM folders WHERE name = 'Documentos - Finanzas');

INSERT OR IGNORE INTO folders (name, description, icon, color, sort_order, created_by) 
SELECT 'Documentos - RRHH', 'CVs, contratos laborales, nóminas', '👔', '#F59E0B', 105, 1
WHERE NOT EXISTS (SELECT 1 FROM folders WHERE name = 'Documentos - RRHH');

INSERT OR IGNORE INTO folders (name, description, icon, color, sort_order, created_by) 
SELECT 'Documentos - Operaciones', 'Procedimientos, guías y documentación interna', '⚙️', '#6B7280', 106, 1
WHERE NOT EXISTS (SELECT 1 FROM folders WHERE name = 'Documentos - Operaciones');

INSERT OR IGNORE INTO folders (name, description, icon, color, sort_order, created_by) 
SELECT 'Sin Clasificar', 'Documentos pendientes de clasificación', '❓', '#9CA3AF', 199, 1
WHERE NOT EXISTS (SELECT 1 FROM folders WHERE name = 'Sin Clasificar');

-- ============================================
-- VISTA: documents_with_details
-- ============================================
DROP VIEW IF EXISTS documents_with_details;
CREATE VIEW documents_with_details AS
SELECT 
  d.*,
  f.name as folder_name,
  f.icon as folder_icon,
  f.color as folder_color,
  p.name as project_name,
  c.business_name as client_name,
  u.name as uploaded_by_name
FROM documents d
LEFT JOIN folders f ON d.folder_id = f.id
LEFT JOIN projects p ON d.project_id = p.id
LEFT JOIN clients c ON d.client_id = c.id
LEFT JOIN users u ON d.uploaded_by = u.id
WHERE d.deleted_at IS NULL;

-- ============================================
-- VISTA: folder_document_stats
-- ============================================
DROP VIEW IF EXISTS folder_document_stats;
CREATE VIEW folder_document_stats AS
SELECT 
  f.id,
  f.name,
  f.icon,
  f.color,
  COUNT(d.id) as document_count,
  SUM(d.file_size) as total_size_bytes,
  ROUND(SUM(d.file_size) / 1024.0 / 1024.0, 2) as total_size_mb
FROM folders f
LEFT JOIN documents d ON f.id = d.folder_id AND d.deleted_at IS NULL
WHERE f.name LIKE 'Documentos -%' OR f.name = 'Sin Clasificar'
GROUP BY f.id, f.name, f.icon, f.color
ORDER BY f.sort_order;
