-- Web-push subscriptions, one row per browser a student has enabled.
--
-- A student can have several: phone, laptop, and a reinstalled browser leaves
-- the old one behind. Dead endpoints are pruned by the sender when the push
-- service answers 404 or 410, so this table does not need manual cleanup.
--
-- Apply once in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS push_subscription (
    id BIGSERIAL PRIMARY KEY,
    -- INTEGER, matching the live student.student_id. Note that
    -- backend/db/schema.sql declares that column VARCHAR(50), which is wrong.
    student_id INTEGER NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
    -- The push service URL. Unique because re-subscribing the same browser
    -- returns the same endpoint, and duplicates would send the notice twice.
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    -- Which UI language to send the notification in.
    language_pref VARCHAR(5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_push_subscription_student ON push_subscription(student_id);

-- No client policies: subscriptions are written and read only through the
-- Express API, and the keys in them can send notifications to a student.
ALTER TABLE push_subscription ENABLE ROW LEVEL SECURITY;
