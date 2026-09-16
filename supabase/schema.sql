-- HSE Application Schema
-- Run this in the Supabase SQL Editor

-- 1. assets
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  location text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- 2. tasks
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

-- 3. hse_reports
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

-- 4. training_courses
CREATE TABLE IF NOT EXISTS training_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  thumbnail_url text,
  progress integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 5. quiz_questions
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES training_courses(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 6. feeds
CREATE TABLE IF NOT EXISTS feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  media_url text,
  author_id uuid,
  created_at timestamptz DEFAULT now()
);

-- 7. feed_comments
CREATE TABLE IF NOT EXISTS feed_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id uuid REFERENCES feeds(id) ON DELETE CASCADE,
  user_id uuid,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hse_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_comments ENABLE ROW LEVEL SECURITY;

-- Permissive policies (anon + authenticated)
CREATE POLICY "anon_select_assets" ON assets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_assets" ON assets FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_assets" ON assets FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_assets" ON assets FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "anon_select_tasks" ON tasks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_tasks" ON tasks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_tasks" ON tasks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_tasks" ON tasks FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "anon_select_hse_reports" ON hse_reports FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_hse_reports" ON hse_reports FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_hse_reports" ON hse_reports FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_hse_reports" ON hse_reports FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "anon_select_training" ON training_courses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_training" ON training_courses FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_training" ON training_courses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_training" ON training_courses FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "anon_select_quiz" ON quiz_questions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_quiz" ON quiz_questions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_quiz" ON quiz_questions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_quiz" ON quiz_questions FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "anon_select_feeds" ON feeds FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_feeds" ON feeds FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_feeds" ON feeds FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_feeds" ON feeds FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "anon_select_comments" ON feed_comments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_comments" ON feed_comments FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_comments" ON feed_comments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_comments" ON feed_comments FOR DELETE TO anon, authenticated USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE hse_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE feeds;
ALTER PUBLICATION supabase_realtime ADD TABLE feed_comments;
