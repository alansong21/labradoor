// routes/debugRoutes.js
const express = require("express");
const router = express.Router();
const { becomeResearcher } = require("../controllers/debugController");
const { authMiddleware } = require("../middleware/auth");
const { becomeStudent } = require("../controllers/debugController");

// POST /api/debug/become-researcher
router.post("/become-researcher", authMiddleware, becomeResearcher);
router.post("/become-student", authMiddleware, becomeStudent);

module.exports = router;
