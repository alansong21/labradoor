/**
 * Question Controller
 * Handles CRUD operations for questions attached to posts.
 * Ensures only the researcher who owns the post can modify its questions.
 */
const prisma = require("../db/prisma");
const { z } = require("zod");

// idParam – validates question/post id param

const idParam = z.object({ id: z.coerce.number().int().positive() });

// createQuestionSchema – validates payload for creating a question

const createQuestionSchema = z.object({
  postId: z.number().int().positive(),
  type: z.enum(["SHORT_TEXT", "LONG_TEXT", "MULTIPLE_CHOICE", "CHECKBOX"]),
  body: z.any(),
});

// createQuestion – creates a new question on a post (must be owned by the researcher)

async function createQuestion(req, res) {
  const parsed = createQuestionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { postId, type, body } = parsed.data;

  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return res.status(404).json({ error: "Post not found" });

    // Only researcher who owns the post can create questions
    if (post.researcherId !== req.user.id) return res.status(403).json({ error: "Unauthorized" });

    const question = await prisma.question.create({
      data: { postId, type, body },
    });
    res.status(201).json(question);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create question" });
  }
}

// getQuestion – fetches a single question by id

async function getQuestion(req, res) {
  const parsed = idParam.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  try {
    const question = await prisma.question.findUnique({ where: { id: parsed.data.id } });
    if (!question) return res.status(404).json({ error: "Question not found" });
    res.json(question);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch question" });
  }
}

// getPostQuestions – fetches all questions for a specific post

async function getPostQuestions(req, res) {
  const parsed = z.object({ postId: z.coerce.number().int().positive() }).safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid post id" });

  try {
    const questions = await prisma.question.findMany({ where: { postId: parsed.data.postId }, orderBy: { id: "asc" } });
    res.json(questions);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
}

// updateQuestion – updates a question’s type or body (researcher must own the post)

async function updateQuestion(req, res) {
  const parsedParams = idParam.safeParse(req.params);
  if (!parsedParams.success) return res.status(400).json({ error: "Invalid id" });

  const parsedBody = z.object({ body: z.any().optional(), type: z.enum(["SHORT_TEXT", "LONG_TEXT", "MULTIPLE_CHOICE", "CHECKBOX"]).optional() }).safeParse(req.body);
  if (!parsedBody.success) return res.status(400).json({ error: parsedBody.error.flatten() });

  try {
    const question = await prisma.question.findUnique({ where: { id: parsedParams.data.id }, include: { post: true } });
    if (!question) return res.status(404).json({ error: "Question not found" });

    // Only the researcher who owns the post can update the question
    if (question.post.researcherId !== req.user.id) return res.status(403).json({ error: "Unauthorized" });

    const updated = await prisma.question.update({ where: { id: parsedParams.data.id }, data: parsedBody.data });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update question" });
  }
}

// deleteQuestion – deletes a question (researcher must own the post)


async function deleteQuestion(req, res) {
  const parsed = idParam.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  try {
    const question = await prisma.question.findUnique({ where: { id: parsed.data.id }, include: { post: true } });
    if (!question) return res.status(404).json({ error: "Question not found" });

    if (question.post.researcherId !== req.user.id) return res.status(403).json({ error: "Unauthorized" });

    await prisma.question.delete({ where: { id: parsed.data.id } });
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete question" });
  }
}

module.exports = {
  createQuestion,
  getQuestion,
  getPostQuestions,
  updateQuestion,
  deleteQuestion,
};
