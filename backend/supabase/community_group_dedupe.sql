-- One-time cleanup: remove legacy manual dept-* groups
-- Run in Supabase SQL Editor after deploying slug-based department matching.
-- Department groups use slug department-{major-slug}, e.g. department-computer-science-and-engineering

CREATE OR REPLACE FUNCTION department_slug_from_major(major_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT 'department-' || trim(both '-' FROM regexp_replace(
    regexp_replace(
      lower(replace(trim(coalesce(major_name, '')), '&', 'and')),
      '[^a-z0-9가-힣]+',
      '-',
      'g'
    ),
    '-+',
    '-',
    'g'
  ));
$$;

-- Create department-* groups for legacy dept-* rows (if missing)
INSERT INTO community_group (slug, scope, name, icon, match_key, banner_title, banner_body)
SELECT
  department_slug_from_major(coalesce(old.match_key, old.name)),
  'department',
  coalesce(old.match_key, old.name),
  '🎓',
  coalesce(old.match_key, old.name),
  coalesce(old.match_key, old.name),
  'Ask questions, find teammates, and share tips in ' || coalesce(old.match_key, old.name) || '.'
FROM community_group old
WHERE old.scope = 'department'
  AND old.slug LIKE 'dept-%'
ON CONFLICT (slug) DO NOTHING;

-- Move posts from legacy dept-* groups to department-* slug groups
UPDATE community_post cp
SET group_id = target.group_id
FROM community_group old
JOIN community_group target
  ON target.slug = department_slug_from_major(coalesce(old.match_key, old.name))
WHERE cp.group_id = old.group_id
  AND old.slug LIKE 'dept-%';

-- Move posts from truncated/duplicate department slugs to canonical slug (same match_key)
UPDATE community_post cp
SET group_id = canonical.group_id
FROM community_group dup
JOIN community_group canonical
  ON canonical.slug = department_slug_from_major(coalesce(dup.match_key, dup.name))
  AND canonical.group_id <> dup.group_id
WHERE cp.group_id = dup.group_id
  AND dup.scope = 'department'
  AND dup.slug LIKE 'department-%'
  AND dup.slug <> canonical.slug;

-- Delete empty legacy manual department groups
DELETE FROM community_group
WHERE scope = 'department'
  AND slug LIKE 'dept-%'
  AND group_id NOT IN (
    SELECT DISTINCT group_id FROM community_post WHERE group_id IS NOT NULL
  );

-- Deactivate orphaned duplicate department groups (no posts left)
UPDATE community_group dup
SET is_active = false
WHERE dup.scope = 'department'
  AND dup.slug LIKE 'department-%'
  AND dup.group_id NOT IN (
    SELECT DISTINCT group_id FROM community_post WHERE group_id IS NOT NULL
  )
  AND EXISTS (
    SELECT 1
    FROM community_group canonical
    WHERE canonical.scope = 'department'
      AND canonical.slug = department_slug_from_major(coalesce(dup.match_key, dup.name))
      AND canonical.group_id <> dup.group_id
      AND canonical.is_active = true
  );

DROP FUNCTION IF EXISTS department_slug_from_major(text);
