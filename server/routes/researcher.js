const express = require("express");
const router = express.Router();

const {
  getMyResearcherProfile,
  upsertMyResearcherProfile,
} = require("../controllers/researcherController");

const { authMiddleware } = require("../middleware/auth");

router.post("/me", authMiddleware, upsertMyResearcherProfile);

router.get("/me", authMiddleware, getMyResearcherProfile);

module.exports = router;
