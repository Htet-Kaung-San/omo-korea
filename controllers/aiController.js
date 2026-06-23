const departmentProfiles = require('../ai/departmentProfiles');
const { recommendMajors } = require('../ai/recommendationEngine');

function recommendMajor(req, res) {
  try {
    const {
      academicAreas = [],
      activities = [],
      strengths = [],
      careerAreas = [],
      learningStyles = [],
      topikLevel,
    } = req.body;

    const recommendations = recommendMajors(
      {
        academicAreas,
        activities,
        strengths,
        careerAreas,
        learningStyles,
        topikLevel,
      },
      departmentProfiles
    );

    res.status(200).json({
      success: true,
      recommendations,
    });
  } catch (error) {
    console.error('Major recommendation error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to generate major recommendations.',
    });
  }
}

module.exports = {
  recommendMajor,
};