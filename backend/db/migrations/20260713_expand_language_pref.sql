-- Expand student.language_pref to all PDF / Accept-Language supported codes.
-- Stored values are lowercase ISO 639-1 (en, ko, zh, vi, ja, …).
-- Safe to re-run: drops/recreates the check constraint idempotently.

ALTER TABLE student DROP CONSTRAINT IF EXISTS student_language_pref_check;

-- Migrate legacy uppercase prefs (EN/KO/ZH) and any mixed-case values.
UPDATE student
SET language_pref = lower(language_pref)
WHERE language_pref IS NOT NULL
  AND language_pref <> lower(language_pref);

ALTER TABLE student
  ALTER COLUMN language_pref SET DEFAULT 'en';

ALTER TABLE student
  ALTER COLUMN language_pref TYPE VARCHAR(5);

ALTER TABLE student
  ADD CONSTRAINT student_language_pref_check
  CHECK (
    language_pref IS NULL
    OR language_pref IN (
      'en', 'ko', 'zh', 'th', 'bn', 'mn', 'vi', 'hi', 'kk', 'id',
      'fa', 'uz', 'ja', 'my', 'ur', 'ru', 'am', 'tr', 'es'
    )
  );
