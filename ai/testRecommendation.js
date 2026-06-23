const departmentProfiles = require('./departmentProfiles');
const { recommendMajors } = require('./recommendationEngine');

const testUser = {
  academicAreas: ['AA13'],
  activities: ['ACT01', 'ACT02', 'ACT03', 'ACT05'],
  strengths: ['ST01', 'ST02', 'ST03', 'ST04', 'ST15'],
  careerAreas: ['CA02', 'CA04'],
  learningStyles: ['LS02', 'LS03', 'LS04'],
  topikLevel: 5,
};

const recommendations = recommendMajors(
  testUser,
  departmentProfiles
);

console.log(JSON.stringify(recommendations, null, 2));