const { recommendPrograms } = require('./programRecommendationEngine');

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
  {
    id: 'PRG-STARTUP-NET',
    title: 'Startup Club Networking',
    description: 'Meet startup founders and students interested in entrepreneurship.',
    date: '2026-09-03',
    category: 'Networking',
    tags: ['Startup', 'AI'],
    careerTags: ['Technology', 'Entrepreneurship'],
    eligibleMajors: ['Computer Science & Engineering', 'Business Administration'],
    languages: ['English'],
    minYear: 1,
    maxYear: 4,
  },
  {
    id: 'PRG-DESIGN-THINK',
    title: 'Design Thinking Workshop',
    description: 'Practice creative problem solving and prototyping.',
    date: '2026-08-20',
    category: 'Workshop',
    tags: ['Design', 'Creativity'],
    careerTags: ['Design', 'Product'],
    eligibleMajors: ['Design Technology'],
    languages: ['Korean'],
    minYear: 1,
    maxYear: 2,
  },
];

const studentProfile = {
  major: 'Computer Science & Engineering',
  interests: ['AI', 'Data Science'],
  careerAreas: ['Technology'],
  languages: ['English', 'Korean'],
  year: 3,
};

const recommendations = recommendPrograms(studentProfile, programs, {
  excludeProgramIds: [],
  limit: 4,
});

console.log(JSON.stringify(recommendations, null, 2));
