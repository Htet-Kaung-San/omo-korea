const express = require("express");
const {
  testConnection,
  loginStudent,
  signupStudent,
  forgotPassword,
  resetPassword,
  getStudentChecklist,
  updateChecklistItem,
  getAllScholarships,
  applyForScholarship,
  getStudentProfile,
  updateStudentProfile,
  getAllBoards,
  getBoardPosts,
  createPost,
  likePost,
  reportPost,
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
  requestStudentDeletion,
  hardDeleteStudent,
  getAllStudents,
} = require("../controllers/studentController");

const { authenticateToken, requireAdmin } = require("../middlewares/auth");

const {
  createPostSchema,
  createCommentSchema,
  validateBody,
} = require("../validators/studentValidator");

const {
  getDashboardSummary,
  runMajorGapAnalysis,
  getCourseRecommendations,
} = require("../controllers/aiController");

const router = express.Router();

// Public routes
router.get("/test", testConnection);
router.post("/login", loginStudent);
router.post("/signup", signupStudent);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/boards", getAllBoards);
router.get("/boards/:board_id/posts", getBoardPosts);
router.get("/posts/:post_id/comments", getPostComments);
router.get("/facilities", getFacilities);
router.get("/notices", getNotices);
router.get("/search", globalSearch);
router.get("/health-check", healthCheck);

// Protected routes
router.get("/checklist/:student_id", authenticateToken, getStudentChecklist);
router.put("/checklist/:checklist_id", authenticateToken, updateChecklistItem);
router.get("/notifications/:student_id", authenticateToken, getNotifications);
router.get("/courses", getCourses);
router.get("/enrollments/:student_id", getEnrollments);
router.post("/enrollments", authenticateToken, createEnrollment);
router.delete("/enrollments/:enrollment_id", authenticateToken, deleteEnrollment);
router.get("/:student_id", getStudentProfile);
router.patch("/:student_id", authenticateToken, updateStudentProfile);
router.patch("/:student_id/request-delete", authenticateToken, requestStudentDeletion);
router.patch("/:student_id/language", authenticateToken, updateLanguagePreference);

router.post("/posts", authenticateToken, validateBody(createPostSchema), createPost);
router.post("/posts/:post_id/like", authenticateToken, likePost);
router.post("/posts/:post_id/report", authenticateToken, reportPost);
router.post("/comments", authenticateToken, validateBody(createCommentSchema), createComment);
router.post("/scholarships/apply", authenticateToken, applyForScholarship);
router.get("/scholarships", getAllScholarships);

// Admin-only routes
router.get("/", authenticateToken, requireAdmin, getAllStudents);
router.delete("/:student_id", authenticateToken, requireAdmin, hardDeleteStudent);

// AI recommendation routes (protected)
router.get("/dashboard-summary", authenticateToken, getDashboardSummary);
router.post("/major-gap-analysis", authenticateToken, runMajorGapAnalysis);
router.get("/course-recommendations", authenticateToken, getCourseRecommendations);

module.exports = router;