const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
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
router.post("/", authMiddleware, createQuestion);
router.patch("/:id", authMiddleware, updateQuestion);
router.delete("/:id", authMiddleware, deleteQuestion);

module.exports = router;
