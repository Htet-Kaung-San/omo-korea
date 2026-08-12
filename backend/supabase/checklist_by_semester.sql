-- Shared checklist definitions by academic year + audience (not per-student copies).
-- Audience: '1' = first-year, 'exchange' = exchange student.
-- Student progress is stored separately in student_checklist.

CREATE TABLE IF NOT EXISTS checklist_template (
    template_id SERIAL PRIMARY KEY,
    semester VARCHAR(20) NOT NULL,
    audience VARCHAR(20) NOT NULL
      CHECK (audience IN ('1', 'exchange')),
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT checklist_template_unique
      UNIQUE (semester, audience, task_name)
);

CREATE INDEX IF NOT EXISTS idx_checklist_template_lookup
  ON checklist_template (semester, audience);

-- Per-student completion against a shared template row.
CREATE TABLE IF NOT EXISTS student_checklist (
    student_id INTEGER NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
    template_id INTEGER NOT NULL REFERENCES checklist_template(template_id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'Not Started'
      CHECK (status IN ('Not Started', 'In Progress', 'Completed')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (student_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_student_checklist_student
  ON student_checklist (student_id);

-- Seed 2026 settlement checklist for first-year + exchange audiences.
INSERT INTO checklist_template (semester, audience, task_name, description, sort_order)
VALUES
  ('2026', '1', 'Apply for Alien Registration Card (ARC)', 'Visit immigration within 90 days of arrival.', 1),
  ('2026', '1', 'Open Local Korean Bank Account', 'Open an account at a campus or nearby bank.', 2),
  ('2026', '1', 'Register and Open Mobile SIM Card', 'Get a local prepaid or contract SIM card.', 3),
  ('2026', '1', 'Submit Health Clearance Certificate to Dormitory', 'Submit health clearance to dormitory office.', 4),
  ('2026', 'exchange', 'Apply for Alien Registration Card (ARC)', 'Visit immigration within 90 days of arrival.', 1),
  ('2026', 'exchange', 'Open Local Korean Bank Account', 'Open an account at a campus or nearby bank.', 2),
  ('2026', 'exchange', 'Register and Open Mobile SIM Card', 'Get a local prepaid or contract SIM card.', 3),
  ('2026', 'exchange', 'Submit Health Clearance Certificate to Dormitory', 'Submit health clearance to dormitory office.', 4)
ON CONFLICT (semester, audience, task_name) DO NOTHING;
