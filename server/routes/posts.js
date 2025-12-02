const express = require("express");
const router = express.Router();
const { createPost, getMyPosts, getPost, getAllPosts } = require("../controllers/postController");
const { authMiddleware } = require("../middleware/auth");

// Public routes
router.get("/", getAllPosts);

// Protected routes (specific paths before dynamic ones)
router.get("/my-posts", authMiddleware, getMyPosts);
router.post("/", authMiddleware, createPost);

// Public route with dynamic segment last to avoid shadowing
router.get("/:id", getPost);

module.exports = router;
