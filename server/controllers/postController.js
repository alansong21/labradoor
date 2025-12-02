const prisma = require("../db/prisma");
const { z } = require("zod");

const idParam = z.object({ id: z.coerce.number().int().positive() });

const createPostSchema = z.object({
    title: z.string().min(1),
    body: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

async function createPost(req, res) {
    const parsed = createPostSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { title, body, tags } = parsed.data;
    const userId = req.user.id;

    try {
        const researcher = await prisma.researcher.findUnique({ where: { userId } });
        if (researcher?.verifyStatus !== "VERIFIED") {
            return res.status(403).json({ error: "Only verified researchers can create posts" });
        }

        const post = await prisma.post.create({
            data: {
                title,
                body: body || "",
                researcherId: userId,
                tags: tags || [],
            },
            include: {
                questions: true,
            },
        });
        
        res.status(201).json(post);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to create post" });
    }
}

async function getMyPosts(req, res) {
    try {
        const posts = await prisma.post.findMany({
            where: { researcherId: req.user.id },
            orderBy: { createdAt: "desc" },
            include: {
                questions: true,
                _count: { select: { applications: true } },
            },
        });
        res.json(posts);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch posts" });
    }
}

async function getPost(req, res) {
    const parsed = idParam.safeParse(req.params);
    if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

    try {
        const post = await prisma.post.findUnique({
            where: { id: parsed.data.id },
            include: {
                questions: true,
            },
        });

        if (!post) return res.status(404).json({ error: "Post not found" });

        res.json(post);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch post" });
    }
}

async function getAllPosts(req, res) {
    try {
        const posts = await prisma.post.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                questions: true,
            },
        });
        res.json(posts);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch posts" });
    }
}

module.exports = {
    createPost,
    getMyPosts,
    getPost,
    getAllPosts,
};
