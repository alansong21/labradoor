const express = require("express");
const prisma = require("../db/prisma");
const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const applications = await prisma.application.findMany({
            orderBy: { createdAt: "desc" },
            include: { student: true },
        });
        res.json(applications);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch applications" });
    }
});

router.post("/", async (req, res) => {
    const { title, authorId } = req.body;
    try {
        const application = await prisma.application.create({
            data: { title, authorId: authorId ?? null },
        });
        res.status(201).json(application);
    } catch (e) {
        console.error(e);
        res.status(400).json({ error: "Failed to create application" });
    }
});

module.exports = router;