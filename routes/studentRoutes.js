const express = require('express');
const {
  testConnection,
  loginStudent,
  getStudentChecklist,
  updateChecklistItem,
  getAllScholarships,
  applyForScholarship,
  signupStudent,
  getStudentProfile,
  updateStudentProfile,
  forgotPassword,
  resetPassword,
  getAllBoards,
  getBoardPosts,
  createPost,
} = require('../controllers/studentController');

const router = express.Router();

router.get('/test', testConnection);
router.post('/login', loginStudent);
router.post('/signup', signupStudent);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/checklist/:student_id', getStudentChecklist);
router.put('/checklist/:checklist_id', updateChecklistItem);
router.get('/scholarships', getAllScholarships);
router.post('/scholarships/apply', applyForScholarship);
router.get('/boards', getAllBoards);
router.get('/boards/:board_id/posts', getBoardPosts);
router.post('/posts', createPost);
router.get('/:student_id', getStudentProfile);
router.patch('/:student_id', updateStudentProfile);

module.exports = router;



