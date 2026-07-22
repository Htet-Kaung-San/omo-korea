-- Hey! PNU Initial Seed Script

-- 1. SEED MAJORS
INSERT INTO major (major_name, department) VALUES
('Computer Science & Engineering', 'CSE Department'),
('Business Administration', 'School of Business'),
('Mechanical Engineering', 'Engineering College'),
('Korean Language & Literature', 'Humanities College'),
('Artificial Intelligence', 'ICE Department'),
('Computer Engineering', 'ICE Department')
ON CONFLICT (major_name) DO NOTHING;

-- 2. SEED STUDENTS (Password is hashed 'password' using bcryptjs)
INSERT INTO student (student_id, password, name, nationality, major_id, student_type, visa_status, language_pref, email, phone) VALUES
('202455393', '$2a$10$U9HkfeY2R0x.bF3uF3l70e6U5oH6k.vL03iP/M.aD3p/hJ1lH/eOm', 'Pan Khin Khin Zaw', 'Myanmar', 1, 'Freshman', 'D-2', 'en', 'pan@pnu.edu', '010-9999-8888'),
('202600001', '$2b$10$CHlA1tzJuUJaTTtQAgcTvewHiInG0JX0465iR56Pk2x9BFW2MM7pC', 'Sample Student', 'Vietnam', 1, 'Current', 'D-2', 'en', '202600001@pnu.edu', '010-0000-0001'),
('202012345', '$2a$10$U9HkfeY2R0x.bF3uF3l70e6U5oH6k.vL03iP/M.aD3p/hJ1lH/eOm', 'Min-Jun Kim', 'South Korea', 1, 'Current', 'None', 'ko', 'mj@pnu.edu', '010-1234-5678'),
('202399999', '$2a$10$U9HkfeY2R0x.bF3uF3l70e6U5oH6k.vL03iP/M.aD3p/hJ1lH/eOm', 'Yuki Tanaka', 'Japan', 2, 'Current', 'D-2', 'ja', 'yuki@pnu.edu', '010-8888-7777')
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
INSERT INTO facility (
  name, type, latitude, longitude, hours, details, floors,
  subtitle, phone, website, image_url, departments, amenities
) VALUES
(
  'PNU Main Library (중앙도서관)', 'Library', 35.233500, 129.079200, '06:00 - 23:00',
  'Main campus study resources. Features extensive reading rooms on the 3rd floor.',
  '1F: Main Study Lounge & Check-in; 2F: Book Stacks & Reference; 3F: Silent Study Desks & Computers',
  'Study rooms, Books', '051-510-1800', 'https://lib.pusan.ac.kr',
  'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200&q=80',
  '[{"name":"General Reading Rooms","floor":"1F"},{"name":"Book Stacks & Reference","floor":"2F"},{"name":"Silent Study Desks","floor":"3F"}]'::jsonb,
  '[{"name":"Study Rooms","floor":"1F-3F"},{"name":"Computers","floor":"3F"}]'::jsonb
),
(
  'Geumjeong Hall Cafeteria (금정회관)', 'Cafeteria', 35.231200, 129.081100, '08:00 - 19:00',
  'Popular student dining hall located next to CSE classrooms. Serves local Korean set meals.',
  '1F: Student Cafeteria (Korean Menu); 2F: Convenience Store & Café',
  'Food & Drinks', '051-510-1200', 'https://www.pusan.ac.kr',
  'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=1200&q=80',
  '[{"name":"Student Cafeteria","floor":"1F"},{"name":"Convenience Store & Cafe","floor":"2F"}]'::jsonb,
  '[{"name":"Korean Set Meals","floor":"1F"}]'::jsonb
),
(
  'Moonchang Hall Cafeteria (문창회관)', 'Cafeteria', 35.234800, 129.078000, '11:00 - 18:30',
  'North campus cafeteria featuring Western-style options and sandwich counters.',
  '1F: International Buffet & Western Corner; 2F: Student Lounge & Copy Center',
  'Food & Drinks', '051-510-1210', 'https://www.pusan.ac.kr',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
  '[{"name":"International Buffet","floor":"1F"},{"name":"Student Lounge","floor":"2F"}]'::jsonb,
  '[{"name":"Western Corner","floor":"1F"}]'::jsonb
),
(
  'University Headquarters (대학본부)', 'Administrative', 35.230100, 129.082500, '09:00 - 18:00',
  'Office of International Affairs (OIA) is on the 2nd floor for Visa & ARC documentation.',
  '1F: Student Service Center; 2F: Office of International Affairs (OIA); 3F: President''s Office',
  'Admin & Student Services', '051-510-1000', 'https://www.pusan.ac.kr',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80',
  '[{"name":"Student Service Center","floor":"1F"},{"name":"Office of International Affairs","floor":"2F"}]'::jsonb,
  '[{"name":"Visa & ARC Desk","floor":"2F"}]'::jsonb
),
(
  'Woongbee Hall Dormitory (웅비관)', 'Dormitory', 35.236500, 129.075500, '24 Hours',
  'Freshman international dorms located near the Geumjeongsan mountain edge.',
  '1F: Lobby & Security Desk; 2F-8F: Student Dormitory Rooms; B1: Gym, Laundry & Kitchen',
  'International Housing', '051-510-3500', 'https://dorm.pusan.ac.kr',
  'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200&q=80',
  '[{"name":"Lobby & Security","floor":"1F"},{"name":"Student Rooms","floor":"2F-8F"}]'::jsonb,
  '[{"name":"Gym","floor":"B1"},{"name":"Laundry","floor":"B1"}]'::jsonb
),
(
  'Engineering Building 3', 'Academic', 35.233000, 129.080500, '08:00 AM - 10:00 PM',
  'Home of Computer Science and multimedia labs.',
  '2F: Seminar Room; 3F: CS Dept & Labs',
  'Computer Science Dept.', '051-510-2200', 'https://cse.pusan.ac.kr',
  'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200&q=80',
  '[{"name":"Computer Science Department","floor":"3F"},{"name":"Multimedia Lab","floor":"3F"},{"name":"Lecture Rooms 301-308","floor":"3F"},{"name":"Seminar Room","floor":"2F"}]'::jsonb,
  '[{"name":"Computer Labs","floor":"3F"},{"name":"Seminar Room","floor":"2F"}]'::jsonb
),
(
  'IT Building', 'Academic', 35.234200, 129.081000, '08:00 AM - 09:00 PM',
  'Information technology classrooms and labs.',
  '1F-4F: IT classrooms and labs',
  'IT & Computing', '051-510-2210', 'https://www.pusan.ac.kr',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
  '[{"name":"IT Help Desk","floor":"1F"},{"name":"Programming Labs","floor":"2F-3F"}]'::jsonb,
  '[{"name":"Public Computers","floor":"1F"}]'::jsonb
),
(
  'Main Hall', 'Administrative', 35.232500, 129.078800, '09:00 AM - 06:00 PM',
  'Central campus hall for events and ceremonies.',
  '1F: Lobby; 2F: Auditorium',
  'Events & Ceremonies', '051-510-1100', 'https://www.pusan.ac.kr',
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&q=80',
  '[{"name":"Main Auditorium","floor":"2F"},{"name":"Reception","floor":"1F"}]'::jsonb,
  '[{"name":"Event Hall","floor":"2F"}]'::jsonb
),
(
  'Student Center', 'Student Life', 35.232000, 129.079800, '08:00 AM - 10:00 PM',
  'Clubs, student council, and campus activities hub.',
  '1F-3F: Club rooms and offices',
  'Clubs & Activities', '051-510-1300', 'https://www.pusan.ac.kr',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80',
  '[{"name":"Student Council","floor":"2F"},{"name":"Club Offices","floor":"1F-3F"}]'::jsonb,
  '[{"name":"Meeting Rooms","floor":"2F"}]'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- 4b. Academic records demo: one summary + semester history per student
DO $$
DECLARE
  s RECORD;
  idx INTEGER := 0;
  overall NUMERIC(3, 2);
  completed INTEGER;
BEGIN
  FOR s IN SELECT student_id FROM student ORDER BY student_id LOOP
    idx := idx + 1;
    overall := LEAST(3.30 + (idx * 0.12), 4.00);
    completed := LEAST(60 + (idx * 4), 100);

    DELETE FROM academic_record WHERE student_id = s.student_id;

    INSERT INTO academic_record (
      student_id, record_type, overall_gpa, gpa_scale, standing,
      completed_credits, required_credits, sort_order
    ) VALUES (
      s.student_id,
      'summary',
      overall,
      4.5,
      CASE
        WHEN overall >= 3.7 THEN 'Good'
        WHEN overall >= 3.5 THEN 'Satisfactory'
        ELSE 'Warning'
      END,
      completed,
      100,
      0
    );

    INSERT INTO academic_record (student_id, record_type, semester_label, gpa, sort_order) VALUES
    (s.student_id, 'semester', '2024 Spring', LEAST(overall + 0.13, 4.50), 1),
    (s.student_id, 'semester', '2023 Fall', GREATEST(overall - 0.07, 0), 2),
    (s.student_id, 'semester', '2023 Spring', GREATEST(overall - 0.22, 0), 3),
    (s.student_id, 'semester', '2022 Fall', GREATEST(overall - 0.37, 0), 4);
  END LOOP;
END $$;

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
