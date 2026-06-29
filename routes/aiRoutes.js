const express = require("express");
const {
  recommendMajor,
  handleChat,
  getChatHistory,
  clearChatHistory,
  translateAnnouncement,
} = require("../controllers/aiController");

const router = express.Router();

router.post("/recommend-major", recommendMajor);
router.post("/chat", handleChat);
router.get("/chat/history/:student_id", getChatHistory);
router.delete("/chat/history/:student_id", clearChatHistory);
router.post("/translate-announcement", translateAnnouncement);

module.exports = router;
