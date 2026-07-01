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
const authenticateToken = require("../middlewares/auth");

const router = express.Router();

router.post("/recommend-major", recommendMajor);
router.post("/chat", handleChat);
router.post("/chat-stream", authenticateToken, handleChatStream);
router.get("/chat/history/:student_id", getChatHistory);
router.delete("/chat/history/:student_id", clearChatHistory);
router.post("/translate-announcement", translateAnnouncement);

// RAG Knowledge Base Document Management Endpoints
router.get("/documents", getAllDocuments);
router.get("/documents/:id", getDocument);
router.post("/documents", authenticateToken, createDocument);
router.patch("/documents/:id", authenticateToken, updateDocument);
router.delete("/documents/:id", authenticateToken, deleteDocument);
router.post("/documents/:id/sync", authenticateToken, syncDocumentVector);

module.exports = router;
