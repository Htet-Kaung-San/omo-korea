const { recommendScholarships } = require('./scholarshipRecommendationEngine');

const scholarships = [
  {
    id: 'SCH-AI-TALENT',
    title: 'PNU AI Talent Scholarship',
    description: 'Support for students building strong AI and data skills.',
    amount: 'KRW 1,500,000',
    deadline: '2026-08-15',
    provider: 'PNU College of Information and Biomedical Engineering',
    eligibleMajors: ['Computer Science & Engineering'],
    eligibleNationalities: [],
    minGpa: 3.2,
    minTopikLevel: 3,
    minYear: 2,
    maxYear: 4,
    tags: ['AI', 'Data Science', 'Research'],
  },
  {
    id: 'SCH-INTL-SUPPORT',
    title: 'International Student Support Scholarship',
    description: 'General support for eligible international students.',
    amount: 'KRW 800,000',
    deadline: '2026-07-30',
    provider: 'PNU Office of International Services',
    eligibleMajors: [],
    eligibleNationalities: ['Mongolia', 'Vietnam', 'Indonesia'],
    minGpa: 3.0,
    minTopikLevel: 2,
    minYear: 1,
    maxYear: 4,
    tags: ['International', 'Student Support'],
  },
  {
    id: 'SCH-KOREAN-EXCELLENCE',
    title: 'Korean Language Excellence Scholarship',
    description: 'Award for students with advanced Korean language ability.',
    amount: 'KRW 1,000,000',
    deadline: '2026-09-01',
    provider: 'PNU Language Education Institute',
    eligibleMajors: [],
    eligibleNationalities: [],
    minGpa: 3.0,
    minTopikLevel: 5,
    minYear: 1,
    maxYear: 4,
    tags: ['Korean Language', 'Academic Excellence'],
  },
  {
    id: 'SCH-BUSINESS-LEADERSHIP',
    title: 'Business Leadership Scholarship',
    description: 'Scholarship for business students with leadership potential.',
    amount: 'KRW 1,200,000',
    deadline: '2026-08-05',
    provider: 'PNU Business School',
    eligibleMajors: ['Business Administration'],
    eligibleNationalities: ['Mongolia'],
    minGpa: 3.3,
    minTopikLevel: 3,
    minYear: 2,
    maxYear: 4,
    tags: ['Leadership', 'Business'],
  },
];

const studentProfile = {
  major: 'Computer Science & Engineering',
  gpa: 3.5,
  topikLevel: 4,
  nationality: 'Mongolia',
  year: 3,
  interests: ['AI', 'Data Science'],
};

const recommendations = recommendScholarships(studentProfile, scholarships, {
  excludeScholarshipIds: [],
  limit: 4,
});

console.log(JSON.stringify(recommendations, null, 2));
