const prisma = require("../db/prisma");
const { z } = require("zod");

const responseSchema = z.object({
    questionId: z.number(),
    answer: z.string(),
});

const submitApplicationSchema = z.object({
    postId: z.number(),
    responses: z.array(responseSchema),
});

async function submitApplication(req, res) {
    const parsed = submitApplicationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { postId, responses } = parsed.data;
    const applicantId = req.user.id;

    try {
        // Check if already applied
        const existing = await prisma.application.findFirst({
            where: {
                postId,
                applicantId,
            },
        });

        if (existing) {
            return res.status(409).json({ error: "You have already applied to this post" });
        }

        const application = await prisma.application.create({
            data: {
                postId,
                applicantId,
                responses: {
                    create: responses.map((r) => ({
                        questionId: r.questionId,
                        answer: r.answer,
                    })),
                },
            },
            include: {
                responses: true,
            },
        });

        res.status(201).json(application);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to submit application" });
    }
}

async function getPostApplications(req, res) {
    const { postId } = req.params;
    const userId = req.user.id;

    try {
        // Verify user is the author of the post
        const post = await prisma.post.findUnique({
            where: { id: parseInt(postId) },
        });

        if (!post) return res.status(404).json({ error: "Post not found" });
        if (post.authorId !== userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const applications = await prisma.application.findMany({
            where: { postId: parseInt(postId) },
            include: {
                applicant: {
                    select: { name: true, email: true, uclaId: true },
                },
                responses: {
                    include: {
                        question: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        res.json(applications);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch applications" });
    }
}

async function getMyApplications(req, res) {
    try {
        const applications = await prisma.application.findMany({
            where: { applicantId: req.user.id },
            include: {
                post: {
                    select: { title: true, id: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(applications);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch applications" });
    }
}

module.exports = {
    submitApplication,
    getPostApplications,
    getMyApplications,
};
