-- Seed many demo rows into community_post
-- Run in Supabase SQL Editor after community.sql and student data exist.
-- Re-run safe: deletes posts tagged with #hey_pnu_seed in hashtags.

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

CREATE OR REPLACE FUNCTION country_slug_from_nationality(nationality text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE lower(trim(coalesce(nationality, '')))
    WHEN 'myanmar' THEN 'country-myanmar'
    WHEN 'burma' THEN 'country-myanmar'
    WHEN 'vietnam' THEN 'country-vietnam'
    WHEN 'vietnamese' THEN 'country-vietnam'
    WHEN 'china' THEN 'country-china'
    WHEN 'chinese' THEN 'country-china'
    WHEN 'prc' THEN 'country-china'
    WHEN 'mongolia' THEN 'country-mongolia'
    WHEN 'mongolian' THEN 'country-mongolia'
    ELSE NULL
  END;
$$;

-- Ensure department groups exist for every major in use
INSERT INTO community_group (slug, scope, name, icon, match_key, banner_title, banner_body)
SELECT DISTINCT
  department_slug_from_major(m.major_name),
  'department',
  m.major_name,
  '🎓',
  m.major_name,
  m.major_name,
  'Ask questions, find teammates, and share tips in ' || m.major_name || '.'
FROM student s
JOIN major m ON m.major_id = s.major_id
WHERE m.major_name IS NOT NULL
  AND department_slug_from_major(m.major_name) <> 'department-'
ON CONFLICT (slug) DO NOTHING;

DELETE FROM community_post
WHERE hashtags @> '["#hey_pnu_seed"]'::jsonb;

DO $$
DECLARE
  target_count CONSTANT INTEGER := 220;
  templates_department TEXT[] := ARRAY[
    'Looking for a study partner for Data Structures midterm next week. #studygroup #midterm #hey_pnu_seed',
    'Does anyone know if late lab reports are accepted with a medical note? #courses #help #hey_pnu_seed',
    'Sharing notes from today''s lecture — ping me if you missed the whiteboard. #notes #hey_pnu_seed',
    'Hackathon team recruiting for PNU software contest — need backend dev. #hackathon #team #hey_pnu_seed',
    'Engineering building printers were down — IT building 2F worked fine. #campus #tips #hey_pnu_seed',
    'Dept welcome meeting Friday 5pm with free pizza. #event #freefood #hey_pnu_seed',
    'Start your term project early — learned the hard way last semester. #project #advice #hey_pnu_seed',
    'Mock interview practice Saturday 10am at the library. #career #interview #hey_pnu_seed',
    'Final exam schedule is on the portal — conflict requests close Friday. #exam #hey_pnu_seed',
    'Looking for roommate near Jangjeon station from March. #housing #roommate #hey_pnu_seed'
  ];
  templates_country TEXT[] := ARRAY[
    'ARC renewal info session this Wednesday 3pm at OIA. #arc #visa #hey_pnu_seed',
    'Weekend picnic for our country community — bring snacks! #weekend #friends #hey_pnu_seed',
    'Tip: open KakaoBank before immigration office visit. #bank #newstudent #hey_pnu_seed',
    'TOPIK prep study every Tue/Thu 7pm at library. #topik #korean #hey_pnu_seed',
    'Best lunch under 6,000 KRW near campus? Share favorites. #food #budget #hey_pnu_seed',
    'Costco run Saturday morning — two seats in car. #costco #ride #hey_pnu_seed',
    'Language exchange partner wanted (English ↔ Korean). #language #exchange #hey_pnu_seed',
    'Document notarization checklist that worked for embassy visit. #embassy #hey_pnu_seed'
  ];
  templates_all TEXT[] := ARRAY[
    'Welcome new international students — ask anything about campus life! #welcome #pnu #hey_pnu_seed',
    'Global buddy program sign-ups are open this week. #buddy #mentor #hey_pnu_seed',
    'Library extended hours during finals start next Monday. #library #finals #hey_pnu_seed',
    'Weekend trip to Gamcheon Culture Village — join us! #busan #trip #hey_pnu_seed',
    'Career fair was great — thanks for sharing employer contacts. #career #hey_pnu_seed',
    'Hiking group for Geumjeongsan trails — beginners welcome. #hiking #hey_pnu_seed',
    'Cafeteria international buffet on Wednesdays is worth it. #food #hey_pnu_seed',
    'Backup your assignment files before submission hour. #it #backup #hey_pnu_seed'
  ];
  student_ids INTEGER[];
  student_count INTEGER;
  i INTEGER;
  sid INTEGER;
  major_name TEXT;
  nationality TEXT;
  scope_val TEXT;
  group_id_val INTEGER;
  content_val TEXT;
  template_pick TEXT;
  hashtags_val JSONB;
BEGIN
  SELECT array_agg(student_id ORDER BY student_id)
  INTO student_ids
  FROM student;

  student_count := coalesce(array_length(student_ids, 1), 0);
  IF student_count = 0 THEN
    RAISE NOTICE 'No students — skipping community post seed';
    RETURN;
  END IF;

  FOR i IN 1..target_count LOOP
    sid := student_ids[((i - 1) % student_count) + 1];

    SELECT m.major_name, s.nationality
    INTO major_name, nationality
    FROM student s
    LEFT JOIN major m ON m.major_id = s.major_id
    WHERE s.student_id = sid;

    scope_val := 'all';
    group_id_val := NULL;

    IF (i % 5) IN (0, 1, 2) AND major_name IS NOT NULL THEN
      scope_val := 'department';
      SELECT cg.group_id INTO group_id_val
      FROM community_group cg
      WHERE cg.slug = department_slug_from_major(major_name)
      LIMIT 1;
    ELSIF (i % 5) = 3 THEN
      scope_val := 'country';
      SELECT cg.group_id INTO group_id_val
      FROM community_group cg
      WHERE cg.slug = country_slug_from_nationality(nationality)
      LIMIT 1;
      IF group_id_val IS NULL THEN
        scope_val := 'all';
      END IF;
    END IF;

    IF group_id_val IS NULL THEN
      SELECT cg.group_id INTO group_id_val
      FROM community_group cg
      WHERE cg.slug = 'all-intl'
      LIMIT 1;
      scope_val := 'all';
    END IF;

    IF group_id_val IS NULL THEN
      CONTINUE;
    END IF;

    IF scope_val = 'department' THEN
      template_pick := templates_department[((i - 1) % array_length(templates_department, 1)) + 1];
    ELSIF scope_val = 'country' THEN
      template_pick := templates_country[((i - 1) % array_length(templates_country, 1)) + 1];
    ELSE
      template_pick := templates_all[((i - 1) % array_length(templates_all, 1)) + 1];
    END IF;

    content_val := template_pick;
    SELECT coalesce(jsonb_agg(m[1]), '[]'::jsonb)
    INTO hashtags_val
    FROM regexp_matches(content_val, '#[\w가-힣]+', 'g') AS m;

    INSERT INTO community_post (
      group_id,
      scope,
      student_id,
      content,
      hashtags,
      likes_count,
      comments_count,
      created_at
    ) VALUES (
      group_id_val,
      scope_val,
      sid,
      content_val,
      coalesce(hashtags_val, '[]'::jsonb),
      (random() * 48)::INTEGER,
      (random() * 14)::INTEGER,
      NOW() - ((random() * 75)::INTEGER || ' days')::INTERVAL
        - ((random() * 12)::INTEGER || ' hours')::INTERVAL
    );
  END LOOP;

  RAISE NOTICE 'Seeded % community posts for % student(s)', target_count, student_count;
END $$;

DROP FUNCTION IF EXISTS country_slug_from_nationality(text);
DROP FUNCTION IF EXISTS department_slug_from_major(text);
