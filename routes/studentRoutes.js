const express = require("express");
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
const authenticateToken = require("../middlewares/auth");

const router = express.Router();

router.get("/test", testConnection);
router.post("/login", loginStudent);
router.post("/signup", signupStudent);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/checklist/:student_id", getStudentChecklist);
router.put("/checklist/:checklist_id", authenticateToken, updateChecklistItem);
router.get("/scholarships", getAllScholarships);
router.post("/scholarships/apply", authenticateToken, applyForScholarship);
router.get("/boards", getAllBoards);
router.get("/boards/:board_id/posts", getBoardPosts);
router.post("/posts", authenticateToken, createPost);
router.post("/posts/:post_id/like", authenticateToken, likePost);
router.post("/posts/:post_id/report", authenticateToken, reportPost);
router.get("/facilities", getFacilities);
router.get("/notices", getNotices);
router.get("/notifications/:student_id", getNotifications);
router.get("/courses", getCourses);
router.get("/enrollments/:student_id", getEnrollments);
router.post("/enrollments", authenticateToken, createEnrollment);
router.delete(
  "/enrollments/:enrollment_id",
  authenticateToken,
  deleteEnrollment,
);
router.get("/posts/:post_id/comments", getPostComments);
router.post("/comments", authenticateToken, createComment);
router.patch(
  "/:student_id/language",
  authenticateToken,
  updateLanguagePreference,
);
router.get("/", authenticateToken, getAllStudents);
router.get("/search", globalSearch);
router.get("/health-check", healthCheck);
router.get("/:student_id", getStudentProfile);
router.patch("/:student_id", authenticateToken, updateStudentProfile);
router.patch("/:student_id/request-delete", authenticateToken, requestStudentDeletion);
router.delete("/:student_id", authenticateToken, hardDeleteStudent);

module.exports = router;
