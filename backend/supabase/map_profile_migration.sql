-- Hey! PNU — Map + Academic Records migration (run in Supabase SQL Editor)
-- Safe to re-run (IF NOT EXISTS / ON CONFLICT).

-- 1) Enrich facility table
ALTER TABLE facility
  ADD COLUMN IF NOT EXISTS hours VARCHAR(150),
  ADD COLUMN IF NOT EXISTS details TEXT,
  ADD COLUMN IF NOT EXISTS floors TEXT,
  ADD COLUMN IF NOT EXISTS subtitle VARCHAR(150),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS website VARCHAR(255),
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS departments JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb;

-- Ensure unique name for upserts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'facility_name_key'
  ) THEN
    ALTER TABLE facility ADD CONSTRAINT facility_name_key UNIQUE (name);
  END IF;
END $$;

-- 2) Academic tables (student_id is INTEGER in live Supabase)
CREATE TABLE IF NOT EXISTS academic_summary (
    student_id INTEGER PRIMARY KEY REFERENCES student(student_id) ON DELETE CASCADE,
    overall_gpa NUMERIC(3, 2) NOT NULL,
    gpa_scale NUMERIC(2, 1) NOT NULL DEFAULT 4.5,
    standing VARCHAR(50) NOT NULL DEFAULT 'Good',
    completed_credits INTEGER NOT NULL DEFAULT 0,
    required_credits INTEGER NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS academic_record (
    record_id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
    semester_label VARCHAR(50) NOT NULL,
    gpa NUMERIC(3, 2) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_academic_record_student ON academic_record(student_id);

-- 3) Upsert campus map buildings
INSERT INTO facility (
  name, type, latitude, longitude, hours, details, floors,
  subtitle, phone, website, image_url, departments, amenities
) VALUES
(
  'PNU Main Library (중앙도서관)', 'Library', 35.233500, 129.079200,
  '06:00 - 23:00', 'Main campus study resources.',
  '1F Lounge; 2F Stacks; 3F Silent study',
  'Study rooms, Books', '051-510-1800', 'https://lib.pusan.ac.kr',
  'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200&q=80',
  '[{"name":"General Reading Rooms","floor":"1F"},{"name":"Book Stacks & Reference","floor":"2F"},{"name":"Silent Study Desks","floor":"3F"}]'::jsonb,
  '[{"name":"Study Rooms","floor":"1F-3F"},{"name":"Computers","floor":"3F"},{"name":"Copy Center","floor":"1F"}]'::jsonb
),
(
  'Geumjeong Hall Cafeteria (금정회관)', 'Cafeteria', 35.231200, 129.081100,
  '08:00 - 19:00', 'Popular student dining hall.',
  '1F Cafeteria; 2F Convenience store',
  'Food & Drinks', '051-510-1200', 'https://www.pusan.ac.kr',
  'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=1200&q=80',
  '[{"name":"Student Cafeteria","floor":"1F"},{"name":"Convenience Store & Cafe","floor":"2F"}]'::jsonb,
  '[{"name":"Korean Set Meals","floor":"1F"},{"name":"Seating Lounge","floor":"1F"}]'::jsonb
),
(
  'Moonchang Hall Cafeteria (문창회관)', 'Cafeteria', 35.234800, 129.078000,
  '11:00 - 18:30', 'North campus cafeteria.',
  '1F Buffet; 2F Lounge',
  'Food & Drinks', '051-510-1210', 'https://www.pusan.ac.kr',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
  '[{"name":"International Buffet","floor":"1F"},{"name":"Student Lounge","floor":"2F"}]'::jsonb,
  '[{"name":"Western Corner","floor":"1F"},{"name":"Copy Center","floor":"2F"}]'::jsonb
),
(
  'Engineering Building 3', 'Academic', 35.233000, 129.080500,
  '08:00 AM - 10:00 PM', 'Home of Computer Science and multimedia labs.',
  '2F Seminar; 3F CS Dept & Labs',
  'Computer Science Dept.', '051-510-2200', 'https://cse.pusan.ac.kr',
  'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200&q=80',
  '[{"name":"Computer Science Department","floor":"3F"},{"name":"Multimedia Lab","floor":"3F"},{"name":"Lecture Rooms 301-308","floor":"3F"},{"name":"Seminar Room","floor":"2F"}]'::jsonb,
  '[{"name":"Computer Labs","floor":"3F"},{"name":"Seminar Room","floor":"2F"},{"name":"Student Lounge","floor":"1F"}]'::jsonb
),
(
  'IT Building', 'Academic', 35.234200, 129.081000,
  '08:00 AM - 09:00 PM', 'Information technology classrooms and labs.',
  '1F-4F IT classrooms and labs',
  'IT & Computing', '051-510-2210', 'https://www.pusan.ac.kr',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
  '[{"name":"IT Help Desk","floor":"1F"},{"name":"Programming Labs","floor":"2F-3F"}]'::jsonb,
  '[{"name":"Public Computers","floor":"1F"},{"name":"Printer Room","floor":"1F"}]'::jsonb
),
(
  'Main Hall', 'Administrative', 35.232500, 129.078800,
  '09:00 AM - 06:00 PM', 'Central campus hall for events and ceremonies.',
  '1F Lobby; 2F Auditorium',
  'Events & Ceremonies', '051-510-1100', 'https://www.pusan.ac.kr',
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&q=80',
  '[{"name":"Main Auditorium","floor":"2F"},{"name":"Reception","floor":"1F"}]'::jsonb,
  '[{"name":"Event Hall","floor":"2F"},{"name":"Cloakroom","floor":"1F"}]'::jsonb
),
(
  'Student Center', 'Student Life', 35.232000, 129.079800,
  '08:00 AM - 10:00 PM', 'Clubs, student council, and campus activities hub.',
  '1F-3F Club rooms and offices',
  'Clubs & Activities', '051-510-1300', 'https://www.pusan.ac.kr',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80',
  '[{"name":"Student Council","floor":"2F"},{"name":"Club Offices","floor":"1F-3F"}]'::jsonb,
  '[{"name":"Meeting Rooms","floor":"2F"},{"name":"Lounge","floor":"1F"}]'::jsonb
),
(
  'University Headquarters (대학본부)', 'Administrative', 35.230100, 129.082500,
  '09:00 - 18:00', 'OIA and student services.',
  '1F Service Center; 2F OIA',
  'Admin & Student Services', '051-510-1000', 'https://www.pusan.ac.kr',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80',
  '[{"name":"Student Service Center","floor":"1F"},{"name":"Office of International Affairs","floor":"2F"}]'::jsonb,
  '[{"name":"Visa & ARC Desk","floor":"2F"},{"name":"Information Desk","floor":"1F"}]'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  type = EXCLUDED.type,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  hours = EXCLUDED.hours,
  details = EXCLUDED.details,
  floors = EXCLUDED.floors,
  subtitle = EXCLUDED.subtitle,
  phone = EXCLUDED.phone,
  website = EXCLUDED.website,
  image_url = EXCLUDED.image_url,
  departments = EXCLUDED.departments,
  amenities = EXCLUDED.amenities;

-- Enrich any remaining existing rows by name pattern
UPDATE facility SET
  hours = COALESCE(hours, '06:00 - 23:00'),
  subtitle = COALESCE(subtitle, 'Study rooms, Books'),
  phone = COALESCE(phone, '051-510-1800'),
  website = COALESCE(website, 'https://lib.pusan.ac.kr'),
  image_url = COALESCE(image_url, 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200&q=80'),
  departments = COALESCE(departments, '[{"name":"General Reading Rooms","floor":"1F"}]'::jsonb),
  amenities = COALESCE(amenities, '[{"name":"Study Rooms","floor":"1F-3F"}]'::jsonb)
WHERE name ILIKE '%Library%';

UPDATE facility SET
  hours = COALESCE(hours, '08:00 - 19:00'),
  subtitle = COALESCE(subtitle, 'Food & Drinks'),
  phone = COALESCE(phone, '051-510-1200'),
  website = COALESCE(website, 'https://www.pusan.ac.kr'),
  image_url = COALESCE(image_url, 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=1200&q=80'),
  departments = COALESCE(departments, '[{"name":"Student Cafeteria","floor":"1F"}]'::jsonb),
  amenities = COALESCE(amenities, '[{"name":"Dining","floor":"1F"}]'::jsonb)
WHERE type = 'Cafeteria' OR name ILIKE '%Cafeteria%' OR name ILIKE '%회관%';

-- 4) Academic demo for sample student 202600001
INSERT INTO academic_summary (
  student_id, overall_gpa, gpa_scale, standing, completed_credits, required_credits
) VALUES (
  202600001, 3.67, 4.5, 'Good', 72, 100
)
ON CONFLICT (student_id) DO UPDATE SET
  overall_gpa = EXCLUDED.overall_gpa,
  gpa_scale = EXCLUDED.gpa_scale,
  standing = EXCLUDED.standing,
  completed_credits = EXCLUDED.completed_credits,
  required_credits = EXCLUDED.required_credits;

DELETE FROM academic_record WHERE student_id = 202600001;
INSERT INTO academic_record (student_id, semester_label, gpa, sort_order) VALUES
(202600001, '2024 Spring', 3.80, 1),
(202600001, '2023 Fall', 3.60, 2),
(202600001, '2023 Spring', 3.45, 3),
(202600001, '2022 Fall', 3.30, 4);
