const express = require("express");
const prisma = require("../db/prisma");
const router = express.Router();

router.get("/", async (_req, res) => {
    try {
        const posts = await prisma.post.findMany({
            orderBy: { createdAt: "desc" },
            include: { User: true },
        });
        res.json(posts);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch posts" });
    }
});

router.post("/", async (req, res) => {
    const { title, authorId } = req.body;
    try {
        const post = await prisma.post.create({
            data: { title, authorId: authorId ?? null },
        });
        res.status(201).json(post);
    } catch (e) {
        console.error(e);
        res.status(400).json({ error: "Failed to create post" });
    }
});

module.exports = router;

