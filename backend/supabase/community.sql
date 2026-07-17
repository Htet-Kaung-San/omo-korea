-- Hey! PNU — Community (groups + posts)
-- Run in Supabase SQL Editor once.
-- Note: live Supabase uses INTEGER student_id.

CREATE TABLE IF NOT EXISTS community_group (
    group_id SERIAL PRIMARY KEY,
    slug VARCHAR(80) UNIQUE NOT NULL,
    scope VARCHAR(20) NOT NULL CHECK (scope IN ('department', 'country', 'all')),
    name VARCHAR(200) NOT NULL,
    icon VARCHAR(16) NOT NULL DEFAULT '🌐',
    match_key VARCHAR(150),
    banner_title VARCHAR(200) NOT NULL,
    banner_body TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_post (
    post_id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES community_group(group_id) ON DELETE SET NULL,
    scope VARCHAR(20) NOT NULL CHECK (scope IN ('department', 'country', 'all')),
    student_id INTEGER NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    hashtags JSONB NOT NULL DEFAULT '[]'::jsonb,
    likes_count INTEGER NOT NULL DEFAULT 0,
    comments_count INTEGER NOT NULL DEFAULT 0,
    event_month VARCHAR(8),
    event_day VARCHAR(4),
    event_weekday VARCHAR(8),
    reported BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_group_scope ON community_group (scope);
CREATE INDEX IF NOT EXISTS idx_community_group_match ON community_group (match_key);
CREATE INDEX IF NOT EXISTS idx_community_post_scope ON community_post (scope, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_post_group ON community_post (group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_post_student ON community_post (student_id);

-- Seed community groups (user's country/department matched via match_key)
INSERT INTO community_group (slug, scope, name, icon, match_key, banner_title, banner_body) VALUES
(
  'all-intl',
  'all',
  'All International Students',
  '🌍',
  NULL,
  'Welcome to the PNU Community!',
  'Ask questions, share tips, and build connections with fellow students.'
),
(
  'dept-cse',
  'department',
  'Computer Science & Engineering',
  '💻',
  'Computer Science & Engineering',
  'CSE Community',
  'Find teammates, share lab tips, and follow CSE announcements.'
),
(
  'dept-business',
  'department',
  'Business Administration',
  '📊',
  'Business Administration',
  'Business Community',
  'Network with business majors and share internship tips.'
),
(
  'dept-intl',
  'department',
  'International Studies',
  '🌍',
  'International Studies',
  'International Studies',
  'Discuss global issues and campus events with your cohort.'
),
(
  'dept-ee',
  'department',
  'Electrical Engineering',
  '⚡',
  'Electrical Engineering',
  'Electrical Engineering',
  'Ask course questions and form study groups.'
),
(
  'country-myanmar',
  'country',
  'Myanmar Community',
  '🇲🇲',
  'Myanmar',
  'Myanmar Community',
  'Connect with students from Myanmar and share campus life tips.'
),
(
  'country-china',
  'country',
  'China Community',
  '🇨🇳',
  'China',
  'China Community',
  'Share housing tips, language partners, and weekend plans.'
),
(
  'country-vietnam',
  'country',
  'Vietnam Community',
  '🇻🇳',
  'Vietnam',
  'Vietnam Community',
  'Meet Vietnamese students and stay updated on events.'
),
(
  'country-mongolia',
  'country',
  'Mongolia Community',
  '🇲🇳',
  'Mongolia',
  'Mongolia Community',
  'Find friends from Mongolia and share useful resources.'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  match_key = EXCLUDED.match_key,
  banner_title = EXCLUDED.banner_title,
  banner_body = EXCLUDED.banner_body,
  is_active = true;
