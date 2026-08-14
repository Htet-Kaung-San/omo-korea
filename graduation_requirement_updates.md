# Graduation Requirement Table Updates

## 1. Rows to Delete

Delete the following `req_id`s (MAJOR_REQUIRED, MAJOR_ELECTIVE, GENERAL_ED) for **both** major_id 2 (Electrical Engineering) and major_id 8 (Computer Science and Engineering):

| req_id | major_id | requirement_code |
|---|---|---|
| 1 | 2 | MAJOR_REQUIRED |
| 2 | 2 | MAJOR_ELECTIVE |
| 3 | 2 | GENERAL_ED |
| 7 | 8 | MAJOR_REQUIRED |
| 8 | 8 | MAJOR_ELECTIVE |
| 9 | 8 | GENERAL_ED |

```sql
DELETE FROM graduation_requirement
WHERE req_id IN (1, 2, 3, 7, 8, 9);
```

(Rows GRAD_PROJECT, TOPCIT, CODING_TEST, PCCP, TOPIK for these majors are untouched.)

---

## 2. New / Reused Majors

| major_id | major_name | department | status |
|---|---|---|---|
| 46 | Aerospace Engineering | College of Engineering | already exists — reused |
| 49 | Environmental Engineering | College of Engineering | already exists — reused |
| 102 | Electronic Engineering | College of Engineering | **new — insert into major table** |
| 103 | Architecture | College of Engineering | **new — insert into major table** |

```sql
INSERT INTO major (major_id, major_name, department, department_id) VALUES
(102, 'Electronic Engineering', 'College of Engineering', 2),
(103, 'Architecture', 'College of Engineering', 2);
```
> `department_id` assumed 2 (College of Engineering) to match sibling majors — confirm if Architecture belongs to a different college/department.

---

## 3. New graduation_requirement Rows

**Note:** `target_value` / `unit` were not provided for the new category rows — marked `TBD`, please fill in actual credit/point requirements before use.

### major_id 2 — Electrical Engineering (replacement rows)

| req_id | major_id | requirement_code | requirement_name | requirement_type | target_value | unit | description | display_order |
|---|---|---|---|---|---|---|---|---|
| 14 | 2 | MAJOR_BASIC | 전공기초 | CREDIT | TBD | credits | Major foundation credits. | 1 |
| 15 | 2 | MAJOR_REQUIRED | 전공필수 | CREDIT | TBD | credits | Major required credits. | 2 |
| 16 | 2 | MAJOR_ELECTIVE | 전공선택 | CREDIT | TBD | credits | Major elective credits. | 3 |
| 17 | 2 | HYOWON_CORE | 효원핵심교양 | CREDIT | TBD | credits | Hyowon Core liberal arts credits. | 4 |
| 18 | 2 | HYOWON_BALANCE | 효원균형교양 | CREDIT | TBD | credits | Hyowon Balanced liberal arts credits. | 5 |
| 19 | 2 | HYOWON_CREATIVE | 효원창의교양 | CREDIT | TBD | credits | Hyowon Creative liberal arts credits. | 6 |
| 20 | 2 | GENERAL_ELECTIVE | 일반선택 | CREDIT | TBD | credits | General elective credits. | 7 |

### major_id 8 — Computer Science and Engineering (replacement rows)

| req_id | major_id | requirement_code | requirement_name | requirement_type | target_value | unit | description | display_order |
|---|---|---|---|---|---|---|---|---|
| 21 | 8 | MAJOR_BASIC | 전공기초 | CREDIT | TBD | credits | Major foundation credits. | 1 |
| 22 | 8 | MAJOR_REQUIRED | 전공필수 | CREDIT | TBD | credits | Major required credits. | 2 |
| 23 | 8 | MAJOR_ELECTIVE | 전공선택 | CREDIT | TBD | credits | Major elective credits. | 3 |
| 24 | 8 | HYOWON_CORE | 효원핵심교양 | CREDIT | TBD | credits | Hyowon Core liberal arts credits. | 4 |
| 25 | 8 | HYOWON_BALANCE | 효원균형교양 | CREDIT | TBD | credits | Hyowon Balanced liberal arts credits. | 5 |
| 26 | 8 | HYOWON_CREATIVE | 효원창의교양 | CREDIT | TBD | credits | Hyowon Creative liberal arts credits. | 6 |
| 27 | 8 | GENERAL_ELECTIVE | 일반선택 | CREDIT | TBD | credits | General elective credits. | 7 |

### major_id 102 — Electronic Engineering (new)

| req_id | major_id | requirement_code | requirement_name | requirement_type | target_value | unit | description | display_order |
|---|---|---|---|---|---|---|---|---|
| 28 | 102 | MAJOR_BASIC | 전공기초 | CREDIT | TBD | credits | Major foundation credits. | 1 |
| 29 | 102 | MAJOR_REQUIRED | 전공필수 | CREDIT | TBD | credits | Major required credits. | 2 |
| 30 | 102 | MAJOR_ELECTIVE | 전공선택 | CREDIT | TBD | credits | Major elective credits. | 3 |
| 31 | 102 | HYOWON_CORE | 효원핵심교양 | CREDIT | TBD | credits | Hyowon Core liberal arts credits. | 4 |
| 32 | 102 | HYOWON_BALANCE | 효원균형교양 | CREDIT | TBD | credits | Hyowon Balanced liberal arts credits. | 5 |
| 33 | 102 | HYOWON_CREATIVE | 효원창의교양 | CREDIT | TBD | credits | Hyowon Creative liberal arts credits. | 6 |
| 34 | 102 | GENERAL_ELECTIVE | 일반선택 | CREDIT | TBD | credits | General elective credits. | 7 |
| 35 | 102 | TOPIK | TOPIK Level 4 or higher | PASS_FAIL | 1 | null | Obtain TOPIK Level 4 or higher (TOPIK 4급 이상). | 8 |
| 36 | 102 | GRAD_PROJECT | Graduation Project | PASS_FAIL | 1 | null | Complete the graduation project. | 9 |

### major_id 46 — Aerospace Engineering (new rows added)

| req_id | major_id | requirement_code | requirement_name | requirement_type | target_value | unit | description | display_order |
|---|---|---|---|---|---|---|---|---|
| 37 | 46 | MAJOR_BASIC | 전공기초 | CREDIT | TBD | credits | Major foundation credits. | 1 |
| 38 | 46 | MAJOR_REQUIRED | 전공필수 | CREDIT | TBD | credits | Major required credits. | 2 |
| 39 | 46 | MAJOR_ELECTIVE | 전공선택 | CREDIT | TBD | credits | Major elective credits. | 3 |
| 40 | 46 | HYOWON_CORE | 효원핵심교양 | CREDIT | TBD | credits | Hyowon Core liberal arts credits. | 4 |
| 41 | 46 | HYOWON_BALANCE | 효원균형교양 | CREDIT | TBD | credits | Hyowon Balanced liberal arts credits. | 5 |
| 42 | 46 | HYOWON_CREATIVE | 효원창의교양 | CREDIT | TBD | credits | Hyowon Creative liberal arts credits. | 6 |
| 43 | 46 | GENERAL_ELECTIVE | 일반선택 | CREDIT | TBD | credits | General elective credits. | 7 |
| 44 | 46 | TOPIK | TOPIK Level 4 or higher | PASS_FAIL | 1 | null | Obtain TOPIK Level 4 or higher (TOPIK 4급 이상). | 8 |
| 45 | 46 | CAPSTONE_PROJECT | Capstone Design Project | PASS_FAIL | 1 | null | Complete the Capstone Design Project. | 9 |

### major_id 49 — Environmental Engineering (new rows added)

| req_id | major_id | requirement_code | requirement_name | requirement_type | target_value | unit | description | display_order |
|---|---|---|---|---|---|---|---|---|
| 46 | 49 | MAJOR_BASIC | 전공기초 | CREDIT | TBD | credits | Major foundation credits. | 1 |
| 47 | 49 | MAJOR_REQUIRED | 전공필수 | CREDIT | TBD | credits | Major required credits. | 2 |
| 48 | 49 | MAJOR_ELECTIVE | 전공선택 | CREDIT | TBD | credits | Major elective credits. | 3 |
| 49 | 49 | HYOWON_CORE | 효원핵심교양 | CREDIT | TBD | credits | Hyowon Core liberal arts credits. | 4 |
| 50 | 49 | HYOWON_BALANCE | 효원균형교양 | CREDIT | TBD | credits | Hyowon Balanced liberal arts credits. | 5 |
| 51 | 49 | HYOWON_CREATIVE | 효원창의교양 | CREDIT | TBD | credits | Hyowon Creative liberal arts credits. | 6 |
| 52 | 49 | GENERAL_ELECTIVE | 일반선택 | CREDIT | TBD | credits | General elective credits. | 7 |
| 53 | 49 | TOPIK | TOPIK Level 4 or higher | PASS_FAIL | 1 | null | Obtain TOPIK Level 4 or higher (TOPIK 4급 이상). | 8 |
| 54 | 49 | ENV_CREATIVE_PROJECT | 환경창의프로젝트 | PASS_FAIL | 1 | null | Complete the Environmental Creative Project (환경창의프로젝트). | 9 |

### major_id 103 — Architecture (new)

| req_id | major_id | requirement_code | requirement_name | requirement_type | target_value | unit | description | display_order |
|---|---|---|---|---|---|---|---|---|
| 55 | 103 | MAJOR_BASIC | 전공기초 | CREDIT | TBD | credits | Major foundation credits. | 1 |
| 56 | 103 | MAJOR_REQUIRED | 전공필수 | CREDIT | TBD | credits | Major required credits. | 2 |
| 57 | 103 | MAJOR_ELECTIVE | 전공선택 | CREDIT | TBD | credits | Major elective credits. | 3 |
| 58 | 103 | GENERAL_REQUIRED | 교양필수 | CREDIT | TBD | credits | General education required credits. | 4 |
| 59 | 103 | LIBERAL_ELECTIVE | 교양선택 | CREDIT | TBD | credits | General education elective credits. | 5 |
| 60 | 103 | GENERAL_ELECTIVE | 일반선택 | CREDIT | TBD | credits | General elective credits. | 6 |
| 61 | 103 | TOPIK | TOPIK Level 4 or higher | PASS_FAIL | 1 | null | Obtain TOPIK Level 4 or higher (TOPIK 4급 이상). | 7 |
| 62 | 103 | GRAD_WORK | 졸업작품 | PASS_FAIL | 1 | null | Complete the graduation work (졸업작품). | 8 |

---

## 4. Full INSERT SQL (new rows only)

```sql
INSERT INTO graduation_requirement
(req_id, major_id, requirement_code, requirement_name, requirement_type, target_value, unit, description, display_order)
VALUES
-- major_id 2 (Electrical Engineering) replacement rows
(14, 2, 'MAJOR_BASIC', '전공기초', 'CREDIT', 'TBD', 'credits', 'Major foundation credits.', 1),
(15, 2, 'MAJOR_REQUIRED', '전공필수', 'CREDIT', 'TBD', 'credits', 'Major required credits.', 2),
(16, 2, 'MAJOR_ELECTIVE', '전공선택', 'CREDIT', 'TBD', 'credits', 'Major elective credits.', 3),
(17, 2, 'HYOWON_CORE', '효원핵심교양', 'CREDIT', 'TBD', 'credits', 'Hyowon Core liberal arts credits.', 4),
(18, 2, 'HYOWON_BALANCE', '효원균형교양', 'CREDIT', 'TBD', 'credits', 'Hyowon Balanced liberal arts credits.', 5),
(19, 2, 'HYOWON_CREATIVE', '효원창의교양', 'CREDIT', 'TBD', 'credits', 'Hyowon Creative liberal arts credits.', 6),
(20, 2, 'GENERAL_ELECTIVE', '일반선택', 'CREDIT', 'TBD', 'credits', 'General elective credits.', 7),

-- major_id 8 (Computer Science and Engineering) replacement rows
(21, 8, 'MAJOR_BASIC', '전공기초', 'CREDIT', 'TBD', 'credits', 'Major foundation credits.', 1),
(22, 8, 'MAJOR_REQUIRED', '전공필수', 'CREDIT', 'TBD', 'credits', 'Major required credits.', 2),
(23, 8, 'MAJOR_ELECTIVE', '전공선택', 'CREDIT', 'TBD', 'credits', 'Major elective credits.', 3),
(24, 8, 'HYOWON_CORE', '효원핵심교양', 'CREDIT', 'TBD', 'credits', 'Hyowon Core liberal arts credits.', 4),
(25, 8, 'HYOWON_BALANCE', '효원균형교양', 'CREDIT', 'TBD', 'credits', 'Hyowon Balanced liberal arts credits.', 5),
(26, 8, 'HYOWON_CREATIVE', '효원창의교양', 'CREDIT', 'TBD', 'credits', 'Hyowon Creative liberal arts credits.', 6),
(27, 8, 'GENERAL_ELECTIVE', '일반선택', 'CREDIT', 'TBD', 'credits', 'General elective credits.', 7),

-- major_id 102 (Electronic Engineering, new)
(28, 102, 'MAJOR_BASIC', '전공기초', 'CREDIT', 'TBD', 'credits', 'Major foundation credits.', 1),
(29, 102, 'MAJOR_REQUIRED', '전공필수', 'CREDIT', 'TBD', 'credits', 'Major required credits.', 2),
(30, 102, 'MAJOR_ELECTIVE', '전공선택', 'CREDIT', 'TBD', 'credits', 'Major elective credits.', 3),
(31, 102, 'HYOWON_CORE', '효원핵심교양', 'CREDIT', 'TBD', 'credits', 'Hyowon Core liberal arts credits.', 4),
(32, 102, 'HYOWON_BALANCE', '효원균형교양', 'CREDIT', 'TBD', 'credits', 'Hyowon Balanced liberal arts credits.', 5),
(33, 102, 'HYOWON_CREATIVE', '효원창의교양', 'CREDIT', 'TBD', 'credits', 'Hyowon Creative liberal arts credits.', 6),
(34, 102, 'GENERAL_ELECTIVE', '일반선택', 'CREDIT', 'TBD', 'credits', 'General elective credits.', 7),
(35, 102, 'TOPIK', 'TOPIK Level 4 or higher', 'PASS_FAIL', '1', NULL, 'Obtain TOPIK Level 4 or higher (TOPIK 4급 이상).', 8),
(36, 102, 'GRAD_PROJECT', 'Graduation Project', 'PASS_FAIL', '1', NULL, 'Complete the graduation project.', 9),

-- major_id 46 (Aerospace Engineering, new rows)
(37, 46, 'MAJOR_BASIC', '전공기초', 'CREDIT', 'TBD', 'credits', 'Major foundation credits.', 1),
(38, 46, 'MAJOR_REQUIRED', '전공필수', 'CREDIT', 'TBD', 'credits', 'Major required credits.', 2),
(39, 46, 'MAJOR_ELECTIVE', '전공선택', 'CREDIT', 'TBD', 'credits', 'Major elective credits.', 3),
(40, 46, 'HYOWON_CORE', '효원핵심교양', 'CREDIT', 'TBD', 'credits', 'Hyowon Core liberal arts credits.', 4),
(41, 46, 'HYOWON_BALANCE', '효원균형교양', 'CREDIT', 'TBD', 'credits', 'Hyowon Balanced liberal arts credits.', 5),
(42, 46, 'HYOWON_CREATIVE', '효원창의교양', 'CREDIT', 'TBD', 'credits', 'Hyowon Creative liberal arts credits.', 6),
(43, 46, 'GENERAL_ELECTIVE', '일반선택', 'CREDIT', 'TBD', 'credits', 'General elective credits.', 7),
(44, 46, 'TOPIK', 'TOPIK Level 4 or higher', 'PASS_FAIL', '1', NULL, 'Obtain TOPIK Level 4 or higher (TOPIK 4급 이상).', 8),
(45, 46, 'CAPSTONE_PROJECT', 'Capstone Design Project', 'PASS_FAIL', '1', NULL, 'Complete the Capstone Design Project.', 9),

-- major_id 49 (Environmental Engineering, new rows)
(46, 49, 'MAJOR_BASIC', '전공기초', 'CREDIT', 'TBD', 'credits', 'Major foundation credits.', 1),
(47, 49, 'MAJOR_REQUIRED', '전공필수', 'CREDIT', 'TBD', 'credits', 'Major required credits.', 2),
(48, 49, 'MAJOR_ELECTIVE', '전공선택', 'CREDIT', 'TBD', 'credits', 'Major elective credits.', 3),
(49, 49, 'HYOWON_CORE', '효원핵심교양', 'CREDIT', 'TBD', 'credits', 'Hyowon Core liberal arts credits.', 4),
(50, 49, 'HYOWON_BALANCE', '효원균형교양', 'CREDIT', 'TBD', 'credits', 'Hyowon Balanced liberal arts credits.', 5),
(51, 49, 'HYOWON_CREATIVE', '효원창의교양', 'CREDIT', 'TBD', 'credits', 'Hyowon Creative liberal arts credits.', 6),
(52, 49, 'GENERAL_ELECTIVE', '일반선택', 'CREDIT', 'TBD', 'credits', 'General elective credits.', 7),
(53, 49, 'TOPIK', 'TOPIK Level 4 or higher', 'PASS_FAIL', '1', NULL, 'Obtain TOPIK Level 4 or higher (TOPIK 4급 이상).', 8),
(54, 49, 'ENV_CREATIVE_PROJECT', '환경창의프로젝트', 'PASS_FAIL', '1', NULL, 'Complete the Environmental Creative Project (환경창의프로젝트).', 9),

-- major_id 103 (Architecture, new)
(55, 103, 'MAJOR_BASIC', '전공기초', 'CREDIT', 'TBD', 'credits', 'Major foundation credits.', 1),
(56, 103, 'MAJOR_REQUIRED', '전공필수', 'CREDIT', 'TBD', 'credits', 'Major required credits.', 2),
(57, 103, 'MAJOR_ELECTIVE', '전공선택', 'CREDIT', 'TBD', 'credits', 'Major elective credits.', 3),
(58, 103, 'GENERAL_REQUIRED', '교양필수', 'CREDIT', 'TBD', 'credits', 'General education required credits.', 4),
(59, 103, 'LIBERAL_ELECTIVE', '교양선택', 'CREDIT', 'TBD', 'credits', 'General education elective credits.', 5),
(60, 103, 'GENERAL_ELECTIVE', '일반선택', 'CREDIT', 'TBD', 'credits', 'General elective credits.', 6),
(61, 103, 'TOPIK', 'TOPIK Level 4 or higher', 'PASS_FAIL', '1', NULL, 'Obtain TOPIK Level 4 or higher (TOPIK 4급 이상).', 7),
(62, 103, 'GRAD_WORK', '졸업작품', 'PASS_FAIL', '1', NULL, 'Complete the graduation work (졸업작품).', 8);
```
