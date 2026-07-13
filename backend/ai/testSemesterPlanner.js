const { buildSemesterPlan } = require('./semesterPlannerEngine');

const studentProfile = {
  major: 'Computer Science & Engineering',
  interests: ['AI', 'Data Science'],
};

const courses = [
  {
    id: 'CS101',
    nameKo: '컴퓨터공학개론',
    nameEn: 'Introduction to Computer Science',
    type: 'REQUIRED',
    credits: 3,
    department: 'Computer Science & Engineering',
    tags: ['Programming', 'Computer Science'],
    prerequisites: [],
  },
  {
    id: 'CS201',
    nameKo: '자료구조',
    nameEn: 'Data Structures',
    type: 'REQUIRED',
    credits: 3,
    department: 'Computer Science & Engineering',
    tags: ['Programming', 'Data Science'],
    prerequisites: ['CS101'],
  },
  {
    id: 'CS301',
    nameKo: '알고리즘',
    nameEn: 'Algorithms',
    type: 'REQUIRED',
    credits: 3,
    department: 'Computer Science & Engineering',
    tags: ['Algorithms', 'Data Science'],
    prerequisites: ['CS201'],
  },
  {
    id: 'CS330',
    nameKo: '인공지능',
    nameEn: 'Artificial Intelligence',
    type: 'ELECTIVE',
    credits: 3,
    department: 'Computer Science & Engineering',
    tags: ['AI', 'Data Science'],
    prerequisites: ['CS201'],
  },
  {
    id: 'CS430',
    nameKo: '기계학습',
    nameEn: 'Machine Learning',
    type: 'ELECTIVE',
    credits: 3,
    department: 'Computer Science & Engineering',
    tags: ['AI', 'Data Science'],
    prerequisites: ['CS330'],
  },
  {
    id: 'DS210',
    nameKo: '데이터사이언스',
    nameEn: 'Data Science',
    type: 'ELECTIVE',
    credits: 3,
    department: 'Computer Science & Engineering',
    tags: ['Data Science', 'Statistics'],
    prerequisites: ['CS201'],
  },
  {
    id: 'GE150',
    nameKo: '디지털 사회와 윤리',
    nameEn: 'Digital Society and Ethics',
    type: 'GEN_ED',
    credits: 3,
    department: 'General Education',
    tags: ['AI', 'Ethics'],
    prerequisites: [],
  },
  {
    id: 'CS250',
    nameKo: '데이터베이스',
    nameEn: 'Database Systems',
    type: 'ELECTIVE',
    credits: 3,
    department: 'Computer Science & Engineering',
    tags: ['Data Science', 'Databases'],
    prerequisites: ['CS101'],
  },
  {
    id: 'CS260',
    nameKo: '소프트웨어공학',
    nameEn: 'Software Engineering',
    type: 'ELECTIVE',
    credits: 3,
    department: 'Computer Science & Engineering',
    tags: ['Programming', 'Teamwork'],
    prerequisites: ['CS101'],
  },
];

const plan = buildSemesterPlan(studentProfile, courses, {
  completedCourseIds: ['CS101'],
  maxCredits: 9,
});

console.log(JSON.stringify(plan, null, 2));
