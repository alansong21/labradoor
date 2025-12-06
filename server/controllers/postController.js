const prisma = require("../db/prisma");
const { z } = require("zod");

// idParam - validates route param id for fetching a single post

const idParam = z.object({ id: z.coerce.number().int().positive() });

// questionInputSchema - validates researcher question inputs for a post

const questionInputSchema = z.object({
    type: z.enum(["text", "checkbox", "multiple-choice"]),
    question: z.string().min(1),
    description: z.string().optional(),
    options: z.array(z.string().min(1)).optional(),
});

// createPostSchema - validates the request body for creating a new post

const createPostSchema = z.object({
    title: z.string().min(1),
    body: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    questions: z.array(questionInputSchema).optional(),
});

// createPost - creates a new researcher post with optional tags and questions

// createPost helper functions
function mapQuestionType(type) {
    // Converts question type to database enum values
    const TYPE_MAP = {
        text: "LONG_TEXT",
        checkbox: "CHECKBOX",
        "multiple-choice": "MULTIPLE_CHOICE",
    };
    return TYPE_MAP[type];
}

function requiresOptions(type) {
    // Determine if a question type requires options (return bool)
    // PRE: Must be a valid type
    return type === "multiple-choice" || type === "checkbox";
}


function sanitizeOptions(options) {
    // Trim options array
    // Returns sanitized options 
    if (!options) return []; // returns empty array if options is null
    return options.map(opt => opt.trim()).filter(Boolean);
}

function formatQuestion(question) {
    // Formats a single question to store in the db
    // PRE: Question must be completely valid
    // POST: Question fully formatted and sanitized
    const mappedType = mapQuestionType(question.type);
    const needsOptions = requiresOptions(question.type);
    const options = needsOptions ? sanitizeOptions(question.options) : [];

    return {
        type: mappedType,
        body: {
            prompt: question.question,
            description: question.description ?? "",
            options,
        },
    };
}

function validateQuestionOptions(formattedQuestions) {
    // Check validity of "options"-type questions
    // PRE: formattedQuestions is an array of questions in the db format
    // Returns null or error message if invalid
    
    const invalidQuestion = formattedQuestions.find(
        q => (q.type === "MULTIPLE_CHOICE" || q.type === "CHECKBOX") && 
             q.body.options.length === 0
    );

    if (invalidQuestion) {
        return "Multiple choice and checkbox questions require at least one option.";
    }
    return null;
}

async function ensureVerifiedResearcher(userId) {
    // Check that researcher is verified
    // PRE: valid userId
    // Returns 403 if the researcher is not verified
    const researcher = await prisma.researcher.findUnique({ where: { userId } });
    
    if (researcher?.verifyStatus !== "VERIFIED") {
        throw { status: 403, message: "Only verified researchers can create posts" };
    }
}

function validateAndPreparePostData(requestBody, userId) {
    // Post validation and preparation
    // PRE: requestBody must be an object
    // POST: Return validated object or error
    
    // GUARD: Validate input schema
    const parsed = createPostSchema.safeParse(requestBody);
    if (!parsed.success) {
        throw { status: 400, error: parsed.error.flatten() };
    }

    const { title, body, description, tags, questions } = parsed.data;

    // Use description as body if not provided
    const resolvedBody = body ?? description ?? "";

    // Format questions for database
    const formattedQuestions = questions ? questions.map(formatQuestion) : [];

    // GUARD: Validate question options
    const optionsError = validateQuestionOptions(formattedQuestions);
    if (optionsError) {
        throw { status: 400, error: optionsError };
    }

    return {
        title,
        resolvedBody,
        userId,
        tags: tags || [],
        formattedQuestions,
    };
}

async function createPostInDatabase(postData) {
    // Create post in database with its questions/tags
    // PRE: postData must be valid and preformatted
    // POST: Return created post
    
    const { title, resolvedBody, userId, tags, formattedQuestions } = postData;

    // GUARD: Ensure user is verified researcher
    await ensureVerifiedResearcher(userId);

    // Create post with questions in single transaction
    const post = await prisma.post.create({
        data: {
            title,
            body: resolvedBody,
            researcherId: userId,
            tags,
            questions: formattedQuestions.length
                ? { create: formattedQuestions }
                : undefined,
        },
        include: {
            questions: true,
            researcher: {
                include: { user: true },
            },
        },
    });

    return post;
}

// main createPost function

async function createPost(req, res) {
    // Creates a new research post with questions and tags if any.
    //      > Validate input using schema
    //      > Check that researcher is verified
    //      > Format questions for database
    //      > Create post and questions
    //
    // PRE: req.body and req.user.id must valid
    // POST: Returns 201 on successful post creation, otherwise return error code
    try {
        // Validate and prepare data
        const postData = validateAndPreparePostData(req.body, req.user.id);

        // Create post in database
        const post = await createPostInDatabase(postData);

        return res.status(201).json(post);
    } catch (e) {
        // Handle known errors
        if (e.status) {
            return res.status(e.status).json({ error: e.error || e.message });
        }
       
        // Log unexpected errors
        console.error("Failed to create post:", e);
        return res.status(500).json({ error: "Failed to create post" });
    }
}

// getMyPosts - returns all posts created by the authenticated researcher

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

// getPost - returns a single post with questions and researcher info by id

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

// getAllPosts - returns all posts in the system with researcher and question data

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

async function deletePost(req, res) {
    const parsed = idParam.safeParse(req.params);
    if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

    try {
        const post = await prisma.post.findUnique({
            where: { id: parsed.data.id },
        });

        if (!post) return res.status(404).json({ error: "Post not found" });
        if (post.researcherId !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        await prisma.$transaction(async tx => {
            await tx.answer.deleteMany({
                where: { application: { postId: parsed.data.id } },
            });
            await tx.question.deleteMany({
                where: { postId: parsed.data.id },
            });
            await tx.application.deleteMany({
                where: { postId: parsed.data.id },
            });
            await tx.post.delete({ where: { id: parsed.data.id } });
        });
        res.status(204).send();
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to delete post" });
    }
}

module.exports = {
    createPost,
    getMyPosts,
    getPost,
    getAllPosts,
    deletePost,
};
