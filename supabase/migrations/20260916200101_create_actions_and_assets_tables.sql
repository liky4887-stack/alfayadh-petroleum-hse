/*
# Create actions and assets tables

1. New Tables
- `actions` — tracks HSE actions (inspections, maintenance, training, etc.)
  - id (uuid, primary key)
  - title (text, not null)
  - description (text)
  - type (text — Inspection, Action, Maintenance, Training)
  - priority (text — Low, Medium, High, Critical)
  - assignee (text)
  - due_date (date)
  - status (text, default 'todo')
  - created_at (timestamptz, default now())
- `assets` — tracks physical assets (trucks, cranes, pumps, rigs, etc.)
  - id (uuid, primary key)
  - asset_code (text, not null)
  - name (text, not null)
  - type (text — Truck, Crane, Pump, Rig, Generator, Vehicle)
  - location (text)
  - status (text, default 'active')
  - image_url (text)
  - created_at (timestamptz, default now())

2. Security
- Enable RLS on both tables.
- Single-tenant app (no auth screen) → allow anon + authenticated full CRUD.
- Policies are intentionally permissive because all data is shared/public.
*/

CREATE TABLE IF NOT EXISTS actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text,
  priority text,
  assignee text,
  due_date date,
  status text DEFAULT 'todo',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_actions" ON actions;
CREATE POLICY "allow_all_actions" ON actions FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_code text NOT NULL,
  name text NOT NULL,
  type text,
  location text,
  status text DEFAULT 'active',
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_assets" ON assets;
CREATE POLICY "allow_all_assets" ON assets FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);
