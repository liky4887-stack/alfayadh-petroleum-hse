/*
# Create hse_reports table for HSE Incident Management System

1. New Tables
- `hse_reports` — stores all safety/unsafe observation reports from field operators.
  - `id` (uuid, primary key, auto-generated)
  - `type` (text, not null) — 'safe', 'unsafe_condition', or 'unsafe_act'
  - `note` (text, not null) — the observer's description
  - `corrective_action` (text) — what was done / should be done (unsafe reports)
  - `image_url` (text) — URL to photographic evidence in Supabase Storage
  - `department` (text) — responsible department
  - `subcategory` (text) — sub-classification within the department
  - `status` (text, not null, default 'closed') — 'open' or 'closed'
  - `location_lat` (numeric) — GPS latitude
  - `location_lng` (numeric) — GPS longitude
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `hse_reports`.
- This is a shared field-operations tool with no sign-in screen, so all CRUD
  is allowed for both anon and authenticated roles (TO anon, authenticated).

3. Realtime
- Add `hse_reports` to the `supabase_realtime` publication so all field
  devices receive instant updates when new reports are created or status changes.
*/

CREATE TABLE IF NOT EXISTS hse_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('safe', 'unsafe_condition', 'unsafe_act')),
  note text NOT NULL,
  corrective_action text,
  image_url text,
  department text,
  subcategory text,
  status text NOT NULL DEFAULT 'closed' CHECK (status IN ('open', 'closed')),
  location_lat numeric,
  location_lng numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE hse_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_hse_reports" ON hse_reports;
CREATE POLICY "anon_select_hse_reports"
ON hse_reports FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_hse_reports" ON hse_reports;
CREATE POLICY "anon_insert_hse_reports"
ON hse_reports FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_hse_reports" ON hse_reports;
CREATE POLICY "anon_update_hse_reports"
ON hse_reports FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_hse_reports" ON hse_reports;
CREATE POLICY "anon_delete_hse_reports"
ON hse_reports FOR DELETE
TO anon, authenticated USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE hse_reports;
