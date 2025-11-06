-- Migration 0006: Make client_id nullable for internal/company projects
-- Author: Eva Rodríguez
-- Date: 2025-10-25
-- Purpose: Allow projects without clients (internal and company projects)

-- SQLite doesn't support ALTER COLUMN directly, so we need to recreate the table

-- Step 1: Create new table with nullable client_id
CREATE TABLE projects_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER,  -- Now nullable
  name TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK(status IN ('pending', 'in_progress', 'review', 'completed', 'cancelled')) DEFAULT 'pending',
  priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  start_date DATE,
  deadline DATE,
  budget REAL,
  brief TEXT,
  assigned_to INTEGER,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  project_type TEXT DEFAULT 'client' CHECK(project_type IN ('client', 'internal', 'company')),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Step 2: Copy all data from old table
INSERT INTO projects_new 
SELECT * FROM projects;

-- Step 3: Drop old table
DROP TABLE projects;

-- Step 4: Rename new table
ALTER TABLE projects_new RENAME TO projects;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(project_type);
CREATE INDEX IF NOT EXISTS idx_projects_assigned ON projects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);
