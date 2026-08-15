-- Migration: Reassign all department posts to the student's current parent major group
-- Run this in the Supabase SQL Editor.

-- Helper: Get the first part of the major name before a hyphen
CREATE OR REPLACE FUNCTION get_canonical_major_name(major_name text)
RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT trim(split_part(coalesce(major_name, ''), '-', 1));
$$;

-- Helper: Generate the standard slug for a department group
CREATE OR REPLACE FUNCTION department_slug_from_major(major_name text)
RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT 'department-' || trim(both '-' FROM regexp_replace(
    regexp_replace(
      lower(replace(trim(get_canonical_major_name(major_name)), '&', 'and')),
      '[^a-z0-9가-힣]+',
      '-',
      'g'
    ),
    '-+',
    '-',
    'g'
  ));
$$;

-- 1. Create the canonical parent groups for ALL current majors if they don't exist
INSERT INTO community_group (slug, scope, name, icon, match_key, banner_title, banner_body)
SELECT DISTINCT
  department_slug_from_major(m.major_name),
  'department',
  get_canonical_major_name(m.major_name),
  '🎓',
  get_canonical_major_name(m.major_name),
  get_canonical_major_name(m.major_name),
  'Ask questions, find teammates, and share tips in ' || get_canonical_major_name(m.major_name) || '.'
FROM major m
WHERE m.major_name IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- 2. Move ALL posts to the correct group based on the author's CURRENT major
UPDATE community_post cp
SET group_id = new_group.group_id
FROM student s
JOIN major m ON s.major_id = m.major_id
JOIN community_group new_group 
  ON new_group.slug = department_slug_from_major(m.major_name)
WHERE cp.student_id = s.student_id
  AND cp.scope = 'department'
  AND cp.group_id IS DISTINCT FROM new_group.group_id;

-- 3. Deactivate old groups that no longer correspond to any active parent major
UPDATE community_group
SET is_active = false
WHERE scope = 'department' 
  AND slug NOT IN (
    SELECT DISTINCT department_slug_from_major(m.major_name) 
    FROM major m 
    WHERE m.major_name IS NOT NULL
  );

-- 4. Delete old groups if they have no posts left (cleanup)
DELETE FROM community_group
WHERE scope = 'department'
  AND is_active = false
  AND group_id NOT IN (SELECT DISTINCT group_id FROM community_post WHERE group_id IS NOT NULL);

-- Clean up helper functions
DROP FUNCTION IF EXISTS department_slug_from_major(text);
DROP FUNCTION IF EXISTS get_canonical_major_name(text);
