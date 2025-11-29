// routes/debugRoutes.js
const express = require("express");
const router = express.Router();
const { becomeResearcher } = require("../controllers/debugController");
const { authMiddleware } = require("../middleware/auth");

// POST /api/debug/become-researcher
router.post("/become-researcher", authMiddleware, becomeResearcher);

module.exports = router;
