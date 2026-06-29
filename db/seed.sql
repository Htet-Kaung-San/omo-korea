-- Hey! PNU Initial Seed Script

-- 1. SEED MAJORS
INSERT INTO major (major_name, department) VALUES
('Computer Science & Engineering', 'CSE Department'),
('Business Administration', 'School of Business'),
('Mechanical Engineering', 'Engineering College'),
('Korean Language & Literature', 'Humanities College')
ON CONFLICT (major_name) DO NOTHING;

-- 2. SEED STUDENTS (Password is hashed 'password' using bcryptjs)
INSERT INTO student (student_id, password, name, nationality, major_id, student_type, visa_status, language_pref, email, phone) VALUES
('202455393', '$2a$10$U9HkfeY2R0x.bF3uF3l70e6U5oH6k.vL03iP/M.aD3p/hJ1lH/eOm', 'Pan Khin Khin Zaw', 'Myanmar', 1, 'Freshman', 'D-2', 'EN', 'pan@pnu.edu', '010-9999-8888'),
('202012345', '$2a$10$U9HkfeY2R0x.bF3uF3l70e6U5oH6k.vL03iP/M.aD3p/hJ1lH/eOm', 'Min-Jun Kim', 'South Korea', 1, 'Current', 'None', 'KO', 'mj@pnu.edu', '010-1234-5678'),
('202399999', '$2a$10$U9HkfeY2R0x.bF3uF3l70e6U5oH6k.vL03iP/M.aD3p/hJ1lH/eOm', 'Yuki Tanaka', 'Japan', 2, 'Current', 'D-2', 'ZH', 'yuki@pnu.edu', '010-8888-7777')
ON CONFLICT (student_id) DO NOTHING;

-- 3. SEED COURSE CATALOG
INSERT INTO course (course_name, course_name_en, credits, department, course_type, day_of_week, start_time, end_time, classroom) VALUES
('컴퓨터 프로그래밍 1', 'Computer Programming 1', 3, 'Computer Science', 'REQUIRED', 'Mon', '09:00', '10:30', 'Science Bldg 101'),
('컴퓨터 프로그래밍 1', 'Computer Programming 1', 3, 'Computer Science', 'REQUIRED', 'Wed', '09:00', '10:30', 'Science Bldg 101'),
('자료구조', 'Data Structures', 3, 'Computer Science', 'REQUIRED', 'Tue', '13:30', '15:00', 'Engineering Bldg 202'),
('자료구조', 'Data Structures', 3, 'Computer Science', 'REQUIRED', 'Thu', '13:30', '15:00', 'Engineering Bldg 202'),
('마케팅 원론', 'Principles of Marketing', 3, 'Business Administration', 'ELECTIVE', 'Mon', '11:00', '12:30', 'Business Hall 401'),
('마케팅 원론', 'Principles of Marketing', 3, 'Business Administration', 'ELECTIVE', 'Wed', '11:00', '12:30', 'Business Hall 401'),
('대학 수학 1', 'Calculus 1', 3, 'Mathematics', 'REQUIRED', 'Tue', '10:30', '12:00', 'Science Bldg 205'),
('대학 수학 1', 'Calculus 1', 3, 'Mathematics', 'REQUIRED', 'Fri', '10:30', '12:00', 'Science Bldg 205');

-- 4. SEED MAP FACILITIES
INSERT INTO facility (name, type, latitude, longitude, hours, details) VALUES
('PNU Main Library (중앙도서관)', 'Library', 35.233500, 129.079200, '06:00 - 23:00', 'Main campus study resources. Features extensive reading rooms on the 3rd floor.'),
('Geumjeong Hall Cafeteria (금정회관)', 'Cafeteria', 35.231200, 129.081100, '08:00 - 19:00', 'Popular student dining hall located next to CSE classrooms. Serves local Korean set meals.'),
('Moonchang Hall Cafeteria (문창회관)', 'Cafeteria', 35.234800, 129.078000, '11:00 - 18:30', 'North campus cafeteria featuring Western-style options and sandwich counters.'),
('University Headquarters (대학본부)', 'Administrative', 35.230100, 129.082500, '09:00 - 18:00', 'Office of International Affairs (OIA) is on the 2nd floor for Visa & ARC documentation.'),
('Woongbee Hall Dormitory (웅비관)', 'Dormitory', 35.236500, 129.075500, '24 Hours', 'Freshman international dorms located near the Geumjeongsan mountain edge.')
ON CONFLICT (name) DO NOTHING;

-- 5. SEED NOTICES
INSERT INTO notice (title, content, language, posted_date) VALUES
('Guidelines for Alien Registration Card (ARC) Application', 'All incoming international students must apply for ARC within 90 days of arrival. Document checklist: passport, photo, enrollment certificate, fee (30,000 KRW).', 'English', '2026-06-20 10:00:00'),
('National Health Insurance Enrollment Instructions', 'Automatic enrollment in Korea National Health Insurance is mandatory for international students starting from the month of arrival. Monthly bills will be mailed.', 'English', '2026-06-22 14:00:00');

-- 6. SEED FORUM POSTS
INSERT INTO post (board_id, student_id, title, content, created_at) VALUES
(3, '202455393', 'ARC Application Processing Time', 'Does anyone know how long the ARC card processing takes right now? I submitted it 2 weeks ago.', '2026-06-25 10:15:30'),
(1, '202399999', 'Visa extension document review window', 'Hello! Quick heads up that the OIA is doing pre-checks on visa extensions this week.', '2026-06-27 11:30:00');

-- 7. SEED COMMENTS
INSERT INTO comment (post_id, student_id, content, created_at) VALUES
(1, '202012345', 'Usually takes about 3 to 4 weeks during peak semesters. I recommend booking the appointment early!', '2026-06-25 11:00:00'),
(1, '202455393', 'Ah, I see! Thank you for the info.', '2026-06-25 11:20:00');
