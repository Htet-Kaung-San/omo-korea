const { recommendCourses } = require('./courseRecommendationEngine');

const courses = [
  {
    id: 'CSE101',
    nameKo: '컴퓨터공학개론',
    nameEn: 'Introduction to Computer Science',
    type: 'REQUIRED',
    credits: 3,
    department: 'Computer Science & Engineering',
    tags: ['Programming', 'Algorithms'],
  },
  {
    id: 'CSE231',
    nameKo: '자료구조',
    nameEn: 'Data Structures',
    type: 'REQUIRED',
    credits: 3,
    department: 'Computer Science & Engineering',
    tags: ['Data Science', 'Algorithms'],
  },
  {
    id: 'CSE342',
    nameKo: '인공지능',
    nameEn: 'Artificial Intelligence',
    type: 'ELECTIVE',
    credits: 3,
    department: 'Computer Science & Engineering',
    tags: ['AI', 'Machine Learning'],
  },
  {
    id: 'CSE355',
    nameKo: '데이터사이언스',
    nameEn: 'Data Science',
    type: 'ELECTIVE',
    credits: 3,
    department: 'Computer Science & Engineering',
    tags: ['Data Science', 'Statistics'],
  },
  {
    id: 'BUS210',
    nameKo: '비즈니스 애널리틱스',
    nameEn: 'Business Analytics',
    type: 'ELECTIVE',
    credits: 3,
    department: 'Business Administration',
    tags: ['Data Science', 'Analytics'],
  },
  {
    id: 'GED120',
    nameKo: '디지털 사회와 윤리',
    nameEn: 'Digital Society and Ethics',
    type: 'GEN_ED',
    credits: 2,
    department: 'General Education',
    tags: ['AI', 'Ethics'],
  },
  {
    id: 'MAT240',
    nameKo: '확률과 통계',
    nameEn: 'Probability and Statistics',
    type: 'GEN_ED',
    credits: 3,
    department: 'Mathematics',
    tags: ['Data Science', 'Statistics'],
  },
];

const studentProfile = {
  major: 'Computer Science & Engineering',
  interests: ['AI', 'Data Science'],
};

const recommendations = recommendCourses(studentProfile, courses, {
  completedCourseIds: ['CSE101'],
  type: 'ALL',
  limit: 5,
});

console.log(JSON.stringify(recommendations, null, 2));
