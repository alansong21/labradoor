const express = require("express");
const router = express.Router();
const { authMiddleware, requireRole } = require("../middleware/auth");
const {
  createQuestion,
  getQuestion,
  getPostQuestions,
  updateQuestion,
  deleteQuestion,
} = require("../controllers/questionController");

// Public: get single question
router.get("/:id", getQuestion);
// Public: get questions for a post
router.get("/post/:postId", getPostQuestions);

// Protected: create/update/delete
router.post("/", authMiddleware, requireRole("RESEARCHER"), createQuestion);
router.patch("/:id", authMiddleware, requireRole("RESEARCHER"), updateQuestion);
router.delete("/:id", authMiddleware, requireRole("RESEARCHER"), deleteQuestion);

module.exports = router;
