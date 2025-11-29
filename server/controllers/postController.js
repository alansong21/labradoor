/* const prisma = require("../db/prisma");
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
            router.p
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
 */

const prisma = require("../db/prisma");
const { z } = require("zod");

const createPostSchema = z.object({
  title: z.string().min(1),
  body: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * POST /api/posts
 * Auth: researcher only (must have a Researcher row)
 */
async function createPost(req, res) {
  // Make sure user is logged in
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const parsed = createPostSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { title, body, description, tags } = parsed.data;

  try {
    // Ensure this user is a researcher
    const researcher = await prisma.researcher.findUnique({
      where: { userId: req.user.id },
    });

    if (!researcher) {
      return res.status(403).json({ error: "Only researchers can create posts" });
    }

    const content = body ?? description ?? "";

    const post = await prisma.post.create({
      data: {
        title,
        body: content,
        researcherId: researcher.userId,
        tags: tags ?? [],
      },
    });

    return res.status(201).json(post);
  } catch (e) {
    console.error("Error creating post:", e);
    return res.status(500).json({ error: "Failed to create post" });
  }
}

/**
 * GET /api/posts
 * Public: list all posts (newest first)
 */
async function getAllPosts(req, res) {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        researcher: {
          select: {
            department: true,
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    return res.json(posts);
  } catch (e) {
    console.error("Error fetching posts:", e);
    return res.status(500).json({ error: "Failed to fetch posts" });
  }
}

/**
 * GET /api/posts/my-posts
 * Auth: researcher only — posts owned by this researcher
 */
async function getMyPosts(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const posts = await prisma.post.findMany({
      where: { researcherId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });

    return res.json(posts);
  } catch (e) {
    console.error("Error fetching my posts:", e);
    return res.status(500).json({ error: "Failed to fetch posts" });
  }
}

/**
 * GET /api/posts/:id
 * Public: single post by id
 */
async function getPost(req, res) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "Invalid post id" });
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        researcher: {
          select: {
            department: true,
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    return res.json(post);
  } catch (e) {
    console.error("Error fetching post:", e);
    return res.status(500).json({ error: "Failed to fetch post" });
  }
}

module.exports = {
  createPost,
  getAllPosts,
  getMyPosts,
  getPost,
};
