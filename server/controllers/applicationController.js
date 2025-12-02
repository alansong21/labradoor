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
    const studentId = req.user.id;

    try {
        // Check if already applied
        const existing = await prisma.application.findFirst({
            where: {
                postId,
                studentId,
            },
        });

        if (existing) {
            return res.status(409).json({ error: "You have already applied to this post" });
        }

        // fetch question types to populate Answer.type (required by schema)
        const questionIds = responses.map((r) => r.questionId);
        const questions = await prisma.question.findMany({ where: { id: { in: questionIds } }, select: { id: true, type: true } });
        const qById = Object.fromEntries(questions.map((q) => [q.id, q.type]));

        const application = await prisma.application.create({
            data: {
                postId,
                studentId,
                status: "PENDING",
                answers: {
                    create: responses.map((r) => ({
                        questionId: r.questionId,
                        type: qById[r.questionId] || "SHORT_TEXT",
                        body: { answer: r.answer },
                    })),
                },
            },
            include: {
                answers: { include: { question: true } },
            },
        });

        // normalize answers to include `answer` field for frontend convenience
        const normalized = {
            ...application,
            responses: application.answers.map((a) => ({
                id: a.id,
                question: a.question,
                answer: a.body?.answer ?? null,
            })),
        };

        res.status(201).json(normalized);
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
        if (post.researcherId !== userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const applications = await prisma.application.findMany({
            where: { postId: parseInt(postId) },
            include: {
                student: {
                    include: { user: { select: { name: true, email: true, uclaId: true } } },
                },
                answers: {
                    include: { question: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        // normalize applications to previous frontend shape: applicant + responses
        const formatted = applications.map((app) => ({
            id: app.id,
            createdAt: app.createdAt,
            updatedAt: app.updatedAt,
            status: app.status,
            applicant: app.student?.user ? { name: app.student.user.name, email: app.student.user.email, uclaId: app.student.user.uclaId } : null,
            responses: app.answers.map((a) => ({ question: a.question, answer: a.body?.answer ?? null, id: a.id })),
        }));

        res.json(formatted);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch applications" });
    }
}

async function getMyApplications(req, res) {
    try {
        const applications = await prisma.application.findMany({
            where: { studentId: req.user.id },
            include: {
                post: { select: { title: true, id: true } },
                answers: { include: { question: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        const formatted = applications.map((app) => ({
            id: app.id,
            createdAt: app.createdAt,
            updatedAt: app.updatedAt,
            status: app.status,
            post: app.post,
            responses: app.answers.map((a) => ({ question: a.question, answer: a.body?.answer ?? null, id: a.id })),
        }));

        res.json(formatted);
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
