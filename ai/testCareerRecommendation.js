const { recommendCareers } = require('./careerRecommendationEngine');

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
    id: 'career-backend-developer',
    title: 'Backend Developer',
    description:
      'Designs server-side systems, APIs, databases, and scalable application infrastructure.',
    academicAreas: ['Programming', 'Software Engineering'],
    activities: ['Hackathons', 'Open Source Projects'],
    strengths: ['Problem Solving', 'Reliability'],
    careerAreas: ['Technology', 'Software Development'],
    learningStyles: ['Self Directed Learning', 'Practice Based Learning'],
    interests: ['APIs', 'Cloud Computing'],
    languages: ['English'],
  },
  {
    id: 'career-ux-ui-designer',
    title: 'UX/UI Designer',
    description:
      'Creates user-centered product experiences through research, prototyping, and visual design.',
    academicAreas: ['Design', 'Human Computer Interaction'],
    activities: ['Design Workshops', 'User Research'],
    strengths: ['Creativity', 'Teamwork'],
    careerAreas: ['Design', 'Technology'],
    learningStyles: ['Project Based Learning', 'Collaborative Learning'],
    interests: ['User Experience', 'Visual Design'],
    languages: ['English', 'Korean'],
  },
];

const studentProfile = {
  academicAreas: ['Programming', 'Data Science'],
  activities: ['Hackathons'],
  strengths: ['Problem Solving', 'Teamwork'],
  careerAreas: ['Technology'],
  learningStyles: ['Project Based Learning', 'Self Directed Learning'],
  interests: ['AI', 'Data Science'],
  languages: ['English', 'Korean'],
};

const recommendations = recommendCareers(studentProfile, careers);

console.log(JSON.stringify(recommendations, null, 2));
