const prisma = require("../db/prisma");
const { z } = require("zod");

const idParam = z.object({ id: z.coerce.number().int().positive() }); // id param validator

// createAnswerSchema - validates create answer request, can have short_text, long_text, multiple_choice, checkbox

const createAnswerSchema = z.object({
	questionId: z.number().int().positive(),
	applicationId: z.number().int().positive(),
	body: z.any(),
	type: z.enum(["SHORT_TEXT", "LONG_TEXT", "MULTIPLE_CHOICE", "CHECKBOX"]).optional(),
});

// createAnswer - creates an answer by parsing the request body, checking if the user is authorized, and creating the answer in the database

async function createAnswer(req, res) {
	const parsed = createAnswerSchema.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

	const { questionId, applicationId, body, type } = parsed.data;

	try {
		const application = await prisma.application.findUnique({ where: { id: applicationId }, include: { post: true } });
		if (!application) return res.status(404).json({ error: "Application not found" });

		const userId = req.user.id;
		const isApplicant = application.studentId === userId;
		const isResearcher = (application.post?.researcherId) === userId;
		if (!isApplicant && !isResearcher) return res.status(403).json({ error: "Unauthorized" });

		const answer = await prisma.answer.create({
			data: {
				questionId,
				applicationId,
				body,
				type: type || undefined,
			},
		});
		res.status(201).json(answer);
	} catch (e) {
		console.error(e);
		res.status(500).json({ error: "Failed to create answer" });
	}
}

// getAnswer - gets an answer by parsing the request params, checking if the user is authorized, and getting the answer from the database

async function getAnswer(req, res) {
	const parsed = idParam.safeParse(req.params);
	if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

	try {
		const answer = await prisma.answer.findUnique({ where: { id: parsed.data.id }, include: { question: true, application: true } });
		if (!answer) return res.status(404).json({ error: "Answer not found" });

		const userId = req.user.id;
		const isApplicant = answer.application.studentId === userId;
		const isResearcher = (await prisma.post.findUnique({ where: { id: answer.application.postId } })).researcherId === userId;
		if (!isApplicant && !isResearcher) return res.status(403).json({ error: "Unauthorized" });

		res.json(answer);
	} catch (e) {
		console.error(e);
		res.status(500).json({ error: "Failed to fetch answer" });
	}
}

// getApplicationAnswers - gets all answers for a specific application by parsing the request params, checking if the user is authorized, and getting the answers from the database

async function getApplicationAnswers(req, res) {
	const parsed = idParam.safeParse(req.params);
	if (!parsed.success) return res.status(400).json({ error: "Invalid application id" });

	try {
		const application = await prisma.application.findUnique({ where: { id: parsed.data.id }, include: { post: true } });
		if (!application) return res.status(404).json({ error: "Application not found" });

		const userId = req.user.id;
		const isApplicant = application.studentId === userId;
		const isResearcher = application.post.researcherId === userId;
		if (!isApplicant && !isResearcher) return res.status(403).json({ error: "Unauthorized" });

		const answers = await prisma.answer.findMany({ where: { applicationId: parsed.data.id }, include: { question: true } });
		res.json(answers);
	} catch (e) {
		console.error(e);
		res.status(500).json({ error: "Failed to fetch answers" });
	}
}

// updateAnswer - updates an answer by parsing the request params, checking if the user is authorized, and updating the answer in the database

async function updateAnswer(req, res) {
	const parsedParams = idParam.safeParse(req.params);
	if (!parsedParams.success) return res.status(400).json({ error: "Invalid id" });

	const parsedBody = z.object({ body: z.any().optional() }).safeParse(req.body);
	if (!parsedBody.success) return res.status(400).json({ error: parsedBody.error.flatten() });

	try {
		const answer = await prisma.answer.findUnique({ where: { id: parsedParams.data.id }, include: { application: true } });
		if (!answer) return res.status(404).json({ error: "Answer not found" });

		const userId = req.user.id;
		if (answer.application.studentId !== userId) return res.status(403).json({ error: "Unauthorized" });

		const updated = await prisma.answer.update({ where: { id: parsedParams.data.id }, data: { body: parsedBody.data.body } });
		res.json(updated);
	} catch (e) {
		console.error(e);
		res.status(500).json({ error: "Failed to update answer" });
	}
}

// deleteAnswer - deletes an answer by parsing the request params, checking if the user is authorized, and deleting the answer from the database

async function deleteAnswer(req, res) {
	const parsed = idParam.safeParse(req.params);
	if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

	try {
		const answer = await prisma.answer.findUnique({ where: { id: parsed.data.id }, include: { application: true } });
		if (!answer) return res.status(404).json({ error: "Answer not found" });

		const userId = req.user.id;
		const post = await prisma.post.findUnique({ where: { id: answer.application.postId } });
		const isApplicant = answer.application.studentId === userId;
		const isResearcher = post.researcherId === userId;
		if (!isApplicant && !isResearcher) return res.status(403).json({ error: "Unauthorized" });

		await prisma.answer.delete({ where: { id: parsed.data.id } });
		res.status(204).send();
	} catch (e) {
		console.error(e);
		res.status(500).json({ error: "Failed to delete answer" });
	}
}

module.exports = {
	createAnswer,
	getAnswer,
	getApplicationAnswers,
	updateAnswer,
	deleteAnswer,
};
