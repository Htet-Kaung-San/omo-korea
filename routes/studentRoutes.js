const express = require('express');
const {
  testConnection,
  loginStudent,
  getStudentChecklist,
  updateChecklistItem,
  getAllScholarships,
  applyForScholarship,
} = require('../controllers/studentController');

const router = express.Router();

router.get('/test', testConnection);
router.post('/login', loginStudent);
router.get('/checklist/:student_id', getStudentChecklist);
router.put('/checklist/:checklist_id', updateChecklistItem);
router.get('/scholarships', getAllScholarships);
router.post('/scholarships/apply', applyForScholarship);

module.exports = router;
