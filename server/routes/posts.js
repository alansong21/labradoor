const express = require("express");
const router = express.Router();
const { createPost, getMyPosts, getPost, getAllPosts } = require("../controllers/postController");
const { authMiddleware } = require("../middleware/auth");

// Public routes
router.get("/", getAllPosts);

// Protected routes
router.get("/my-posts", authMiddleware, getMyPosts);

// Public: MUST be after /my-posts
router.get("/:id", getPost);

// Protected create
router.post("/", authMiddleware, createPost);


module.exports = router;
