/**
 * Computer Science & Engineering graduation milestones.
 * Persisted in `graduation_requirement`, not `checklist_item`.
 */

const CS_GRADUATION_TASKS = [
  {
    task_name: "TOPIK Level 4 or higher",
    description: "Obtain TOPIK Level 4 or higher (TOPIK 4급 이상).",
  },
  {
    task_name: "TOPCIT 22 or 2 major electives",
    description:
      "Score TOPCIT 22 or higher, or complete 2 major elective courses (전공선택 2개 과목 이수).",
  },
  {
    task_name: "PCCP 300 or Computer Algorithm Practice",
    description:
      "Score PCCP 300 or higher, or take Computer Algorithm Practice (컴퓨터알고리즘실무, Summer Leap Class) for credit.",
  },
  {
    task_name: "Graduation Project",
    description: "Complete the graduation project (졸업과제).",
  },
];

function isComputerScienceMajor(majorName) {
  const name = String(majorName || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  if (!name) return false;
  return (
    name.includes("computer science") ||
    name === "computer engineering" ||
    name.includes("컴퓨터공학")
  );
}

module.exports = {
  CS_GRADUATION_TASKS,
  isComputerScienceMajor,
};
