const express = require("express");
const {
  recommendMajor,
  handleChat,
  handleChatStream,
  getChatHistory,
  clearChatHistory,
  translateAnnouncement,
  getAllDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  syncDocumentVector,
} = require("../controllers/aiController");
const { authenticateToken, requireAdmin } = require("../middlewares/auth");

const router = express.Router();

router.post("/recommend-major", recommendMajor);
router.post("/chat", handleChat);
router.post("/chat-stream", authenticateToken, handleChatStream);
router.get("/chat/history/:student_id", getChatHistory);
router.delete("/chat/history/:student_id", clearChatHistory);
router.post("/translate-announcement", translateAnnouncement);

// RAG Knowledge Base Document Management Endpoints (admin-only for mutations)
router.get("/documents", getAllDocuments);
router.get("/documents/:id", getDocument);
router.post("/documents", authenticateToken, requireAdmin, createDocument);
router.patch("/documents/:id", authenticateToken, requireAdmin, updateDocument);
router.delete("/documents/:id", authenticateToken, requireAdmin, deleteDocument);
router.post("/documents/:id/sync", authenticateToken, requireAdmin, syncDocumentVector);

module.exports = router;
