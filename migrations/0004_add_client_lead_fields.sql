-- Add lead management fields to clients table
-- Migration 0004: Lead Quality, Client Status, and Collective tracking

-- Add lead_quality column (hot, warm, cold, qualified)
ALTER TABLE clients ADD COLUMN lead_quality TEXT DEFAULT 'cold';

-- Add client_status column (prospect, active)
ALTER TABLE clients ADD COLUMN client_status TEXT DEFAULT 'prospect';

-- Add collective/association column (optional)
ALTER TABLE clients ADD COLUMN collective TEXT;

-- Create index for filtering by lead quality
CREATE INDEX IF NOT EXISTS idx_clients_lead_quality ON clients(lead_quality);

-- Create index for filtering by client status
CREATE INDEX IF NOT EXISTS idx_clients_client_status ON clients(client_status);

-- Create index for filtering by collective
CREATE INDEX IF NOT EXISTS idx_clients_collective ON clients(collective);
