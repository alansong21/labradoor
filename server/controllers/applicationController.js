const prisma = require("../db/prisma");
const { z } = require("zod");

// validationError - creates a validation error

const validationError = message => {
    const err = new Error(message);
    err.isValidationError = true;
    return err;
};

// idParam - validates a route param containing { id }
// postIdParam - validates a route param containing { postId }
const idParam = z.object({ id: z.coerce.number().int().positive() });
const postIdParam = z.object({ postId: z.coerce.number().int().positive() });

// answerSchema - validates an individual answer (questionId + answer value)
const answerSchema = z.object({
    questionId: z.number().int().positive(),
    answer: z.any(),
});

// submitApplicationSchema - validates the request body for submitting an application

const submitApplicationSchema = z.object({
    postId: z.number().int().positive(),
    status: z.enum(["PENDING", "UNDER_REVIEW", "ACCEPTED", "REJECTED"]).optional(),
    responses: z.array(answerSchema).optional(),
});

// submitApplication - creates a new application for a post (postId) with validated responses
async function submitApplication(req, res) {
    const parsed = submitApplicationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { postId, status, responses } = parsed.data;

    try {
        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post) return res.status(404).json({ error: "Post not found" });

        const studentProfile = await prisma.student.findUnique({ where: { userId: req.user.id } });
        if (!studentProfile) {
            return res.status(400).json({ error: "Complete your student profile before applying." });
        }

        const existing = await prisma.application.findFirst({
            where: {
                postId,
                studentId: req.user.id,
            },
        });

        if (existing) {
            return res.status(409).json({ error: "You have already applied to this post" });
        }

        const questions = await prisma.question.findMany({
            where: { postId },
            select: {
                id: true,
                type: true,
                body: true,
            },
        });
        const questionMap = new Map(questions.map(q => [q.id, q]));

        const normalizedResponses = (responses ?? []).map(resp => {
            const question = questionMap.get(resp.questionId);
            if (!question) {
                throw validationError("Invalid question response");
            }
            const rawAnswer = resp.answer;
            let normalizedValue;

            switch (question.type) {
                case "CHECKBOX": {
                    const options = Array.isArray(question.body?.options) ? question.body.options : [];
                    const rawSelections = Array.isArray(rawAnswer)
                        ? rawAnswer
                        : typeof rawAnswer === "string" && rawAnswer.length
                        ? [rawAnswer]
                        : [];
                    if (
                        rawSelections.some(
                            selection =>
                                typeof selection !== "string" ||
                                (options.length > 0 && !options.includes(selection))
                        )
                    ) {
                        throw validationError("Invalid answer for checkbox question");
                    }
                    normalizedValue = rawSelections;
                    break;
                }
                case "MULTIPLE_CHOICE": {
                    const options = Array.isArray(question.body?.options) ? question.body.options : [];
                    if (typeof rawAnswer !== "string" || !options.includes(rawAnswer)) {
                        throw validationError("Invalid answer for multiple choice question");
                    }
                    normalizedValue = rawAnswer;
                    break;
                }
                case "SHORT_TEXT":
                case "LONG_TEXT": {
                    if (typeof rawAnswer !== "string" || !rawAnswer.trim()) {
                        throw validationError("Answer is required for text questions");
                    }
                    normalizedValue = rawAnswer;
                    break;
                }
                default:
                    normalizedValue = rawAnswer;
            }

            return {
                questionId: question.id,
                type: question.type,
                body: { value: normalizedValue },
            };
        });

        const result = await prisma.$transaction(async tx => {
            const application = await tx.application.create({
                data: {
                    postId,
                    studentId: req.user.id,
                    status: status || "PENDING",
                },
            });

            if (normalizedResponses.length) {
                for (const answer of normalizedResponses) {
                    await tx.answer.create({
                        data: {
                            applicationId: application.id,
                            questionId: answer.questionId,
                            type: answer.type,
                            body: answer.body,
                        },
                    });
                }
            }

            return tx.application.findUnique({
                where: { id: application.id },
                include: {
                    answers: true,
                },
            });
        });

        res.status(201).json(result);
    } catch (e) {
        console.error(e);
        if (e?.isValidationError) {
            return res.status(400).json({ error: e.message });
        }
        res.status(500).json({ error: "Failed to submit application" });
    }
}

// getPostApplications - gets all applications for a specific post by id
async function getPostApplications(req, res) {
    const parsed = postIdParam.safeParse(req.params);
    if (!parsed.success) return res.status(400).json({ error: "Invalid post id" });
    const postId = parsed.data.postId;

    try {
        const post = await prisma.post.findUnique({
            where: { id: postId },
        });

        if (!post) return res.status(404).json({ error: "Post not found" });
        if (post.researcherId !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const applications = await prisma.application.findMany({
            where: { postId },
            include: {
                answers: true,
                student: {
                    include: {
                        user: true,
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

// getMyApplications - gets all applications for a specific student by id
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

// getApplication - gets a specific application by id
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

// updateApplication - updates a specific application by id
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

// deleteApplication - deletes a specific application by id
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
