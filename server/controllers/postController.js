const prisma = require("../db/prisma");
const { z } = require("zod");

const idParam = z.object({ id: z.coerce.number().int().positive() });

const questionInputSchema = z.object({
    type: z.enum(["text", "checkbox", "multiple-choice"]),
    question: z.string().min(1),
    description: z.string().optional(),
    options: z.array(z.string().min(1)).optional(),
});

const createPostSchema = z.object({
    title: z.string().min(1),
    body: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    questions: z.array(questionInputSchema).optional(),
});

const QUESTION_TYPE_MAP = {
    text: "LONG_TEXT",
    checkbox: "CHECKBOX",
    "multiple-choice": "MULTIPLE_CHOICE",
};

async function createPost(req, res) {
    const parsed = createPostSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { title, body, description, tags, questions } = parsed.data;
    const resolvedBody = body ?? description ?? "";
    const userId = req.user.id;
    const formattedQuestions =
        questions?.map(q => ({
            type: QUESTION_TYPE_MAP[q.type],
            body: {
                prompt: q.question,
                description: q.description ?? "",
                options: q.type === "multiple-choice" ? (q.options ?? []).filter(opt => opt?.trim()) : [],
            },
        })) ?? [];

    try {
        const researcher = await prisma.researcher.findUnique({ where: { userId } });
        if (!researcher) {
            return res.status(403).json({ error: "Only verified researchers can create posts" });
        }

        const post = await prisma.post.create({
            data: {
                title,
                body: resolvedBody,
                researcherId: userId,
                tags: tags || [],
                questions: formattedQuestions.length
                    ? {
                          create: formattedQuestions,
                      }
                    : undefined,
            },
            include: {
                questions: true,
                researcher: {
                    include: {
                        user: true,
                    },
                },
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
                researcher: {
                    include: {
                        user: true,
                    },
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
                questions: true,
                researcher: {
                    include: {
                        user: true,
                    },
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
