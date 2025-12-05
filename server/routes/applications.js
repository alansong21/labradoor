/**
 * Application routes.
 * Handles submitting and retrieving applications for posts.
 */
const express = require("express");
const router = express.Router();
const {
    submitApplication,
    getPostApplications,
    getMyApplications,
    getApplication,
    updateApplication,
    deleteApplication,
} = require("../controllers/applicationController");
const { authMiddleware, requireRole } = require("../middleware/auth");

router.post("/", authMiddleware, requireRole("STUDENT"), submitApplication);
router.get("/post/:postId", authMiddleware, requireRole("RESEARCHER"), getPostApplications);
router.get("/my-applications", authMiddleware, requireRole("STUDENT"), getMyApplications);
router.get("/:id", authMiddleware, getApplication);
router.patch("/:id", authMiddleware, updateApplication);
router.delete("/:id", authMiddleware, requireRole("STUDENT"), deleteApplication);

module.exports = router;
