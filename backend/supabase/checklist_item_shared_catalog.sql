-- Convert checklist_item into a SHARED catalog (no student_id / status).
-- Columns: checklist_id, task_name (name), target_semester
-- Per-student completion lives in student_checklist_status.
--
-- Safe to re-run after a failed attempt (orphan student_ids are skipped).

-- 1) Status table first (FK will be re-pointed after rebuild if needed)
CREATE TABLE IF NOT EXISTS student_checklist_status (
    student_id INTEGER NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
    checklist_id INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Not Started'
      CHECK (status IN ('Not Started', 'In Progress', 'Completed')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (student_id, checklist_id)
);

-- 2) Snapshot unique task definitions from the old per-student table
CREATE TABLE IF NOT EXISTS checklist_item_shared (
    checklist_id SERIAL PRIMARY KEY,
    task_name VARCHAR(255) NOT NULL,
    target_semester VARCHAR(50) NOT NULL DEFAULT '2026',
    CONSTRAINT checklist_item_shared_unique UNIQUE (task_name, target_semester)
);

INSERT INTO checklist_item_shared (task_name, target_semester)
SELECT DISTINCT
  task_name,
  COALESCE(NULLIF(TRIM(target_semester), ''), '2026')
FROM checklist_item
WHERE task_name IS NOT NULL
ON CONFLICT (task_name, target_semester) DO NOTHING;

-- Ensure 2026 settlement tasks exist even if table was empty
INSERT INTO checklist_item_shared (task_name, target_semester) VALUES
  ('Apply for Alien Registration Card (ARC)', '2026'),
  ('Open Local Korean Bank Account', '2026'),
  ('Register and Open Mobile SIM Card', '2026'),
  ('Submit Health Clearance Certificate to Dormitory', '2026')
ON CONFLICT (task_name, target_semester) DO NOTHING;

-- 3) Copy old per-student statuses onto the shared ids
-- Skip orphan checklist rows whose student_id is not in student (e.g. 202600001).
INSERT INTO student_checklist_status (student_id, checklist_id, status, updated_at)
SELECT
  old.student_id::integer,
  shared.checklist_id,
  COALESCE(old.status, 'Not Started'),
  COALESCE(old.created_at, NOW())
FROM checklist_item old
JOIN checklist_item_shared shared
  ON shared.task_name = old.task_name
 AND shared.target_semester = COALESCE(NULLIF(TRIM(old.target_semester), ''), '2026')
JOIN student s
  ON s.student_id = old.student_id::integer
WHERE old.student_id IS NOT NULL
ON CONFLICT (student_id, checklist_id) DO UPDATE
  SET status = EXCLUDED.status,
      updated_at = EXCLUDED.updated_at;

-- 4) Replace checklist_item with the shared catalog shape the user wants
DROP TABLE IF EXISTS checklist_item CASCADE;

ALTER TABLE checklist_item_shared RENAME TO checklist_item;

ALTER TABLE student_checklist_status
  DROP CONSTRAINT IF EXISTS student_checklist_status_checklist_id_fkey;

ALTER TABLE student_checklist_status
  ADD CONSTRAINT student_checklist_status_checklist_id_fkey
  FOREIGN KEY (checklist_id) REFERENCES checklist_item(checklist_id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_checklist_item_semester
  ON checklist_item (target_semester);

CREATE INDEX IF NOT EXISTS idx_student_checklist_status_student
  ON student_checklist_status (student_id);
