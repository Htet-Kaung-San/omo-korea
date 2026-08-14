-- ==========================================================================
-- Database Restructuring: College -> Department -> Major Hierarchy
-- Run this ENTIRE script in the Supabase SQL Editor.
-- ==========================================================================

BEGIN;

-- =====================================================
-- Step 1: Back up student -> major mappings by name
-- =====================================================
CREATE TEMP TABLE student_major_backup AS
SELECT s.student_id, m.major_name
FROM student s
JOIN major m ON m.major_id = s.major_id
WHERE s.major_id IS NOT NULL;

-- =====================================================
-- Step 2: Back up course -> major mappings (if column exists)
-- =====================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course' AND column_name = 'major_id'
  ) THEN
    CREATE TEMP TABLE course_major_backup AS
    SELECT c.course_id, m.major_name
    FROM course c
    JOIN major m ON m.major_id = c.major_id
    WHERE c.major_id IS NOT NULL;

    UPDATE course SET major_id = NULL;
  END IF;
END $$;

-- =====================================================
-- Step 3: Nullify student.major_id to release FK
-- =====================================================
UPDATE student SET major_id = NULL;

-- =====================================================
-- Step 4: Clear graduation data (will be re-seeded later)
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'student_graduation_requirement') THEN
    EXECUTE 'DELETE FROM student_graduation_requirement';
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'graduation_requirement') THEN
    EXECUTE 'DELETE FROM graduation_requirement';
  END IF;
END $$;

-- =====================================================
-- Step 5: Clear old majors
-- =====================================================
-- Clear all old major data first to avoid FK violations when renaming/deleting colleges
DELETE FROM major;

-- Drop FK from major.department_id -> old department table
-- (Trying both common names for the constraint just in case)
ALTER TABLE major DROP CONSTRAINT IF EXISTS major_department_id_fkey;
ALTER TABLE major DROP CONSTRAINT IF EXISTS fk_major_department;

-- =====================================================
-- Step 6: Rename department table -> college
-- =====================================================
-- Drop the self-referencing / unused college_id column first (avoids name conflict)
ALTER TABLE department DROP COLUMN IF EXISTS college_id CASCADE;

ALTER TABLE department RENAME TO college;
ALTER TABLE college RENAME COLUMN department_id TO college_id;
ALTER TABLE college RENAME COLUMN department_name TO college_name;

-- Rename column in major table for consistency
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'major' AND column_name = 'department_id'
  ) THEN
    ALTER TABLE major RENAME COLUMN department_id TO college_id;
  END IF;
END $$;

-- Add college_id column if it doesn't exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'major' AND column_name = 'college_id'
  ) THEN
    ALTER TABLE major ADD COLUMN college_id INTEGER;
  END IF;
END $$;

-- Remove the stale "ICE Department" entry (id 16)
DELETE FROM college WHERE college_id = 16;

-- Reset the identity / sequence so IDs start from 1
DO $$
BEGIN
  -- Try IDENTITY reset first (Supabase default)
  BEGIN
    EXECUTE 'ALTER TABLE major ALTER COLUMN major_id RESTART WITH 1';
  EXCEPTION WHEN OTHERS THEN
    -- Fall back to SERIAL sequence
    PERFORM setval(pg_get_serial_sequence('major', 'major_id'), 1, false);
  END;
END $$;

-- =====================================================
-- Step 7: Insert all majors
-- =====================================================
-- NOTE: The 'department' column stores the college name for backward
-- compatibility with backend Supabase queries.

INSERT INTO major (major_name, department, college_id) VALUES
-- ===== College of Humanities (college_id = 10) =====
('Korean Language and Literature', 'College of Humanities', 10),
('Japanese Language and Literature', 'College of Humanities', 10),
('French Language and Literature', 'College of Humanities', 10),
('Russian Language and Literature', 'College of Humanities', 10),
('Chinese Language and Literature', 'College of Humanities', 10),
('English Language and Literature', 'College of Humanities', 10),
('German Language and Literature', 'College of Humanities', 10),
('Korean Literature in Classical Chinese', 'College of Humanities', 10),
('Language and Information', 'College of Humanities', 10),
('History', 'College of Humanities', 10),
('Philosophy', 'College of Humanities', 10),
('Archaeology', 'College of Humanities', 10),

-- ===== College of Social Sciences (college_id = 5) =====
('Public Administration', 'College of Social Sciences', 5),
('Political Science and Diplomacy', 'College of Social Sciences', 5),
('Social Welfare', 'College of Social Sciences', 5),
('Sociology', 'College of Social Sciences', 5),
('Psychology', 'College of Social Sciences', 5),
('Library and Information Science', 'College of Social Sciences', 5),
('Media and Communication', 'College of Social Sciences', 5),

-- ===== College of Natural Sciences (college_id = 9) =====
('Mathematics', 'College of Natural Sciences', 9),
('Statistics', 'College of Natural Sciences', 9),
('Physics', 'College of Natural Sciences', 9),
('Chemistry', 'College of Natural Sciences', 9),
('Biological Sciences', 'College of Natural Sciences', 9),
('Microbiology', 'College of Natural Sciences', 9),
('Molecular Biology', 'College of Natural Sciences', 9),
('Geological and Environmental Sciences', 'College of Natural Sciences', 9),
('Atmospheric and Environmental Sciences', 'College of Natural Sciences', 9),
('Oceanography', 'College of Natural Sciences', 9),

-- ===== College of Engineering (college_id = 2) =====
('Mechanical Engineering', 'College of Engineering', 2),
('Polymer Engineering', 'College of Engineering', 2),
('Organic Materials Systems Engineering', 'College of Engineering', 2),
('Chemical and Biomolecular Engineering', 'College of Engineering', 2),
('Environmental Engineering', 'College of Engineering', 2),
-- Electrical and Electronic Engineering (multi-major department)
('Electrical and Electronic Engineering - Electronics Engineering major', 'College of Engineering', 2),
('Electrical and Electronic Engineering - Electrical Engineering major', 'College of Engineering', 2),
('Electrical and Electronic Engineering - Semiconductor Engineering major', 'College of Engineering', 2),
('Naval Architecture and Ocean Engineering', 'College of Engineering', 2),
('Materials Engineering', 'College of Engineering', 2),
('Industrial Engineering', 'College of Engineering', 2),
('Aerospace Engineering', 'College of Engineering', 2),
('Architectural Engineering', 'College of Engineering', 2),
('Architecture', 'College of Engineering', 2),
('Urban Engineering', 'College of Engineering', 2),
('Civil and Environmental Engineering', 'College of Engineering', 2),
('Future Urban Architecture and Environmental Convergence major', 'College of Engineering', 2),
('Advanced IT Autonomous major', 'College of Engineering', 2),
('Advanced Mobility Autonomous major', 'College of Engineering', 2),
('Advanced Materials Autonomous major', 'College of Engineering', 2),
('Smart City major', 'College of Engineering', 2),

-- ===== College of Education (college_id = 7) =====
('Korean Language Education', 'College of Education', 7),
('English Language Education', 'College of Education', 7),
('German Language Education', 'College of Education', 7),
('French Language Education', 'College of Education', 7),
('Education', 'College of Education', 7),
('Early Childhood Education', 'College of Education', 7),
('Special Education', 'College of Education', 7),
('General Social Studies Education', 'College of Education', 7),
('History Education', 'College of Education', 7),
('Geography Education', 'College of Education', 7),
('Ethics Education', 'College of Education', 7),
('Mathematics Education', 'College of Education', 7),
('Physics Education', 'College of Education', 7),
('Chemistry Education', 'College of Education', 7),
('Biology Education', 'College of Education', 7),
('Earth Science Education', 'College of Education', 7),
('Physical Education', 'College of Education', 7),

-- ===== College of Economics and International Trade (college_id = 12) =====
('International Trade', 'College of Economics and International Trade', 12),
('Economics', 'College of Economics and International Trade', 12),
('Tourism and Convention', 'College of Economics and International Trade', 12),
('International Studies', 'College of Economics and International Trade', 12),
('Public Policy', 'College of Economics and International Trade', 12),

-- ===== College of Business (college_id = 4) =====
('Business Administration', 'College of Business', 4),

-- ===== College of Pharmacy (college_id = 14) =====
-- Multi-major department
('Pharmacy - Pharmacy major', 'College of Pharmacy', 14),
('Pharmacy - Pharmaceutical Sciences major', 'College of Pharmacy', 14),

-- ===== College of Human Ecology (college_id = 11) =====
('Child Development and Family Studies', 'College of Human Ecology', 11),
('Clothing and Textiles', 'College of Human Ecology', 11),
('Food and Nutrition', 'College of Human Ecology', 11),
('Interior and Environmental Design', 'College of Human Ecology', 11),
('Sports Science', 'College of Human Ecology', 11),

-- ===== College of Arts (college_id = 8) =====
('Music', 'College of Arts', 8),
('Korean Traditional Music', 'College of Arts', 8),
('Fine Arts', 'College of Arts', 8),
('Formative Arts', 'College of Arts', 8),
('Design', 'College of Arts', 8),
('Dance', 'College of Arts', 8),
('Arts, Culture and Image', 'College of Arts', 8),

-- ===== College of Nanoscience and Nanotechnology (college_id = 6) =====
('Nanomechatronics Engineering', 'College of Nanoscience and Nanotechnology', 6),
('Nanoenergy Engineering', 'College of Nanoscience and Nanotechnology', 6),
('Optics and Mechatronics Engineering', 'College of Nanoscience and Nanotechnology', 6),

-- ===== College of Natural Resource and Life Sciences (college_id = 15) =====
('Plant Bioscience', 'College of Natural Resource and Life Sciences', 15),
('Horticultural Bioscience', 'College of Natural Resource and Life Sciences', 15),
('Animal Science and Life Resources', 'College of Natural Resource and Life Sciences', 15),
('Food Science and Technology', 'College of Natural Resource and Life Sciences', 15),
('Life and Environmental Chemistry', 'College of Natural Resource and Life Sciences', 15),
('Biomaterials Science', 'College of Natural Resource and Life Sciences', 15),
('Bio-Industrial Machinery Engineering', 'College of Natural Resource and Life Sciences', 15),
('Landscape Architecture', 'College of Natural Resource and Life Sciences', 15),
('Food and Resource Economics', 'College of Natural Resource and Life Sciences', 15),
('Applied IT Engineering', 'College of Natural Resource and Life Sciences', 15),
('Bioenvironmental Energy', 'College of Natural Resource and Life Sciences', 15),

-- ===== College of Nursing (college_id = 1) =====
('Nursing', 'College of Nursing', 1),

-- ===== School of Medicine (college_id = 13) =====
('Preliminary Medicine', 'School of Medicine', 13),
('Medicine', 'School of Medicine', 13),

-- ===== College of Information and BioMedical Engineering (college_id = 3) =====
-- Multi-major department: Information and Computer Engineering
('Information and Computer Engineering - Computer Engineering major', 'College of Information and BioMedical Engineering', 3),
('Information and Computer Engineering - Artificial Intelligence major', 'College of Information and BioMedical Engineering', 3),
('Information and Computer Engineering - Design Technology major', 'College of Information and BioMedical Engineering', 3),
('BioMedical Convergence Engineering', 'College of Information and BioMedical Engineering', 3),

-- ===== University College (college_id = 17) =====
('Liberal Studies', 'University College', 17),
-- Multi-major: Advanced Convergence
('Advanced Convergence - Future Energy major', 'University College', 17),
('Advanced Convergence - Advanced Nano-device Manufacturing major', 'University College', 17),
('Advanced Convergence - Optics and Mechatronics Engineering major', 'University College', 17),
('Advanced Convergence - AI Convergence Computational Science major', 'University College', 17),
-- Multi-major: Applied Life and Convergence Science
('Applied Life and Convergence Science - Green Bio Science major', 'University College', 17),
('Applied Life and Convergence Science - Life Resource Systems Engineering major', 'University College', 17),
('Global Liberal Studies', 'University College', 17);

-- =====================================================
-- Step 8: Add FK from major.college_id -> college
-- =====================================================
ALTER TABLE major
  ADD CONSTRAINT major_college_id_fkey
  FOREIGN KEY (college_id) REFERENCES college(college_id)
  ON DELETE SET NULL;

-- =====================================================
-- Step 9: Re-map students to new major_ids by name
-- =====================================================
-- This maps students back using their old major_name.
-- If the major_name changed (e.g. "Electrical Engineering" -> "Electrical
-- and Electronic Engineering - Electrical Engineering major"), those students
-- will remain NULL and need manual re-assignment.
UPDATE student s
SET major_id = m.major_id
FROM student_major_backup b
JOIN major m ON m.major_name = b.major_name
WHERE s.student_id = b.student_id;

-- =====================================================
-- Step 10: Re-map courses to new major_ids (if applicable)
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'course_major_backup') THEN
    EXECUTE '
      UPDATE course c
      SET major_id = m.major_id
      FROM course_major_backup b
      JOIN major m ON m.major_name = b.major_name
      WHERE c.course_id = b.course_id';
  END IF;
END $$;

COMMIT;

-- =====================================================
-- DONE! Verify the migration:
-- =====================================================
-- SELECT * FROM college ORDER BY college_id;
-- SELECT major_id, major_name, department, college_id FROM major ORDER BY major_id;
-- SELECT student_id, major_id FROM student WHERE major_id IS NOT NULL LIMIT 10;
