-- Align CSE (major_id = 8) non-credit milestones with department checklist wording.
-- Run after graduation_requirement / student_graduation_requirement DDL.

UPDATE graduation_requirement
SET
  requirement_name = 'TOPCIT 22 or 2 major electives',
  description = 'Score TOPCIT 22 or higher, or complete 2 major elective courses (전공선택 2개 과목 이수).',
  target_value = 22,
  unit = 'points'
WHERE major_id = 8
  AND requirement_code = 'TOPCIT';

UPDATE graduation_requirement
SET
  requirement_code = 'PCCP',
  requirement_name = 'PCCP 300 or Computer Algorithm Practice',
  description = 'Score PCCP 300 or higher, or take Computer Algorithm Practice (컴퓨터알고리즘실무, Summer Leap Class) for credit.',
  requirement_type = 'SCORE',
  target_value = 300,
  unit = 'points'
WHERE major_id = 8
  AND requirement_code IN ('CODING_TEST', 'PCCP');

-- Prefer SCORE for PCCP even if already renamed.
UPDATE graduation_requirement
SET requirement_type = 'SCORE', target_value = 300, unit = 'points'
WHERE major_id = 8 AND requirement_code = 'PCCP';

INSERT INTO graduation_requirement (
  major_id, requirement_code, requirement_name, requirement_type,
  target_value, unit, description, display_order
)
SELECT
  8, 'TOPIK', 'TOPIK Level 4 or higher', 'PASS_FAIL',
  1, NULL, 'Obtain TOPIK Level 4 or higher (TOPIK 4급 이상).', 7
WHERE NOT EXISTS (
  SELECT 1 FROM graduation_requirement
  WHERE major_id = 8 AND requirement_code = 'TOPIK'
);

-- Remove department milestones that were incorrectly stored on checklist_item.
DELETE FROM checklist_item
WHERE task_name IN (
  'TOPIK Level 4 or higher',
  'TOPCIT 22 or 2 major electives',
  'PCCP 300 or Computer Algorithm Practice',
  'Graduation Project'
);
