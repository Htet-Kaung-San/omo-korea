const {
  searchUniversityInformation,
} = require('../services/intelligentSearchService');

async function searchUniversityInformationController(req, res, next) {
  try {
    const { query, limitPerSource } = req.body || {};

    if (typeof query !== 'string' || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Query must contain at least 2 characters.',
      });
    }

    const result = await searchUniversityInformation(query, { limitPerSource });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  searchUniversityInformationController,
};
