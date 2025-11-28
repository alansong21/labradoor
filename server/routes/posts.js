const express = require("express");
const router = express.Router();
const { createPost, getMyPosts, getPost, getAllPosts } = require("../controllers/postController");
const { authMiddleware } = require("../middleware/auth");

// Public routes
router.get("/", getAllPosts);
router.get("/:id", getPost);

// Protected routes
router.get("/my-posts", authMiddleware, getMyPosts);
router.post("/", authMiddleware, createPost);

module.exports = router;
