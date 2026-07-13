-- Hey! PNU Production Database Schema (PostgreSQL DDL)

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. MAJOR TABLE
CREATE TABLE IF NOT EXISTS major (
    major_id SERIAL PRIMARY KEY,
    major_name VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL
);

-- 2. STUDENT TABLE
CREATE TABLE IF NOT EXISTS student (
    student_id VARCHAR(50) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    nationality VARCHAR(100) NOT NULL,
    major_id INTEGER REFERENCES major(major_id) ON DELETE SET NULL,
    student_type VARCHAR(20) DEFAULT 'Freshman' CHECK (student_type IN ('Freshman', 'Current')),
    visa_status VARCHAR(20) DEFAULT 'None',
    -- Lowercase ISO 639-1 codes aligned with PDF Accept-Language / UI locales
    language_pref VARCHAR(5) DEFAULT 'en' CHECK (
        language_pref IN (
            'en', 'ko', 'zh', 'th', 'bn', 'mn', 'vi', 'hi', 'kk', 'id',
            'fa', 'uz', 'ja', 'my', 'ur', 'ru', 'am', 'tr', 'es'
        )
    ),
    email VARCHAR(150),
    phone VARCHAR(50),
    is_in_korea BOOLEAN DEFAULT TRUE,
    mbti VARCHAR(10),
    d2_semester VARCHAR(20),
    completed_courses JSONB DEFAULT '[]'::jsonb,
    deletion_requested BOOLEAN DEFAULT FALSE,
    intake_term VARCHAR(20) DEFAULT 'March',
    is_admin BOOLEAN DEFAULT FALSE
);

-- 3. COURSE CATALOG TABLE
CREATE TABLE IF NOT EXISTS course (
    course_id SERIAL PRIMARY KEY,
    course_name VARCHAR(150) NOT NULL,
    course_name_en VARCHAR(150),
    credits INTEGER DEFAULT 3,
    department VARCHAR(100) NOT NULL,
    course_type VARCHAR(20) DEFAULT 'ELECTIVE' CHECK (course_type IN ('REQUIRED', 'ELECTIVE')),
    day_of_week VARCHAR(10) CHECK (day_of_week IN ('Mon', 'Tue', 'Wed', 'Thu', 'Fri')),
    start_time VARCHAR(5) NOT NULL, -- HH:MM formatting
    end_time VARCHAR(5) NOT NULL,   -- HH:MM formatting
    classroom VARCHAR(50)
);

-- 4. ENROLLMENT TABLE
CREATE TABLE IF NOT EXISTS enrollment (
    enrollment_id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES student(student_id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES course(course_id) ON DELETE CASCADE,
    UNIQUE(student_id, course_id)
);

-- 5. FACILITY MAP LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS facility (
    facility_id SERIAL PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    hours VARCHAR(150),
    details TEXT,
    floors TEXT
);

-- 6. UNIVERSITY NOTICES TABLE
CREATE TABLE IF NOT EXISTS notice (
    notice_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    language VARCHAR(20) DEFAULT 'English',
    posted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. FORUM POSTS TABLE
CREATE TABLE IF NOT EXISTS post (
    post_id SERIAL PRIMARY KEY,
    board_id INTEGER NOT NULL, -- 1: Visa & ARC, 2: Dorm & Housing, 3: Campus Life, 4: Academics
    student_id VARCHAR(50) REFERENCES student(student_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    reported BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. DISCUSSION COMMENTS TABLE
CREATE TABLE IF NOT EXISTS comment (
    comment_id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES post(post_id) ON DELETE CASCADE,
    student_id VARCHAR(50) REFERENCES student(student_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. CHECKLIST ITEMS TABLE
CREATE TABLE IF NOT EXISTS checklist_item (
    checklist_id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) REFERENCES student(student_id) ON DELETE CASCADE,
    task_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'In Progress', 'Completed')),
    due_date TIMESTAMP,
    description TEXT,
    target_semester VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for lookup speed optimizations
CREATE INDEX IF NOT EXISTS idx_student_major ON student(major_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_student ON enrollment(student_id);
CREATE INDEX IF NOT EXISTS idx_post_board ON post(board_id);
CREATE INDEX IF NOT EXISTS idx_comment_post ON comment(post_id);
CREATE INDEX IF NOT EXISTS idx_checklist_item_student ON checklist_item(student_id);
