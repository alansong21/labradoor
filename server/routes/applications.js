/**
 * Application routes.
 * Handles submitting and retrieving applications for posts.
 */
const express = require("express");
const router = express.Router();
const { submitApplication, getPostApplications, getMyApplications } = require("../controllers/applicationController");
const { authMiddleware } = require("../middleware/auth");

router.post("/", authMiddleware, submitApplication);
router.get("/post/:postId", authMiddleware, getPostApplications);
router.get("/my-applications", authMiddleware, getMyApplications);

module.exports = router;
