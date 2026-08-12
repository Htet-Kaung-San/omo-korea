-- Catalog: major-level graduation requirements (already exists in production).
-- Columns: req_id, major_id, requirement_code, requirement_name, requirement_type
--   (CREDIT | SCORE | PASS_FAIL), target_value, unit, description, display_order
--
-- Per-student completion status for non-credit milestones:

CREATE TABLE IF NOT EXISTS student_graduation_requirement (
    student_id INTEGER NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
    req_id INTEGER NOT NULL REFERENCES graduation_requirement(req_id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'Not Started'
      CHECK (status IN ('Not Started', 'In Progress', 'Completed')),
    current_value NUMERIC,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (student_id, req_id)
);

CREATE INDEX IF NOT EXISTS idx_student_graduation_requirement_student
  ON student_graduation_requirement (student_id);
