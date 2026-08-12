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
INSERT INTO facility (building_number, name, name_ko, type, latitude, longitude) VALUES
('101', 'MEMS / NANO Cleanroom', 'MEMS / NANO 클린룸동', 'Research', 0, 0),
('102', 'IT Building', 'IT관', 'Academic', 0, 0),
('103', 'Engineering Building 12', '제12공학관', 'Academic', 0, 0),
('105', 'Engineering Building 3 (Convergence Mechanical)', '제3공학관(융합기계관)', 'Academic', 0, 0),
('106', 'Hyowon Culture Hall', '효원문화회관', 'Student Life', 0, 0),
('107', 'Engineering Building 8 (Aeronautical)', '제8공학관(항공관)', 'Academic', 0, 0),
('108', 'Engineering Building 9 (Mechatronics)', '제9공학관(기전관)', 'Academic', 0, 0),
('109', 'College of Engineering Joint Lab', '공과대학 공동실험관', 'Academic', 0, 0),
('110', 'Energy Research Laboratory', '에너지분야 실험실', 'Research', 0, 0),
('201', 'Engineering Building 6 (Computer Engineering)', '제6공학관(컴퓨터공학관)', 'Academic', 0, 0),
('202', 'Unjukjeong Pavilion', '운죽정', 'Student Life', 0, 0),
('203', 'Neokneokhan-teo Plaza', '넉넉한터', 'Student Life', 0, 0),
('205', 'University Headquarters', '대학본부', 'Administrative', 0, 0),
('206', 'Engineering Building 11 (Naval Architecture)', '제11공학관(조선해양공학관)', 'Academic', 0, 0),
('207', 'Engineering Building 10 (Specialized Engineering)', '제10공학관(특성화공학관)', 'Academic', 0, 0),
('208', 'Mechanical Technology Research Building', '기계기술연구동', 'Research', 0, 0),
('209', 'Sangnam International House', '상남국제관', 'Administrative', 0, 0),
('210', 'Language Education Institute', '언어교육원', 'Administrative', 0, 0),
('211', 'Comprehensive Childcare Center', '보육종합센터', 'Administrative', 0, 0),
('301', 'Structural Engineering Lab', '구조실험동', 'Research', 0, 0),
('302', 'Geotechnical Engineering Lab', '토조실험동', 'Research', 0, 0),
('303', 'Mechanical Engineering Building', '기계관', 'Academic', 0, 0),
('306', 'College of Humanities', '인문관', 'Academic', 0, 0),
('307', 'Humanities Faculty Research Building', '인문대교수연구동', 'Academic', 0, 0),
('308', 'Physics Building 1', '제1물리관', 'Academic', 0, 0),
('309', 'Physics Building 2', '제2물리관', 'Academic', 0, 0),
('310', 'Moonchang Hall Cafeteria', '문창회관', 'Cafeteria', 0, 0),
('311', 'Joint Research Equipment Building', '공동연구기기동', 'Research', 0, 0),
('312', 'Joint Research & Experiment Building', '공동실험실습관', 'Research', 0, 0),
('313', 'Natural Sciences Research Building', '자연대 연구실험동', 'Research', 0, 0),
('314', 'Informatics Education Building', '정보화교육관', 'Academic', 0, 0),
('315', 'Jayu Hall Dormitory Building A', '자유관 A동', 'Dormitory', 0, 0),
('316', 'Jayu Hall Dormitory Building B', '자유관 B동', 'Dormitory', 0, 0),
('317', 'Daycare Center', '직장어린이집', 'Administrative', 0, 0),
('401', 'Construction & Architecture Building', '건설관', 'Academic', 0, 0),
('402', 'Jeonghak Hall', '정학관', 'Academic', 0, 0),
('403', '10.16 Memorial Hall', '10.16 기념관', 'Student Life', 0, 0),
('405', 'Engineering Building 2 (Materials Science)', '제2공학관(재료관)', 'Academic', 0, 0),
('406', 'Engineering Building 7 (Chemical Engineering)', '제7공학관(화공관)', 'Academic', 0, 0),
('407', 'Towing Tank Research Building', '선박예인수조연구동', 'Research', 0, 0),
('408', 'Engineering Building 5 (Organic Materials)', '제5공학관(유기소재관)', 'Academic', 0, 0),
('409', 'Faculty Hall', '교수회관', 'Administrative', 0, 0),
('410', 'Ship Impact & Fatigue Test Lab', '선박충격ㆍ피로ㆍ도장시험연구동', 'Research', 0, 0),
('412', 'Museum Building A', '박물관 A', 'Student Life', 0, 0),
('413', 'Museum Building B', '박물관 B', 'Student Life', 0, 0),
('414', 'Earth Sciences Building', '지구관', 'Academic', 0, 0),
('415', 'Saetbeol Hall', '샛벌회관', 'Student Life', 0, 0),
('416', 'Biological Sciences Building', '생물관', 'Academic', 0, 0),
('417', 'College of Education Building 1', '제1사범관', 'Academic', 0, 0),
('418', 'Faculty Research Building 2', '제2교수연구동', 'Academic', 0, 0),
('419', 'Geumjeong Hall Cafeteria', '금정회관', 'Cafeteria', 0, 0),
('420', 'Saebyeokbeol Library', '새벽벌도서관', 'Library', 0, 0),
('421', 'College of Social Sciences', '사회관', 'Academic', 0, 0),
('422', 'Seonghak Hall', '성학관', 'Academic', 0, 0),
('501', 'Advanced Science Building', '첨단과학관', 'Research', 0, 0),
('503', 'College of Pharmacy', '약학관', 'Academic', 0, 0),
('506', 'Hyowon Industry-Academia Cooperation Hall', '효원산학협동관', 'Research', 0, 0),
('507', 'Indeok Hall', '인덕관', 'Academic', 0, 0),
('508', 'Industry-Academia Cooperation Hall', '산학협동관', 'Research', 0, 0),
('509', 'Museum Annex', '박물관 별관', 'Student Life', 0, 0),
('510', 'Central Library', '중앙도서관', 'Library', 0, 0),
('511', 'Gymnasium Annex', '간이체육관', 'Sports', 0, 0),
('512', 'Tennis Courts', '테니스장', 'Sports', 0, 0),
('514', 'College of Business Administration', '경영관', 'Academic', 0, 0),
('515', 'Central Library Annex & AX Innovation Center', '중앙도서관 및 AX·정보화혁신본부', 'Library', 0, 0),
('516', 'College of Economics & International Trade', '경제통상관', 'Academic', 0, 0),
('601', 'College of Arts', '예술관', 'Academic', 0, 0),
('602', 'College of Human Ecology (Lecture Hall)', '생활과학관 강의동', 'Academic', 0, 0),
('603', 'College of Human Ecology (Research Hall)', '생활과학관 연구동', 'Academic', 0, 0),
('605', 'ROTC Building', '학군단', 'Administrative', 0, 0),
('606', 'Chemistry Building', '화학관', 'Academic', 0, 0),
('607', 'Mathematics & Joint Institute Building', '수학관·공동연구소동', 'Academic', 0, 0),
('608', 'Law School Building 2', '제2법학관', 'Academic', 0, 0),
('609', 'Law School Building 1', '법학관', 'Academic', 0, 0),
('701', 'College of Education Building 2', '제2사범관', 'Academic', 0, 0),
('702', 'Sculpture Studio', '조소실', 'Academic', 0, 0),
('703', 'Fine Arts Building', '미술관', 'Academic', 0, 0),
('704', 'Design Building', '조형관', 'Academic', 0, 0),
('705', 'Gyeongam Gymnasium (Faculty Research)', '경암체육관 교수연구동', 'Sports', 0, 0),
('706', 'Gyeongam Gymnasium', '경암체육관', 'Sports', 0, 0),
('707', 'Music Building', '음악관', 'Academic', 0, 0),
('708', 'Student Union Building', '학생회관', 'Student Life', 0, 0),
('709', 'Science & Technology Research Building', '과학기술연구동', 'Research', 0, 0),
('710', 'Main Athletics Field', '대운동장', 'Sports', 0, 0),
('711', 'Hyowonjae Study Hall', '효원재', 'Academic', 0, 0),
('712', 'Ungbi Hall Dormitory Building A', '웅비관 A동', 'Dormitory', 0, 0),
('713', 'Ungbi Hall Dormitory Building B', '웅비관 B동', 'Dormitory', 0, 0),
('714', 'Jinri Hall Administration', '진리관 관리동', 'Dormitory', 0, 0),
('715', 'Jinri Hall Dormitory Building A', '진리관 가동', 'Dormitory', 0, 0),
('716', 'Jinri Hall Dormitory Building B', '진리관 나동', 'Dormitory', 0, 0),
('717', 'Jinri Hall Dormitory Building C', '진리관 다동', 'Dormitory', 0, 0)
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
