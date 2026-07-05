const departmentProfiles = require('./departmentProfiles');
const { buildStudentDashboard } = require('./studentDashboardEngine');

const rawStudentInput = {
  questionnaire: {
    academicAreas: ['AA13'],
    activities: ['ACT01', 'ACT02', 'ACT03'],
    strengths: ['ST01', 'ST02', 'ST03'],
    careerAreas: ['CA01', 'CA02'],
    learningStyles: ['LS02', 'LS03'],
    topikLevel: 4,
    topN: 2,
  },
  profile: {
    major: 'Computer Science & Engineering',
    interests: ['AI', 'Data Science', 'Machine Learning'],
    languages: ['English', 'Korean'],
    academicAreas: ['Programming', 'Data Science'],
    activities: ['Hackathons', 'AI Projects'],
    strengths: ['Problem Solving', 'Teamwork'],
    careerAreas: ['Technology', 'Artificial Intelligence'],
    learningStyles: ['Project Based Learning'],
    gpa: 3.6,
    nationality: 'Mongolia',
    year: 3,
    topikLevel: 3,
  },
  completedCourseIds: ['CSE231'],
};

const targetMajor = {
  name: 'Artificial Intelligence',
  academicAreas: ['Programming', 'Mathematics', 'Machine Learning'],
  activities: ['Hackathons', 'Research'],
  strengths: ['Problem Solving', 'Analytical Thinking'],
  careerAreas: ['Technology', 'Artificial Intelligence'],
  learningStyles: ['Project Based Learning', 'Self Directed Learning'],
  minTopikLevel: 4,
};

const courses = [
  {
    id: 'CSE231',
    nameKo: 'Data Structures',
    nameEn: 'Data Structures',
    type: 'REQUIRED',
    credits: 3,
    department: 'Computer Science & Engineering',
    tags: ['Data Science', 'Algorithms'],
  },
  {
    id: 'CSE342',
    nameKo: 'Artificial Intelligence',
    nameEn: 'Artificial Intelligence',
    type: 'ELECTIVE',
    credits: 3,
    department: 'Computer Science & Engineering',
    tags: ['AI', 'Machine Learning'],
  },
  {
    id: 'MAT240',
    nameKo: 'Probability and Statistics',
    nameEn: 'Probability and Statistics',
    type: 'GEN_ED',
    credits: 3,
    department: 'Mathematics',
    tags: ['Data Science', 'Statistics'],
  },
  {
    id: 'GED120',
    nameKo: 'Digital Society and Ethics',
    nameEn: 'Digital Society and Ethics',
    type: 'GEN_ED',
    credits: 2,
    department: 'General Education',
    tags: ['AI', 'Ethics'],
  },
];

const programs = [
  {
    id: 'PRG-AI-HACK',
    title: 'AI Agent Hackathon',
    description: 'Build useful AI agents with a student team.',
    date: '2026-08-10',
    category: 'Hackathon',
    tags: ['AI', 'Data Science', 'Programming'],
    careerTags: ['Technology', 'Research'],
    eligibleMajors: ['Computer Science & Engineering'],
    languages: ['English', 'Korean'],
    minYear: 2,
    maxYear: 4,
  },
  {
    id: 'PRG-RESEARCH-LAB',
    title: 'Undergraduate AI Research Lab',
    description: 'Join a supervised AI research project for one semester.',
    date: '2026-09-01',
    category: 'Research',
    tags: ['AI', 'Machine Learning', 'Research'],
    careerTags: ['Artificial Intelligence', 'Technology'],
    eligibleMajors: ['Computer Science & Engineering'],
    languages: ['English'],
    minYear: 3,
    maxYear: 4,
  },
  {
    id: 'PRG-CAREER-CAMP',
    title: 'International Student Career Camp',
    description: 'Career planning and interview practice for international students.',
    date: '2026-07-25',
    category: 'Career',
    tags: ['Career', 'Networking'],
    careerTags: ['Technology', 'Business'],
    eligibleMajors: [],
    languages: ['English', 'Korean'],
    minYear: 1,
    maxYear: 4,
  },
];

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
    minTopikLevel: 4,
    minYear: 1,
    maxYear: 4,
    tags: ['Korean Language', 'Academic Excellence'],
  },
];

const careers = [
  {
    id: 'career-ai-engineer',
    title: 'AI Engineer',
    description:
      'Builds intelligent systems, machine learning models, and AI-powered software products.',
    academicAreas: ['Programming', 'Data Science', 'Machine Learning'],
    activities: ['Hackathons', 'AI Projects'],
    strengths: ['Problem Solving', 'Teamwork', 'Systems Thinking'],
    careerAreas: ['Technology', 'Artificial Intelligence'],
    learningStyles: ['Project Based Learning', 'Self Directed Learning'],
    interests: ['AI', 'Data Science'],
    languages: ['English', 'Korean'],
  },
  {
    id: 'career-data-scientist',
    title: 'Data Scientist',
    description:
      'Analyzes data, builds predictive models, and communicates insights for decision making.',
    academicAreas: ['Data Science', 'Statistics', 'Programming'],
    activities: ['Data Analysis Projects', 'Hackathons'],
    strengths: ['Problem Solving', 'Communication'],
    careerAreas: ['Technology', 'Analytics'],
    learningStyles: ['Project Based Learning', 'Research Based Learning'],
    interests: ['Data Science', 'AI'],
    languages: ['English'],
  },
  {
    id: 'career-machine-learning-researcher',
    title: 'Machine Learning Researcher',
    description: 'Studies new model methods and evaluates them through experiments.',
    academicAreas: ['Machine Learning', 'Mathematics', 'Programming'],
    activities: ['Research', 'AI Projects'],
    strengths: ['Analytical Thinking', 'Problem Solving'],
    careerAreas: ['Artificial Intelligence', 'Research'],
    learningStyles: ['Research Based Learning', 'Self Directed Learning'],
    interests: ['Machine Learning', 'AI'],
    languages: ['English'],
  },
];

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

const dashboard = buildStudentDashboard({
  rawStudentInput,
  targetMajor,
  majors: departmentProfiles,
  courses,
  programs,
  scholarships,
  careers,
  notices,
  options: {
    asOfDate: '2026-08-01',
  },
});

if (dashboard.topMajors.length !== 2) {
  throw new Error('Expected exactly 2 major recommendations.');
}

if (dashboard.recommendedCourses.some((course) => course.id === 'CSE231')) {
  throw new Error('Completed course CSE231 must not be recommended.');
}

if (!dashboard.targetMajorGap) {
  throw new Error('Expected a target major gap analysis result.');
}
if (
  dashboard.recommendedNotices.some(
    (notice) => notice.id === 'NTC-BUSINESS-FAIR'
  )
) {
  throw new Error('Business-only notice must not be recommended.');
}

if (dashboard.recommendedNotices[0]?.id !== 'NTC-REGISTRATION') {
  throw new Error('Course registration notice should be the top notice.');
}
console.log(JSON.stringify(dashboard, null, 2));

