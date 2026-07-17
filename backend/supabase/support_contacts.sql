-- PNU Contact Support + FAQ (Help & Support)
-- Run in Supabase SQL Editor once.

CREATE TABLE IF NOT EXISTS pnu_contact (
    contact_id SERIAL PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    place VARCHAR(255) NOT NULL,
    hours VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS faq_item (
    faq_id SERIAL PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_pnu_contact_sort ON pnu_contact (sort_order);
CREATE INDEX IF NOT EXISTS idx_faq_item_sort ON faq_item (sort_order);

INSERT INTO pnu_contact (slug, name, place, hours, phone, email, sort_order) VALUES
(
  'oia',
  'Office of International Affairs (OIA)',
  'University Headquarters 2F',
  'Weekdays 09:00 – 18:00',
  '051-510-1000',
  'oia@pusan.ac.kr',
  1
),
(
  'one-stop',
  'One-Stop Service Center',
  'University Headquarters 1F',
  'Weekdays 09:00 – 17:30',
  '051-510-1224',
  NULL,
  2
),
(
  'library',
  'Central Library Help Desk',
  'PNU Main Library 1F',
  'Weekdays 09:00 – 18:00',
  '051-510-1800',
  'lib@pusan.ac.kr',
  3
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  place = EXCLUDED.place,
  hours = EXCLUDED.hours,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  sort_order = EXCLUDED.sort_order,
  is_active = true;

INSERT INTO faq_item (slug, question, answer, sort_order) VALUES
(
  'login',
  'I cannot log in to Hey! PNU. What should I do?',
  'Confirm your student ID and password. Use Forgot password on the login screen, or contact OIA if your account was never created.',
  1
),
(
  'language',
  'How do I change the app language?',
  'Open Profile → Settings (gear) → Language, or use the language selector in the top bar.',
  2
),
(
  'map',
  'Why is the campus map blank?',
  'The map needs a valid Naver Maps Client ID and Web Service URL set to http://localhost (no port) for local development.',
  3
),
(
  'visa',
  'Where can I get help with ARC / visa?',
  'Visit Office of International Affairs (Headquarters 2F) or open Emergency / Contact Support in Help & Support.',
  4
)
ON CONFLICT (slug) DO UPDATE SET
  question = EXCLUDED.question,
  answer = EXCLUDED.answer,
  sort_order = EXCLUDED.sort_order,
  is_active = true;
