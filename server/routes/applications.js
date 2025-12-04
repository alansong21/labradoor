/**
 * Application routes.
 * Handles submitting and retrieving applications for posts.
 */
const express = require("express");
const router = express.Router();
const { submitApplication, getPostApplications, getMyApplications } = require("../controllers/applicationController");
const { authMiddleware, requireRole } = require("../middleware/auth");

router.post("/", authMiddleware, requireRole("STUDENT"), submitApplication);
router.get("/post/:postId", authMiddleware, requireRole("RESEARCHER"), getPostApplications);
router.get("/my-applications", authMiddleware, requireRole("STUDENT"), getMyApplications);

module.exports = router;
