-- Academic summary + semester GPA history for Profile Academic Records UI
-- Note: live Supabase uses INTEGER student_id

CREATE TABLE IF NOT EXISTS academic_summary (
    student_id INTEGER PRIMARY KEY REFERENCES student(student_id) ON DELETE CASCADE,
    overall_gpa NUMERIC(3, 2) NOT NULL,
    gpa_scale NUMERIC(2, 1) NOT NULL DEFAULT 4.5,
    standing VARCHAR(50) NOT NULL DEFAULT 'Good',
    completed_credits INTEGER NOT NULL DEFAULT 0,
    required_credits INTEGER NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS academic_record (
    record_id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
    semester_label VARCHAR(50) NOT NULL,
    gpa NUMERIC(3, 2) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_academic_record_student ON academic_record(student_id);

-- Demo data for sample student (login: 202600001 / password)
INSERT INTO academic_summary (
  student_id, overall_gpa, gpa_scale, standing, completed_credits, required_credits
) VALUES (
  202600001, 3.67, 4.5, 'Good', 72, 100
)
ON CONFLICT (student_id) DO UPDATE SET
  overall_gpa = EXCLUDED.overall_gpa,
  gpa_scale = EXCLUDED.gpa_scale,
  standing = EXCLUDED.standing,
  completed_credits = EXCLUDED.completed_credits,
  required_credits = EXCLUDED.required_credits;

DELETE FROM academic_record WHERE student_id = 202600001;

INSERT INTO academic_record (student_id, semester_label, gpa, sort_order) VALUES
(202600001, '2024 Spring', 3.80, 1),
(202600001, '2023 Fall', 3.60, 2),
(202600001, '2023 Spring', 3.45, 3),
(202600001, '2022 Fall', 3.30, 4);
