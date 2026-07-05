const express = require('express');
const {
  searchUniversityInformationController,
} = require('../controllers/searchController');

const router = express.Router();

router.post('/', searchUniversityInformationController);

module.exports = router;
