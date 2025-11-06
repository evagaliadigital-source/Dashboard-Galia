-- ============================================
-- MIGRATION 0009: MODERNIZE RESOURCES SYSTEM
-- ============================================
-- Modernizar sistema de recursos con almacenamiento R2, carpetas y soft delete
-- Similar a documents pero para materiales reutilizables internos

-- ============================================
-- PASO 1: Crear nueva tabla resources con estructura moderna
-- ============================================
CREATE TABLE resources_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Información del archivo
  title TEXT NOT NULL,
  filename TEXT NOT NULL, -- Nombre actual del archivo
  original_filename TEXT NOT NULL, -- Nombre original al subir
  file_type TEXT NOT NULL, -- pdf, png, jpg, ai, psd, etc.
  file_size INTEGER NOT NULL, -- Tamaño en bytes
  mime_type TEXT, -- application/pdf, image/png, etc.
  
  -- Almacenamiento R2
  r2_key TEXT UNIQUE NOT NULL, -- Path único en R2: resources/timestamp-filename
  
  -- Organización por carpetas
  folder_id INTEGER REFERENCES folders(id), -- NULL = sin clasificar
  
  -- Categorización y búsqueda
  description TEXT,
  category TEXT CHECK(category IN ('template', 'guide', 'logo', 'design', 'document', 'other')) DEFAULT 'other',
  tags TEXT, -- JSON array: ["instagram", "plantilla", "2025"]
  
  -- Control de acceso
  access_level TEXT CHECK(access_level IN ('public', 'team', 'admin')) DEFAULT 'team',
  
  -- Usuario que subió
  uploaded_by INTEGER REFERENCES users(id),
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_accessed_at DATETIME,
  deleted_at DATETIME -- Soft delete
);

-- ============================================
-- PASO 2: Migrar datos existentes (si hay)
-- ============================================
INSERT INTO resources_new (
  id, title, description, category, 
  filename, original_filename, file_type, file_size, mime_type,
  r2_key, folder_id, access_level, uploaded_by, created_at
)
SELECT 
  id,
  title,
  description,
  category,
  -- Extraer filename de file_url
  CASE 
    WHEN file_url LIKE '%/%' THEN SUBSTR(file_url, INSTR(file_url, '/') + 1)
    ELSE file_url
  END as filename,
  title as original_filename, -- Usar title como original_filename
  COALESCE(file_type, 'unknown') as file_type,
  COALESCE(file_size, 0) as file_size,
  file_type as mime_type,
  -- Generar r2_key desde file_url
  'resources/' || COALESCE(file_url, 'unknown-' || id) as r2_key,
  folder_id,
  access_level,
  uploaded_by,
  created_at
FROM resources
WHERE id IS NOT NULL;

-- ============================================
-- PASO 3: Reemplazar tabla antigua
-- ============================================
DROP TABLE resources;
ALTER TABLE resources_new RENAME TO resources;

-- ============================================
-- PASO 4: Crear índices para búsquedas rápidas
-- ============================================
CREATE INDEX idx_resources_folder ON resources(folder_id);
CREATE INDEX idx_resources_uploaded_by ON resources(uploaded_by);
CREATE INDEX idx_resources_file_type ON resources(file_type);
CREATE INDEX idx_resources_category ON resources(category);
CREATE INDEX idx_resources_created_at ON resources(created_at DESC);
CREATE INDEX idx_resources_r2_key ON resources(r2_key);
CREATE INDEX idx_resources_deleted_at ON resources(deleted_at);

-- ============================================
-- PASO 5: Crear/actualizar carpetas para recursos
-- ============================================
-- Actualizar carpetas existentes para marcarlas como de recursos
UPDATE folders SET description = 'Materiales de marketing y publicidad' 
WHERE name = 'Marketing';

UPDATE folders SET description = 'Recursos de diseño gráfico' 
WHERE name = 'Diseño';

UPDATE folders SET description = 'Plantillas reutilizables' 
WHERE name = 'Plantillas';

-- Crear carpeta "Sin Clasificar" para recursos si no existe
INSERT OR IGNORE INTO folders (name, description, icon, color, sort_order, created_by) 
SELECT 'Recursos - Sin Clasificar', 'Recursos pendientes de organizar', '📥', '#94A3B8', 99, 1
WHERE NOT EXISTS (SELECT 1 FROM folders WHERE name = 'Recursos - Sin Clasificar');

-- ============================================
-- PASO 6: Crear vista de estadísticas de carpetas de recursos
-- ============================================
DROP VIEW IF EXISTS folder_resource_stats;

CREATE VIEW folder_resource_stats AS
SELECT 
  f.id,
  f.name,
  f.icon,
  f.color,
  COUNT(r.id) as resource_count,
  COALESCE(SUM(r.file_size), 0) as total_size_bytes,
  COALESCE(ROUND(SUM(r.file_size) / 1024.0 / 1024.0, 2), 0) as total_size_mb,
  MAX(r.created_at) as last_upload_date
FROM folders f
LEFT JOIN resources r ON f.id = r.folder_id AND r.deleted_at IS NULL
WHERE f.name IN ('Marketing', 'Diseño', 'Plantillas', 'Documentos', 'Recursos - Sin Clasificar')
   OR f.parent_id IN (SELECT id FROM folders WHERE name IN ('Marketing', 'Diseño'))
GROUP BY f.id, f.name, f.icon, f.color;
