/*
# HSE Application — Full Schema (assets, tasks, training, feeds, comments)

1. New Tables
- `assets` — equipment/vehicles being inspected and maintained
  - id (uuid PK), name, type, location, image_url
- `tasks` — inspections and corrective actions linked to an asset
  - id (uuid PK), asset_id (FK assets), title, category, severity, status, due_date
- `training_courses` — training modules available to workers
  - id (uuid PK), title, thumbnail_url, progress (0–100)
- `quiz_questions` — quiz items for a course
  - id (uuid PK), course_id (FK training_courses), question (text), options (jsonb array)
- `feeds` — team communication posts (videos, announcements)
  - id (uuid PK), title, description, media_url, author_id, created_at
- `feed_comments` — comments on a feed post
  - id (uuid PK), feed_id (FK feeds), user_id, comment, created_at

2. Security
- RLS enabled on every table.
- Permissive policies (anon + authenticated) for this field-operations tool with no sign-in screen.

3. Realtime
- Enabled on `tasks` and `hse_reports` (already exists from prior migration).
*/

CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  location text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'inspection',
  severity text DEFAULT 'low',
  status text NOT NULL DEFAULT 'todo',
  due_date date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  thumbnail_url text,
  progress integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES training_courses(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  media_url text,
  author_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feed_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id uuid REFERENCES feeds(id) ON DELETE CASCADE,
  user_id uuid,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;

-- Permissive CRUD policies (anon + authenticated) for field-ops tool
-- assets
DROP POLICY IF EXISTS "anon_crud_assets" ON assets;
CREATE POLICY "anon_select_assets" ON assets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_assets" ON assets FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_assets" ON assets FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_assets" ON assets FOR DELETE TO anon, authenticated USING (true);

-- tasks
DROP POLICY IF EXISTS "anon_select_tasks" ON tasks;
CREATE POLICY "anon_select_tasks" ON tasks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_tasks" ON tasks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_tasks" ON tasks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_tasks" ON tasks FOR DELETE TO anon, authenticated USING (true);

-- training_courses
CREATE POLICY "anon_select_training" ON training_courses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_training" ON training_courses FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_training" ON training_courses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_training" ON training_courses FOR DELETE TO anon, authenticated USING (true);

-- quiz_questions
CREATE POLICY "anon_select_quiz" ON quiz_questions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_quiz" ON quiz_questions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_quiz" ON quiz_questions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_quiz" ON quiz_questions FOR DELETE TO anon, authenticated USING (true);

-- feeds
CREATE POLICY "anon_select_feeds" ON feeds FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_feeds" ON feeds FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_feeds" ON feeds FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_feeds" ON feeds FOR DELETE TO anon, authenticated USING (true);

-- feed_comments
CREATE POLICY "anon_select_comments" ON feed_comments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_comments" ON feed_comments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_comments" ON feed_comments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_comments" ON feed_comments FOR DELETE TO anon, authenticated USING (true);

-- Realtime on tasks
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE feeds;
ALTER PUBLICATION supabase_realtime ADD TABLE feed_comments;
