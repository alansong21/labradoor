const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const {
    createAnswer,
    getAnswer,
    getApplicationAnswers,
    updateAnswer,
    deleteAnswer,
} = require("../controllers/answerController");

router.post("/", authMiddleware, createAnswer);
router.get("/:id", authMiddleware, getAnswer);
router.get("/application/:id", authMiddleware, getApplicationAnswers);
router.patch("/:id", authMiddleware, updateAnswer);
router.delete("/:id", authMiddleware, deleteAnswer);

module.exports = router;
