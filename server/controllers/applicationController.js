const prisma = require("../db/prisma");
const { z } = require("zod");

const idParam = z.object({ id: z.coerce.number().int().positive() });

const submitApplicationSchema = z.object({
    postId: z.number().int().positive(),
    status: z.enum(["PENDING", "UNDER_REVIEW", "ACCEPTED", "REJECTED"]).optional(),
});

async function submitApplication(req, res) {
    const parsed = submitApplicationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { postId, status } = parsed.data;

    try {
        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post) return res.status(404).json({ error: "Post not found" });
        
        const existing = await prisma.application.findFirst({
            where: {
                postId,
                studentId: req.user.id,
            },
        });

        if (existing) {
            return res.status(409).json({ error: "You have already applied to this post" });
        }

        const application = await prisma.application.create({
            data: {
                postId,
                studentId: req.user.id,
                status: status || "PENDING",
            },
            include: {
                answers: true,
            },
        });

        res.status(201).json(application);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to submit application" });
    }
}

async function getPostApplications(req, res) {
    const parsed = idParam.safeParse(req.params);
    if (!parsed.success) return res.status(400).json({ error: "Invalid post id" });

    try {
        const post = await prisma.post.findUnique({
            where: { id: parsed.data.id },
        });

        if (!post) return res.status(404).json({ error: "Post not found" });
        if (post.researcherId !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const applications = await prisma.application.findMany({
            where: { postId: parsed.data.id },
            include: {
                answers: true,
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
            where: { studentId: req.user.id },
            include: {
                post: true,
                answers: true,
            },
            orderBy: { createdAt: "desc" },
        });

        res.json(applications);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch applications" });
    }
}

async function getApplication(req, res) {
    const parsed = idParam.safeParse(req.params);
    if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

    try {
        const application = await prisma.application.findUnique({
            where: { id: parsed.data.id },
            include: {
                post: true,
                answers: true,
            },
        });

        if (!application) return res.status(404).json({ error: "Application not found" });

        const post = await prisma.post.findUnique({ where: { id: application.postId } });
        const isStudent = application.studentId === req.user.id;
        const isResearcher = post?.researcherId === req.user.id;

        if (!isStudent && !isResearcher) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        res.json(application);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch application" });
    }
}

async function updateApplication(req, res) {
    const parsedParams = idParam.safeParse(req.params);
    if (!parsedParams.success) return res.status(400).json({ error: "Invalid id" });

    const parsedBody = z.object({
        status: z.enum(["PENDING", "UNDER_REVIEW", "ACCEPTED", "REJECTED"]).optional(),
    }).safeParse(req.body);
    if (!parsedBody.success) return res.status(400).json({ error: parsedBody.error.flatten() });

    try {
        const application = await prisma.application.findUnique({
            where: { id: parsedParams.data.id },
            include: { post: true },
        });

        if (!application) return res.status(404).json({ error: "Application not found" });

        if (application.post.researcherId !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const updated = await prisma.application.update({
            where: { id: parsedParams.data.id },
            data: parsedBody.data,
        });

        res.json(updated);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to update application" });
    }
}

async function deleteApplication(req, res) {
    const parsed = idParam.safeParse(req.params);
    if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

    try {
        const application = await prisma.application.findUnique({
            where: { id: parsed.data.id },
        });

        if (!application) return res.status(404).json({ error: "Application not found" });

        if (application.studentId !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        await prisma.application.delete({ where: { id: parsed.data.id } });
        res.status(204).send();
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to delete application" });
    }
}

module.exports = {
    submitApplication,
    getPostApplications,
    getMyApplications,
    getApplication,
    updateApplication,
    deleteApplication,
};
