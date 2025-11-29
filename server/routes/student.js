const express = require("express");
const router = express.Router();

const {
  getMyStudentProfile,
  upsertMyStudentProfile,
} = require("../controllers/studentController");

const { authMiddleware } = require("../middleware/auth");

// Create or update current user's student profile
router.post("/me", authMiddleware, upsertMyStudentProfile);

// Get current user's student profile
router.get("/me", authMiddleware, getMyStudentProfile);

module.exports = router;
