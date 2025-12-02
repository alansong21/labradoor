const prisma = require("../db/prisma");
const { z } = require("zod");

// Frontend sends question types as: "text" | "checkbox" | "multiple-choice"
// Database expects Question.type as enum: SHORT_TEXT | LONG_TEXT | MULTIPLE_CHOICE | CHECKBOX
const questionSchema = z.object({
    type: z.enum(["text", "checkbox", "multiple-choice"]),
    question: z.string().min(1),
    description: z.string().optional(),
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
    const researcherId = req.user.id;

    try {
        const post = await prisma.post.create({
            data: {
                title,
                body: description || "",
                researcherId: researcherId,
                questions: {
                    create: questions?.map((q) => ({
                        // map frontend types to DB enum
                        type: q.type === "text" ? "SHORT_TEXT" : q.type === "multiple-choice" ? "MULTIPLE_CHOICE" : "CHECKBOX",
                        body: {
                            question: q.question,
                            description: q.description || null,
                            options: q.options || [],
                        },
                    })),
                },
            },
            include: {
                questions: true,
                researcher: { include: { user: { select: { name: true, email: true } } } },
            },
        });
        // normalize response to include `author` and `content` like older frontend expects
        const result = {
            ...post,
            content: post.body,
            author: post.researcher?.user ? { name: post.researcher.user.name, email: post.researcher.user.email } : null,
        };
        delete result.researcher;
        res.status(201).json(result);
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
                _count: { select: { applications: true } },
                researcher: { include: { user: { select: { name: true, email: true } } } },
            },
        });
        const formatted = posts.map((p) => ({
            ...p,
            content: p.body,
            author: p.researcher?.user ? { name: p.researcher.user.name, email: p.researcher.user.email } : null,
        }));
        // remove researcher key to keep response shape stable
        formatted.forEach((p) => delete p.researcher);
        res.json(formatted);
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
                researcher: { include: { user: { select: { name: true, email: true } } } },
            },
        });

        if (!post) return res.status(404).json({ error: "Post not found" });

        const result = {
            ...post,
            content: post.body,
            author: post.researcher?.user ? { name: post.researcher.user.name, email: post.researcher.user.email } : null,
        };
        delete result.researcher;

        res.json(result);
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
                researcher: { include: { user: { select: { name: true } } } },
            },
        });
        const formatted = posts.map((p) => ({
            ...p,
            content: p.body,
            author: p.researcher?.user ? { name: p.researcher.user.name } : null,
        }));
        res.json(formatted);
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
