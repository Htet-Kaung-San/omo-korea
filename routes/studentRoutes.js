const express = require('express');
const {
  testConnection,
  loginStudent,
  getStudentChecklist,
  updateChecklistItem,
  getAllScholarships,
  applyForScholarship,
  getBoardPosts,
  createPost,
  getPostComments,
  createComment,
} = require('../controllers/studentController');

const { verifyToken } = require('../middleware/authMiddleware');

const {
  createPostSchema,
  createCommentSchema,
  validateBody,
} = require('../validators/studentValidator');

const router = express.Router();

// Public routes
router.get('/test', testConnection);
router.post('/login', loginStudent);
router.get('/scholarships', getAllScholarships);
router.get('/boards/:board_id/posts', getBoardPosts);
router.get('/posts/:post_id/comments', getPostComments);

// Protected routes
router.get('/checklist/:student_id', verifyToken, getStudentChecklist);
router.put('/checklist/:checklist_id', verifyToken, updateChecklistItem);
router.post('/scholarships/apply', verifyToken, applyForScholarship);

router.post('/posts', verifyToken, validateBody(createPostSchema), createPost);
router.post(
  '/posts/:post_id/comments',
  verifyToken,
  validateBody(createCommentSchema),
  createComment
);

module.exports = router;