const { analyzeMajorGap } = require('./gapAnalysisEngine');

const targetMajor = {
  name: 'Artificial Intelligence',
  academicAreas: ['Programming', 'Mathematics', 'Machine Learning'],
  activities: ['Hackathons', 'Research'],
  strengths: ['Problem Solving', 'Analytical Thinking'],
  careerAreas: ['Technology'],
  learningStyles: ['Project Based Learning', 'Self Directed Learning'],
  minTopikLevel: 4,
};

const studentProfile = {
  academicAreas: ['Programming', 'Data Science'],
  activities: ['Hackathons'],
  strengths: ['Problem Solving', 'Teamwork'],
  careerAreas: ['Technology'],
  learningStyles: ['Project Based Learning'],
  topikLevel: 4,
};

const analysis = analyzeMajorGap(studentProfile, targetMajor);

console.log(JSON.stringify(analysis, null, 2));
