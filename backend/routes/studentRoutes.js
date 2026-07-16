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
  getCareerOpportunities,
  getEmergencyGuideHandler,
  getCampusFacilitiesHandler,
} = require("../controllers/studentController");

const { authenticateToken, requireAdmin } = require("../middlewares/auth");

const {
  createPostSchema,
  createCommentSchema,
  updateProfileSchema,
  validateBody,
} = require("../validators/studentValidator");

const {
  getDashboardSummary,
  runMajorGapAnalysis,
  getCourseRecommendations,
  getAiDashboard,
  getPrograms,
  getStudentNotifications,
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
router.get("/scholarships", getAllScholarships);
router.get("/career-opportunities", getCareerOpportunities);
router.get("/emergency-guide", getEmergencyGuideHandler);
router.get("/campus-facilities", getCampusFacilitiesHandler);
router.get("/courses", getCourses);

// Protected / named routes (before /:student_id)
router.get("/", authenticateToken, requireAdmin, getAllStudents);
router.get("/checklist/:student_id", authenticateToken, getStudentChecklist);
router.put("/checklist/:checklist_id", authenticateToken, updateChecklistItem);
router.get("/notifications/:student_id", authenticateToken, getNotifications);
router.get("/notifications", authenticateToken, getStudentNotifications);
router.get("/ai-dashboard", authenticateToken, getAiDashboard);
router.get("/programs", authenticateToken, getPrograms);
router.put(
  "/profile",
  authenticateToken,
  validateBody(updateProfileSchema),
  updateStudentProfile,
);
router.get("/enrollments/:student_id", getEnrollments);
router.post("/enrollments", authenticateToken, createEnrollment);
router.delete("/enrollments/:enrollment_id", authenticateToken, deleteEnrollment);
router.post("/scholarships/apply", authenticateToken, applyForScholarship);
router.get("/dashboard-summary", authenticateToken, getDashboardSummary);
router.post("/major-gap-analysis", authenticateToken, runMajorGapAnalysis);
router.get("/course-recommendations", authenticateToken, getCourseRecommendations);

router.post("/posts", authenticateToken, validateBody(createPostSchema), createPost);
router.post("/posts/:post_id/like", authenticateToken, likePost);
router.post("/posts/:post_id/report", authenticateToken, reportPost);
router.post("/comments", authenticateToken, validateBody(createCommentSchema), createComment);
router.post("/posts/:post_id/comments", authenticateToken, validateBody(createCommentSchema), createComment);

// Parametric student routes last
router.get("/:student_id", getStudentProfile);
router.patch("/:student_id", authenticateToken, updateStudentProfile);
router.patch("/:student_id/request-delete", authenticateToken, requestStudentDeletion);
router.patch("/:student_id/language", authenticateToken, updateLanguagePreference);
router.delete("/:student_id", authenticateToken, requireAdmin, hardDeleteStudent);

module.exports = router;
