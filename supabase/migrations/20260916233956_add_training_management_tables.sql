/*
# Add Training Management Tables + Storage Bucket

1. New Tables
- `training_courses_enhanced` (view-like alias): adds description, duration, category columns to existing training_courses table
- `employees`: stores employee records for enrollment assignment
- `enrollments`: links employees to courses with status tracking

2. Modified Tables
- `training_courses`: add columns description, duration, category (IF NOT EXISTS)

3. Storage
- Create `hse-media` storage bucket (public) for image uploads

4. Security
- RLS enabled on employees and enrollments
- Anon + authenticated CRUD policies (single-tenant app, no auth)
- Storage bucket set to public for image URL access
*/

-- Add columns to training_courses if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'training_courses' AND column_name = 'description') THEN
    ALTER TABLE training_courses ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'training_courses' AND column_name = 'duration') THEN
    ALTER TABLE training_courses ADD COLUMN duration text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'training_courses' AND column_name = 'category') THEN
    ALTER TABLE training_courses ADD COLUMN category text;
  END IF;
END $$;

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text,
  job_title text,
  department text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_employees" ON employees;
CREATE POLICY "allow_all_employees" ON employees FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES training_courses(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  status text DEFAULT 'assigned',
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_enrollments" ON enrollments;
CREATE POLICY "allow_all_enrollments" ON enrollments FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE employees;
ALTER PUBLICATION supabase_realtime ADD TABLE enrollments;

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('hse-media', 'hse-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "allow_public_upload" ON storage.objects;
CREATE POLICY "allow_public_upload" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'hse-media');

DROP POLICY IF EXISTS "allow_public_read" ON storage.objects;
CREATE POLICY "allow_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'hse-media');

DROP POLICY IF EXISTS "allow_public_delete" ON storage.objects;
CREATE POLICY "allow_public_delete" ON storage.objects
  FOR DELETE TO anon, authenticated USING (bucket_id = 'hse-media');
