const prisma = require("../db/prisma");
const { z } = require("zod");

const questionSchema = z.object({
    type: z.enum(["text", "checkbox", "multiple-choice"]),
    question: z.string().min(1),
    options: z.array(z.string()).optional(),
});

const createPostSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    questions: z.array(questionSchema).optional(),
});

async function createPost(req, res) {
    const parsed = createPostSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { title, description, questions } = parsed.data;
    const authorId = req.user.id;

    try {
        const post = await prisma.post.create({
            data: {
                title,
                content: description,
                authorId,
                questions: {
                    create: questions?.map((q) => ({
                        type: q.type,
                        question: q.question,
                        options: q.options || [],
                    })),
                },
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
            where: { authorId: req.user.id },
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { applications: true },
                },
            },
        });
        res.json(posts);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch posts" });
    }
}

async function getPost(req, res) {
    const { id } = req.params;
    try {
        const post = await prisma.post.findUnique({
            where: { id: parseInt(id) },
            include: {
                questions: true,
                author: {
                    select: { name: true, email: true },
                },
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
                author: {
                    select: { name: true },
                },
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
