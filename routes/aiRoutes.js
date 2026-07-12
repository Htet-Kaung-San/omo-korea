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
  extractText,
} = require("../controllers/aiController");
const { authenticateToken, requireAdmin } = require("../middlewares/auth");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });
const memoryController = require("../controllers/memoryController");

const router = express.Router();

router.get("/memory", authenticateToken, memoryController.getMemory);
router.put("/memory", authenticateToken, memoryController.updateMemory);

router.post("/recommend-major", recommendMajor);
router.post("/chat", handleChat);
router.post("/chat-stream", authenticateToken, handleChatStream);
router.get("/chat/history/:student_id", getChatHistory);
router.delete("/chat/history/:student_id", clearChatHistory);
router.post("/translate-announcement", translateAnnouncement);
router.post("/extract-text", authenticateToken, upload.single("file"), extractText);

// RAG Knowledge Base Document Management Endpoints (admin-only for mutations)
router.get("/documents", getAllDocuments);
router.get("/documents/:id", getDocument);
router.post("/documents", authenticateToken, requireAdmin, createDocument);
router.patch("/documents/:id", authenticateToken, requireAdmin, updateDocument);
router.delete("/documents/:id", authenticateToken, requireAdmin, deleteDocument);
router.post("/documents/:id/sync", authenticateToken, requireAdmin, syncDocumentVector);

module.exports = router;
