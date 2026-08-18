-- Academic records: one table for cumulative summary + semester GPA history
-- record_type = 'summary'  → one row per student (overall GPA, standing, credits)
-- record_type = 'semester' → one row per term (semester_label, gpa)
-- Note: live Supabase uses INTEGER student_id

CREATE TABLE IF NOT EXISTS academic_record (
    record_id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
    record_type VARCHAR(20) NOT NULL CHECK (record_type IN ('summary', 'semester')),
    overall_gpa NUMERIC(3, 2),
    gpa_scale NUMERIC(2, 1) DEFAULT 4.5,
    standing VARCHAR(50) DEFAULT 'Good',
    completed_credits INTEGER DEFAULT 0,
    required_credits INTEGER DEFAULT 100,
    semester_label VARCHAR(50),
    gpa NUMERIC(3, 2),
    sort_order INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT academic_record_type_fields CHECK (
        (record_type = 'summary' AND overall_gpa IS NOT NULL AND semester_label IS NULL)
        OR
        (record_type = 'semester' AND semester_label IS NOT NULL AND gpa IS NOT NULL)
    )
);

-- Upgrade legacy academic_summary + semester-only academic_record
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'academic_record'
  ) THEN
    -- Legacy table required semester_label/gpa on every row; summary rows need NULL
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'academic_record'
        AND column_name = 'semester_label'
        AND is_nullable = 'NO'
    ) THEN
      ALTER TABLE academic_record ALTER COLUMN semester_label DROP NOT NULL;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'academic_record'
        AND column_name = 'gpa'
        AND is_nullable = 'NO'
    ) THEN
      ALTER TABLE academic_record ALTER COLUMN gpa DROP NOT NULL;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'academic_record' AND column_name = 'record_type'
  ) THEN
    ALTER TABLE academic_record ADD COLUMN record_type VARCHAR(20);
    ALTER TABLE academic_record ADD COLUMN overall_gpa NUMERIC(3, 2);
    ALTER TABLE academic_record ADD COLUMN gpa_scale NUMERIC(2, 1) DEFAULT 4.5;
    ALTER TABLE academic_record ADD COLUMN standing VARCHAR(50) DEFAULT 'Good';
    ALTER TABLE academic_record ADD COLUMN completed_credits INTEGER DEFAULT 0;
    ALTER TABLE academic_record ADD COLUMN required_credits INTEGER DEFAULT 100;
  END IF;

  UPDATE academic_record
  SET record_type = 'semester'
  WHERE record_type IS NULL AND semester_label IS NOT NULL;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'academic_summary'
  ) THEN
    INSERT INTO academic_record (
      student_id, record_type, overall_gpa, gpa_scale, standing,
      completed_credits, required_credits, sort_order
    )
    SELECT
      s.student_id, 'summary', s.overall_gpa, s.gpa_scale, s.standing,
      s.completed_credits, s.required_credits, 0
    FROM academic_summary s
    WHERE NOT EXISTS (
      SELECT 1 FROM academic_record r
      WHERE r.student_id = s.student_id AND r.record_type = 'summary'
    );
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'academic_record'
      AND column_name = 'record_type'
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE academic_record ALTER COLUMN record_type SET NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'academic_record_type_fields'
  ) THEN
    ALTER TABLE academic_record ADD CONSTRAINT academic_record_type_fields CHECK (
      (record_type = 'summary' AND overall_gpa IS NOT NULL AND semester_label IS NULL)
      OR
      (record_type = 'semester' AND semester_label IS NOT NULL AND gpa IS NOT NULL)
    );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_academic_record_summary
    ON academic_record(student_id) WHERE record_type = 'summary';

CREATE INDEX IF NOT EXISTS idx_academic_record_student ON academic_record(student_id);

DROP TABLE IF EXISTS academic_summary;
