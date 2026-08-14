-- =========================================================================
-- Re-seed Graduation Requirements for updated Major IDs
-- =========================================================================

-- Clear existing data
-- Note: Uncomment these if you want to wipe the table before inserting!
-- DELETE FROM student_graduation_requirement;
-- DELETE FROM graduation_requirement;

-- Insert new graduation_requirement Rows
-- NOTE: Please replace 'TBD' with the actual credit requirements!
INSERT INTO graduation_requirement
(req_id, major_id, requirement_code, requirement_name, requirement_type, target_value, unit, description, display_order)
OVERRIDING SYSTEM VALUE
VALUES
-- major_id 36 (Electrical Engineering) [req_id 1-7]
(1, 36, 'MAJOR_BASIC', '전공기초', 'CREDIT', 25, 'credits', 'Major foundation credits.', 1),
(2, 36, 'MAJOR_REQUIRED', '전공필수', 'CREDIT', 48, 'credits', 'Major required credits.', 2),
(3, 36, 'MAJOR_ELECTIVE', '전공선택', 'CREDIT', 33, 'credits', 'Major elective credits.', 3),
(4, 36, 'HYOWON_CORE', '효원핵심교양', 'CREDIT', 10, 'credits', 'Hyowon Core liberal arts credits.', 4),
(5, 36, 'HYOWON_BALANCE', '효원균형교양', 'CREDIT', 9, 'credits', 'Hyowon Balanced liberal arts credits.', 5),
(6, 36, 'HYOWON_CREATIVE', '효원창의교양', 'CREDIT', 6, 'credits', 'Hyowon Creative liberal arts credits.', 6),
(7, 36, 'GENERAL_ELECTIVE', '일반선택', 'CREDIT', 6, 'credits', 'General elective credits.', 7),

-- major_id 105 (Computer Science and Engineering - Computer Engineering major) [req_id 8-14]
(8, 105, 'MAJOR_BASIC', '전공기초', 'CREDIT', 25, 'credits', 'Major foundation credits.', 1),
(9, 105, 'MAJOR_REQUIRED', '전공필수', 'CREDIT', 37, 'credits', 'Major required credits.', 2),
(10, 105, 'MAJOR_ELECTIVE', '전공선택', 'CREDIT', 40, 'credits', 'Major elective credits.', 3),
(11, 105, 'HYOWON_CORE', '효원핵심교양', 'CREDIT', 10, 'credits', 'Hyowon Core liberal arts credits.', 4),
(12, 105, 'HYOWON_BALANCE', '효원균형교양', 'CREDIT', 9, 'credits', 'Hyowon Balanced liberal arts credits.', 5),
(13, 105, 'HYOWON_CREATIVE', '효원창의교양', 'CREDIT', 6, 'credits', 'Hyowon Creative liberal arts credits.', 6),
(14, 105, 'GENERAL_ELECTIVE', '일반선택', 'CREDIT', 6, 'credits', 'General elective credits.', 7),

-- ---------------------------------------------------------
-- STARTING FROM 15 (Continuing major_id 105 + other majors)
-- ---------------------------------------------------------

-- major_id 105 (Computer Engineering - Continued extra 3 requirements) [req_id 15-17]
(15, 105, 'TOPIK', 'TOPIK Level 4 or higher', 'PASS_FAIL', '1', NULL, 'Obtain TOPIK Level 4 or higher (TOPIK 4급 이상).', 8),
(16, 105, 'GRAD_PROJECT', '졸업과제', 'PASS_FAIL', '1', NULL, 'Complete the graduation project (졸업과제).', 9),
(17, 105, 'TOPCIT', 'TOPCIT 220', 'PASS_FAIL', '220', 'points', 'Obtain TOPCIT score of 220 or higher.', 10),

-- major_id 35 (Electronic Engineering) [req_id 18-26]
(18, 35, 'MAJOR_BASIC', '전공기초', 'CREDIT', 25, 'credits', 'Major foundation credits.', 1),
(19, 35, 'MAJOR_REQUIRED', '전공필수', 'CREDIT', 48, 'credits', 'Major required credits.', 2),
(20, 35, 'MAJOR_ELECTIVE', '전공선택', 'CREDIT', 33, 'credits', 'Major elective credits.', 3),
(21, 35, 'HYOWON_CORE', '효원핵심교양', 'CREDIT', 10, 'credits', 'Hyowon Core liberal arts credits.', 4),
(22, 35, 'HYOWON_BALANCE', '효원균형교양', 'CREDIT', 9, 'credits', 'Hyowon Balanced liberal arts credits.', 5),
(23, 35, 'HYOWON_CREATIVE', '효원창의교양', 'CREDIT', 6, 'credits', 'Hyowon Creative liberal arts credits.', 6),
(24, 35, 'GENERAL_ELECTIVE', '일반선택', 'CREDIT', 6, 'credits', 'General elective credits.', 7),
(25, 35, 'TOPIK', 'TOPIK Level 4 or higher', 'PASS_FAIL', '1', NULL, 'Obtain TOPIK Level 4 or higher (TOPIK 4급 이상).', 8),
(26, 35, 'GRAD_PROJECT', 'Graduation Project', 'PASS_FAIL', '1', NULL, 'Complete the graduation project.', 9),

-- major_id 41 (Aerospace Engineering) [req_id 27-35]
(27, 41, 'MAJOR_BASIC', '전공기초', 'CREDIT', 25, 'credits', 'Major foundation credits.', 1),
(28, 41, 'MAJOR_REQUIRED', '전공필수', 'CREDIT', 48, 'credits', 'Major required credits.', 2),
(29, 41, 'MAJOR_ELECTIVE', '전공선택', 'CREDIT', 33, 'credits', 'Major elective credits.', 3),
(30, 41, 'HYOWON_CORE', '효원핵심교양', 'CREDIT', 10, 'credits', 'Hyowon Core liberal arts credits.', 4),
(31, 41, 'HYOWON_BALANCE', '효원균형교양', 'CREDIT', 9, 'credits', 'Hyowon Balanced liberal arts credits.', 5),
(32, 41, 'HYOWON_CREATIVE', '효원창의교양', 'CREDIT', 6, 'credits', 'Hyowon Creative liberal arts credits.', 6),
(33, 41, 'GENERAL_ELECTIVE', '일반선택', 'CREDIT', 6, 'credits', 'General elective credits.', 7),
(34, 41, 'TOPIK', 'TOPIK Level 4 or higher', 'PASS_FAIL', '1', NULL, 'Obtain TOPIK Level 4 or higher (TOPIK 4급 이상).', 8),
(35, 41, 'CAPSTONE_PROJECT', 'Capstone Design Project', 'PASS_FAIL', '1', NULL, 'Complete the Capstone Design Project.', 9),

-- major_id 34 (Environmental Engineering) [req_id 36-44]
(36, 34, 'MAJOR_BASIC', '전공기초', 'CREDIT', 25, 'credits', 'Major foundation credits.', 1),
(37, 34, 'MAJOR_REQUIRED', '전공필수', 'CREDIT', 48, 'credits', 'Major required credits.', 2),
(38, 34, 'MAJOR_ELECTIVE', '전공선택', 'CREDIT', 33, 'credits', 'Major elective credits.', 3),
(39, 34, 'HYOWON_CORE', '효원핵심교양', 'CREDIT', 10, 'credits', 'Hyowon Core liberal arts credits.', 4),
(40, 34, 'HYOWON_BALANCE', '효원균형교양', 'CREDIT', 9, 'credits', 'Hyowon Balanced liberal arts credits.', 5),
(41, 34, 'HYOWON_CREATIVE', '효원창의교양', 'CREDIT', 6, 'credits', 'Hyowon Creative liberal arts credits.', 6),
(42, 34, 'GENERAL_ELECTIVE', '일반선택', 'CREDIT', 6, 'credits', 'General elective credits.', 7),
(43, 34, 'TOPIK', 'TOPIK Level 4 or higher', 'PASS_FAIL', '1', NULL, 'Obtain TOPIK Level 4 or higher (TOPIK 4급 이상).', 8),
(44, 34, 'ENV_CREATIVE_PROJECT', '환경창의프로젝트', 'PASS_FAIL', '1', NULL, 'Complete the Environmental Creative Project (환경창의프로젝트).', 9),

-- major_id 43 (Architecture) [req_id 45-52]
(45, 43, 'MAJOR_BASIC', '전공기초', 'CREDIT', 15, 'credits', 'Major foundation credits.', 1),
(46, 43, 'MAJOR_REQUIRED', '전공필수', 'CREDIT', 102, 'credits', 'Major required credits.', 2),
(47, 43, 'MAJOR_ELECTIVE', '전공선택', 'CREDIT', 18, 'credits', 'Major elective credits.', 3),
(48, 43, 'GENERAL_REQUIRED', '교양필수', 'CREDIT', 9, 'credits', 'General education required credits.', 4),
(49, 43, 'LIBERAL_ELECTIVE', '교양선택', 'CREDIT', 21, 'credits', 'General education elective credits.', 5),
(50, 43, 'GENERAL_ELECTIVE', '일반선택', 'CREDIT', 3, 'credits', 'General elective credits.', 6),
(51, 43, 'TOPIK', 'TOPIK Level 4 or higher', 'PASS_FAIL', '1', NULL, 'Obtain TOPIK Level 4 or higher (TOPIK 4급 이상).', 7),
(52, 43, 'GRAD_WORK', '졸업작품', 'PASS_FAIL', '1', NULL, 'Complete the graduation work (졸업작품).', 8),

-- major_id 44 (Urban Engineering)
(53, 44, 'MAJOR_BASIC', '전공기초', 'CREDIT', 25, 'credits', 'Major foundation credits.', 1),
(54, 44, 'MAJOR_REQUIRED', '전공필수', 'CREDIT', 45, 'credits', 'Major required credits.', 2),
(55, 44, 'MAJOR_ELECTIVE', '전공선택', 'CREDIT', 36, 'credits', 'Major elective credits.', 3),
(56, 44, 'GENERAL_REQUIRED', '교양필수', 'CREDIT', 10, 'credits', 'General education required credits.', 4),
(57, 44, 'LIBERAL_ELECTIVE', '교양선택', 'CREDIT', 15, 'credits', 'General education elective credits.', 5),
(58, 44, 'GENERAL_ELECTIVE', '일반선택', 'CREDIT', 6, 'credits', 'General elective credits.', 6),
(59, 44, 'TOPIK', 'TOPIK Level 4 or higher', 'PASS_FAIL', '1', NULL, 'Obtain TOPIK Level 4 or higher (TOPIK 4급 이상).', 7),
(60, 44, 'GRAD_THESIS_OR_PROJECT', '졸업논문 or 졸업작품', 'PASS_FAIL', '1', NULL, 'Complete graduation thesis or project (졸업논문 or 졸업작품).', 8),

-- major_id 40 (Industrial Engineering)
(61, 40, 'MAJOR_BASIC', '전공기초', 'CREDIT', 25, 'credits', 'Major foundation credits.', 1),
(62, 40, 'MAJOR_REQUIRED', '전공필수', 'CREDIT', 36, 'credits', 'Major required credits.', 2),
(63, 40, 'MAJOR_ELECTIVE', '전공선택', 'CREDIT', 45, 'credits', 'Major elective credits.', 3),
(64, 40, 'HYOWON_CORE', '효원핵심교양', 'CREDIT', 10, 'credits', 'Hyowon Core liberal arts credits.', 4),
(65, 40, 'HYOWON_BALANCE', '효원균형교양', 'CREDIT', 9, 'credits', 'Hyowon Balanced liberal arts credits.', 5),
(66, 40, 'HYOWON_CREATIVE', '효원창의교양', 'CREDIT', 6, 'credits', 'Hyowon Creative liberal arts credits.', 6),
(67, 40, 'GENERAL_ELECTIVE', '일반선택', 'CREDIT', 6, 'credits', 'General elective credits.', 7),
(68, 40, 'TOPIK', 'TOPIK Level 4 or higher', 'PASS_FAIL', '1', NULL, 'Obtain TOPIK Level 4 or higher (TOPIK 4급 이상).', 8),
(69, 40, 'GRAD_THESIS', '졸업논문', 'PASS_FAIL', '1', NULL, 'Complete graduation thesis (졸업논문).', 9),

-- major_id 31 (Polymer Engineering)
(70, 31, 'MAJOR_BASIC', '전공기초', 'CREDIT', 25, 'credits', 'Major foundation credits.', 1),
(71, 31, 'MAJOR_REQUIRED', '전공필수', 'CREDIT', 46, 'credits', 'Major required credits.', 2),
(72, 31, 'MAJOR_ELECTIVE', '전공선택', 'CREDIT', 35, 'credits', 'Major elective credits.', 3),
(73, 31, 'HYOWON_CORE', '효원핵심교양', 'CREDIT', 10, 'credits', 'Hyowon Core liberal arts credits.', 4),
(74, 31, 'HYOWON_BALANCE', '효원균형교양', 'CREDIT', 9, 'credits', 'Hyowon Balanced liberal arts credits.', 5),
(75, 31, 'HYOWON_CREATIVE', '효원창의교양', 'CREDIT', 6, 'credits', 'Hyowon Creative liberal arts credits.', 6),
(76, 31, 'GENERAL_ELECTIVE', '일반선택', 'CREDIT', 6, 'credits', 'General elective credits.', 7),
(77, 31, 'TOPIK', 'TOPIK Level 4 or higher', 'PASS_FAIL', '1', NULL, 'Obtain TOPIK Level 4 or higher (TOPIK 4급 이상).', 8),

-- major_id 39 (Materials Engineering)
(78, 39, 'MAJOR_BASIC', '전공기초', 'CREDIT', 25, 'credits', 'Major foundation credits.', 1),
(79, 39, 'MAJOR_REQUIRED', '전공필수', 'CREDIT', 36, 'credits', 'Major required credits.', 2),
(80, 39, 'MAJOR_ELECTIVE', '전공선택', 'CREDIT', 45, 'credits', 'Major elective credits.', 3),
(81, 39, 'HYOWON_CORE', '효원핵심교양', 'CREDIT', 10, 'credits', 'Hyowon Core liberal arts credits.', 4),
(82, 39, 'HYOWON_BALANCE', '효원균형교양', 'CREDIT', 9, 'credits', 'Hyowon Balanced liberal arts credits.', 5),
(83, 39, 'HYOWON_CREATIVE', '효원창의교양', 'CREDIT', 6, 'credits', 'Hyowon Creative liberal arts credits.', 6),
(84, 39, 'GENERAL_ELECTIVE', '일반선택', 'CREDIT', 6, 'credits', 'General elective credits.', 7),
(85, 39, 'TOPIK', 'TOPIK Level 4 or higher', 'PASS_FAIL', '1', NULL, 'Obtain TOPIK Level 4 or higher (TOPIK 4급 이상).', 8),
(86, 39, 'CAPSTONE_PROJECT', 'Capstone Design Project', 'PASS_FAIL', '1', NULL, 'Complete the Capstone Design Project.', 9),

-- major_id 38 (Naval Architecture and Ocean Engineering)
(87, 38, 'MAJOR_BASIC', '전공기초', 'CREDIT', 25, 'credits', 'Major foundation credits.', 1),
(88, 38, 'MAJOR_REQUIRED', '전공필수', 'CREDIT', 47, 'credits', 'Major required credits.', 2),
(89, 38, 'MAJOR_ELECTIVE', '전공선택', 'CREDIT', 34, 'credits', 'Major elective credits.', 3),
(90, 38, 'GENERAL_REQUIRED', '교양필수', 'CREDIT', 10, 'credits', 'General education required credits.', 4),
(91, 38, 'LIBERAL_ELECTIVE', '교양선택', 'CREDIT', 15, 'credits', 'General education elective credits.', 5),
(92, 38, 'GENERAL_ELECTIVE', '일반선택', 'CREDIT', 6, 'credits', 'General elective credits.', 6),
(93, 38, 'TOPIK', 'TOPIK Level 4 or higher', 'PASS_FAIL', '1', NULL, 'Obtain TOPIK Level 4 or higher (TOPIK 4급 이상).', 7),
(94, 38, 'GRAD_EXAM', '졸업시험', 'PASS_FAIL', '1', NULL, 'Pass the graduation exam (졸업시험).', 8),

-- major_id 42 (Architectural Engineering)
(95, 42, 'MAJOR_BASIC', '전공기초', 'CREDIT', 27, 'credits', 'Major foundation credits.', 1),
(96, 42, 'MAJOR_REQUIRED', '전공필수', 'CREDIT', 36, 'credits', 'Major required credits.', 2),
(97, 42, 'MAJOR_ELECTIVE', '전공선택', 'CREDIT', 45, 'credits', 'Major elective credits.', 3),
(98, 42, 'HYOWON_CORE', '효원핵심교양', 'CREDIT', 10, 'credits', 'Hyowon Core liberal arts credits.', 4),
(99, 42, 'HYOWON_BALANCE', '효원균형교양', 'CREDIT', 9, 'credits', 'Hyowon Balanced liberal arts credits.', 5),
(100, 42, 'HYOWON_CREATIVE', '효원창의교양', 'CREDIT', 6, 'credits', 'Hyowon Creative liberal arts credits.', 6),
(101, 42, 'GENERAL_ELECTIVE', '일반선택', 'CREDIT', 4, 'credits', 'General elective credits.', 7),
(102, 42, 'TOPIK', 'TOPIK Level 4 or higher', 'PASS_FAIL', '1', NULL, 'Obtain TOPIK Level 4 or higher (TOPIK 4급 이상).', 8),
(103, 42, 'CAPSTONE_PROJECT', 'Capstone Design Project', 'PASS_FAIL', '1', NULL, 'Complete the Capstone Design Project.', 9)
ON CONFLICT (req_id) DO UPDATE SET
  major_id = EXCLUDED.major_id,
  requirement_code = EXCLUDED.requirement_code,
  requirement_name = EXCLUDED.requirement_name,
  requirement_type = EXCLUDED.requirement_type,
  target_value = EXCLUDED.target_value,
  unit = EXCLUDED.unit,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;
