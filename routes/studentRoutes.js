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
  getFacilities,
  getNotices,
  getNotifications,
  getCourses,
  getEnrollments,
  createEnrollment,
  deleteEnrollment,
  getPostComments,
  createComment,
  updateLanguagePreference,
  globalSearch,
  healthCheck,
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
router.get('/facilities', getFacilities);
router.get('/notices', getNotices);
router.get('/notifications/:student_id', getNotifications);
router.get('/courses', getCourses);
router.get('/enrollments/:student_id', getEnrollments);
router.post('/enrollments', createEnrollment);
router.delete('/enrollments/:enrollment_id', deleteEnrollment);
router.get('/posts/:post_id/comments', getPostComments);
router.post('/comments', createComment);
router.patch('/:student_id/language', updateLanguagePreference);
router.get('/search', globalSearch);
router.get('/health-check', healthCheck);
router.get('/:student_id', getStudentProfile);
router.patch('/:student_id', updateStudentProfile);

module.exports = router;



