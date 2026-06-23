const express = require('express');
const { recommendMajor } = require('../controllers/aiController');

const router = express.Router();

router.post('/recommend-major', recommendMajor);

module.exports = router;