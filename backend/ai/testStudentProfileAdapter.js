const { adaptStudentProfile } = require('./studentProfileAdapter');

const rawInput = {
  questionnaire: {
    academicAreas: [' AA13 ', 'aa13', '', 'AA13'],
    activities: ['ACT01', ' act01 ', 'ACT01', ''],
    strengths: ['ST01', ' st01 ', '', 'ST01'],
    careerAreas: ['CA02', ' ca02 ', '', 'CA02'],
    learningStyles: ['LS03', ' ls03 ', '', 'LS03'],
    topikLevel: '4',
    topN: '5',
  },
  profile: {
    major: ' Computer Science & Engineering ',
    interests: ['Programming', ' programming ', 'Data Science', '', 'data science'],
    languages: ['English', ' english ', 'Korean', ''],
    gpa: '3.72',
    nationality: ' Mongolia ',
    year: '2',
    academicAreas: ['Technology', ' technology ', 'Data Science', ''],
    activities: ['Hackathons', ' hackathons ', 'Project Based Learning', ''],
    strengths: ['Problem Solving', ' problem solving ', ''],
    careerAreas: ['Technology', ' technology ', ''],
    learningStyles: [
      'Project Based Learning',
      ' project based learning ',
      '',
    ],
    topikLevel: '3',
  },
  completedCourseIds: [' CSE101 ', 'CSE101', '', ' MAT240 '],
};

const adaptedProfile = adaptStudentProfile(rawInput);

console.log(JSON.stringify(adaptedProfile, null, 2));
