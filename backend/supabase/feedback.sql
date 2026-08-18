-- In-app feedback and app-support reports.
--
-- Both forms that write here used to call setSent(true) and nothing else, so a
-- student reporting "the visa information on this page is wrong" — the single
-- most valuable message an app about official information can receive — was
-- shown a green confirmation and their report was discarded.
--
-- Apply once in the Supabase SQL editor. The endpoint returns a clear error
-- until this exists; it never reports a false success.

CREATE TABLE IF NOT EXISTS app_feedback (
    id BIGSERIAL PRIMARY KEY,
    -- INTEGER, matching the live student.student_id. Note that
    -- backend/db/schema.sql declares that column VARCHAR(50), which is wrong —
    -- the live database has always used an integer, and schema.sql contradicts
    -- itself about it (two of its own foreign keys already say INTEGER).
    --
    -- Cascades with the student, so an account deletion really does remove
    -- everything of theirs — the rest of the schema already works this way.
    student_id INTEGER REFERENCES student(student_id) ON DELETE CASCADE,
    -- 'feedback' is the general form; 'app-support' is the bug/help form.
    kind VARCHAR(20) NOT NULL CHECK (kind IN ('feedback', 'app-support')),
    message TEXT NOT NULL,
    -- Which UI language the student was reading when they wrote this. A report
    -- about wrong wording is not actionable without knowing the locale.
    language_pref VARCHAR(5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_feedback_created ON app_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_feedback_student ON app_feedback(student_id);

-- No client policies: every read and write goes through the Express endpoint,
-- matching student_timetable.sql. These are free-text student complaints.
ALTER TABLE app_feedback ENABLE ROW LEVEL SECURITY;
