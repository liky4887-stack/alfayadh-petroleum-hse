/*
# Add user_roles table and asset_id column on actions

1. New Tables
- `user_roles` — stores per-user role/department/full_name
  - user_id (uuid, primary key, references auth.users on delete cascade)
  - role (text, default 'employee', check admin|supervisor|employee)
  - department (text, nullable)
  - full_name (text, nullable)
  - created_at (timestamptz, default now())
2. Modified Tables
- `actions` — add nullable `asset_id` uuid column referencing assets(id) on delete set null
3. Security
- Enable RLS on user_roles
- Users can read their own role row (SELECT, auth.uid() = user_id)
- No public signup: admin creates users via Supabase Dashboard, then inserts role row
4. Notes
- This migration is idempotent (IF NOT EXISTS / DO $$ blocks)
- The asset_id link allows actions to reference a specific asset
*/

CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'employee' CHECK (role IN ('admin', 'supervisor', 'employee')),
  department text,
  full_name text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_read_own_role" ON user_roles;
CREATE POLICY "user_read_own_role" ON user_roles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_insert_own_role" ON user_roles;
CREATE POLICY "user_insert_own_role" ON user_roles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_update_own_role" ON user_roles;
CREATE POLICY "user_update_own_role" ON user_roles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'actions' AND column_name = 'asset_id'
  ) THEN
    ALTER TABLE actions ADD COLUMN asset_id uuid REFERENCES assets(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Also add asset_code column to assets if missing (used by the frontend)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assets' AND column_name = 'asset_code'
  ) THEN
    ALTER TABLE assets ADD COLUMN asset_code text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assets' AND column_name = 'status'
  ) THEN
    ALTER TABLE assets ADD COLUMN status text DEFAULT 'active';
  END IF;
END $$;
