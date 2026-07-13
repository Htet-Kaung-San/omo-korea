const { recommendNotices } = require('./noticeRecommendationEngine');

const studentProfile = {
  major: 'Computer Science & Engineering',
  nationality: 'Mongolia',
  year: 3,
  interests: ['AI', 'Data Science', 'Machine Learning'],
  languages: ['English', 'Korean'],
};

const notices = [
  {
    id: 'NTC-REGISTRATION',
    title: 'Fall 2026 Course Registration',
    body: 'Prepare your course plan before registration opens.',
    category: 'REGISTRATION',
    priority: 'HIGH',
    deadline: '2026-08-10',
    targetMajors: ['Computer Science & Engineering'],
    targetNationalities: [],
    minYear: 1,
    maxYear: 4,
    tags: ['Data Science', 'Course Planning'],
    languages: ['English', 'Korean'],
  },
  {
    id: 'NTC-INTL-SCHOLARSHIP',
    title: 'International Student Scholarship Briefing',
    body: 'Information session for international scholarship applicants.',
    category: 'SCHOLARSHIP',
    priority: 'HIGH',
    deadline: '2026-08-05',
    targetMajors: [],
    targetNationalities: ['Mongolia', 'Vietnam', 'Indonesia'],
    minYear: 1,
    maxYear: 4,
    tags: ['Scholarship'],
    languages: ['English', 'Korean'],
  },
  {
    id: 'NTC-AI-SEMINAR',
    title: 'AI Research Seminar',
    body: 'Research seminar for students interested in artificial intelligence.',
    category: 'SEMINAR',
    priority: 'NORMAL',
    deadline: '2026-08-20',
    targetMajors: ['Computer Science & Engineering'],
    targetNationalities: [],
    minYear: 2,
    maxYear: 4,
    tags: ['AI', 'Machine Learning'],
    languages: ['English'],
  },
  {
    id: 'NTC-BUSINESS-FAIR',
    title: 'Business Career Fair',
    body: 'Career fair for Business Administration students.',
    category: 'CAREER',
    priority: 'HIGH',
    deadline: '2026-08-12',
    targetMajors: ['Business Administration'],
    targetNationalities: [],
    minYear: 1,
    maxYear: 4,
    tags: ['Business'],
    languages: ['Korean'],
  },
];

const recommendations = recommendNotices(studentProfile, notices, {
  asOfDate: '2026-08-01',
  limit: 3,
});

if (recommendations.some((notice) => notice.id === 'NTC-BUSINESS-FAIR')) {
  throw new Error('Business-only notice must not be recommended.');
}

if (recommendations[0]?.id !== 'NTC-REGISTRATION') {
  throw new Error('Course registration notice should be the top result.');
}

console.log(JSON.stringify(recommendations, null, 2));