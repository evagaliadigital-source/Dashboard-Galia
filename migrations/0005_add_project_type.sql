-- Migration 0005: Add project_type to differentiate client vs internal projects
-- Author: Eva Rodríguez
-- Date: 2025-10-25
-- Purpose: Separate client projects (billable work) from internal Galia Digital projects (CEO obligations)

-- Add project_type column
-- Values: 'client' (proyecto de cliente) | 'internal' (proyecto interno Galia Digital) | 'company' (obligaciones empresa)
ALTER TABLE projects ADD COLUMN project_type TEXT DEFAULT 'client' CHECK(project_type IN ('client', 'internal', 'company'));

-- Create index for filtering by project type
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(project_type);

-- Update existing projects
-- If project has client_id, it's a client project
-- If project has NULL client_id, it's an internal project
UPDATE projects SET project_type = 'internal' WHERE client_id IS NULL;
UPDATE projects SET project_type = 'client' WHERE client_id IS NOT NULL;

-- Add comment for clarity
-- 'client' = Trabajo facturable para clientes (ej: Marketing Peluquería Laura)
-- 'internal' = Proyectos internos Galia Digital (ej: Desarrollar nueva oferta de servicios)
-- 'company' = Obligaciones CEO/empresa (ej: Contratar equipo, actualizar web)
