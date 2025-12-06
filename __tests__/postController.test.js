const request = require("supertest");
const express = require("express");
const postRoutes = require("../server/routes/posts");
const prisma = require("../server/db/prisma");

// Mock the auth middleware
jest.mock("../server/middleware/auth", () => ({
    authMiddleware: (req, res, next) => {
        req.user = { id: 1 };
        next();
    },
    requireRole: (role) => (req, res, next) => {
        // Mock always allows through for testing
        next();
    },
}));

// Mock the prisma client
jest.mock("../server/db/prisma", () => ({
    post: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
    },
    researcher: {
        findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
}));

// Create Express app for testing
const app = express();
app.use(express.json());
app.use("/api/posts", postRoutes);

describe("Post Controller Tests", () => {
    // Suppress console.error during tests
    let consoleErrorSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        // Mock console.error to suppress error outputs
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        // Restore console.error after each test
        consoleErrorSpy.mockRestore();
    });
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("POST /api/posts - createPost", () => {
        it("should create a post successfully", async () => {
            const postData = {
                title: "Research Opportunity",
                body: "Looking for students",
                tags: ["AI", "ML"],
            };

            const mockResearcher = {
                userId: 1,
                verifyStatus: "VERIFIED",
            };

            const mockPost = {
                id: 1,
                title: "Research Opportunity",
                body: "Looking for students",
                researcherId: 1,
                tags: ["AI", "ML"],
            };

            prisma.researcher.findUnique.mockResolvedValue(mockResearcher);
            prisma.post.create.mockResolvedValue(mockPost);

            const res = await request(app)
                .post("/api/posts")
                .send(postData);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty("id");
            expect(res.body.title).toBe("Research Opportunity");
        });

        it("should create a post with questions", async () => {
            const postData = {
                title: "Research Project",
                body: "Exciting opportunity",
                questions: [
                    {
                        type: "text",
                        question: "Why are you interested?",
                        description: "Tell us more",
                    },
                    {
                        type: "multiple-choice",
                        question: "What is your year?",
                        options: ["Freshman", "Sophomore", "Junior", "Senior"],
                    },
                ],
            };

            const mockResearcher = {
                userId: 1,
                verifyStatus: "VERIFIED",
            };

            const mockPost = {
                id: 1,
                title: "Research Project",
                questions: [],
            };

            prisma.researcher.findUnique.mockResolvedValue(mockResearcher);
            prisma.post.create.mockResolvedValue(mockPost);

            const res = await request(app)
                .post("/api/posts")
                .send(postData);

            expect(res.status).toBe(201);
            expect(prisma.post.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        title: "Research Project",
                        questions: expect.objectContaining({
                            create: expect.any(Array),
                        }),
                    }),
                })
            );
        });

        it("should return 400 for missing title", async () => {
            const postData = {
                body: "Some content",
            };

            const res = await request(app)
                .post("/api/posts")
                .send(postData);

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("error");
        });

        it("should return 400 for empty title", async () => {
            const postData = {
                title: "",
                body: "Content",
            };

            const res = await request(app)
                .post("/api/posts")
                .send(postData);

            expect(res.status).toBe(400);
        });

        it("should return 403 for unverified researcher", async () => {
            const postData = {
                title: "Research Post",
                body: "Content",
            };

            const mockResearcher = {
                userId: 1,
                verifyStatus: "PENDING",
            };

            prisma.researcher.findUnique.mockResolvedValue(mockResearcher);

            const res = await request(app)
                .post("/api/posts")
                .send(postData);

            expect(res.status).toBe(403);
            expect(res.body.error).toBe("Only verified researchers can create posts");
        });

        it("should return 403 when user is not a researcher", async () => {
            const postData = {
                title: "Research Post",
                body: "Content",
            };

            prisma.researcher.findUnique.mockResolvedValue(null);

            const res = await request(app)
                .post("/api/posts")
                .send(postData);

            expect(res.status).toBe(403);
        });

        it("should use description as body if body is not provided", async () => {
            const postData = {
                title: "Research Post",
                description: "This is the description",
            };

            const mockResearcher = {
                userId: 1,
                verifyStatus: "VERIFIED",
            };

            const mockPost = {
                id: 1,
                title: "Research Post",
                body: "This is the description",
            };

            prisma.researcher.findUnique.mockResolvedValue(mockResearcher);
            prisma.post.create.mockResolvedValue(mockPost);

            const res = await request(app)
                .post("/api/posts")
                .send(postData);

            expect(res.status).toBe(201);
            expect(prisma.post.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        body: "This is the description",
                    }),
                })
            );
        });

        it("should return 400 for multiple-choice question without options", async () => {
            const postData = {
                title: "Research Post",
                body: "Content",
                questions: [
                    {
                        type: "multiple-choice",
                        question: "Choose one",
                        options: [],
                    },
                ],
            };

            const mockResearcher = {
                userId: 1,
                verifyStatus: "VERIFIED",
            };

            prisma.researcher.findUnique.mockResolvedValue(mockResearcher);

            const res = await request(app)
                .post("/api/posts")
                .send(postData);

            expect(res.status).toBe(400);
            expect(res.body.error).toContain("require at least one option");
        });

        it("should return 400 for checkbox question without options", async () => {
            const postData = {
                title: "Research Post",
                body: "Content",
                questions: [
                    {
                        type: "checkbox",
                        question: "Select all that apply",
                    },
                ],
            };

            const mockResearcher = {
                userId: 1,
                verifyStatus: "VERIFIED",
            };

            prisma.researcher.findUnique.mockResolvedValue(mockResearcher);

            const res = await request(app)
                .post("/api/posts")
                .send(postData);

            expect(res.status).toBe(400);
            expect(res.body.error).toContain("require at least one option");
        });

        it("should accept text question without options", async () => {
            const postData = {
                title: "Research Post",
                body: "Content",
                questions: [
                    {
                        type: "text",
                        question: "Describe your experience",
                    },
                ],
            };

            const mockResearcher = {
                userId: 1,
                verifyStatus: "VERIFIED",
            };

            const mockPost = {
                id: 1,
                title: "Research Post",
            };

            prisma.researcher.findUnique.mockResolvedValue(mockResearcher);
            prisma.post.create.mockResolvedValue(mockPost);

            const res = await request(app)
                .post("/api/posts")
                .send(postData);

            expect(res.status).toBe(201);
        });
    });

    describe("GET /api/posts/my-posts - getMyPosts", () => {
        it("should get all posts for the authenticated user", async () => {
            const mockPosts = [
                {
                    id: 1,
                    title: "Post 1",
                    researcherId: 1,
                    questions: [],
                    _count: { applications: 5 },
                },
                {
                    id: 2,
                    title: "Post 2",
                    researcherId: 1,
                    questions: [],
                    _count: { applications: 3 },
                },
            ];

            prisma.post.findMany.mockResolvedValue(mockPosts);

            const res = await request(app).get("/api/posts/my-posts");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0].title).toBe("Post 1");
            expect(prisma.post.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { researcherId: 1 },
                    orderBy: { createdAt: "desc" },
                })
            );
        });

        it("should return empty array when user has no posts", async () => {
            prisma.post.findMany.mockResolvedValue([]);

            const res = await request(app).get("/api/posts/my-posts");

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });
    });

    describe("GET /api/posts/:id - getPost", () => {
        it("should get a post by id", async () => {
            const mockPost = {
                id: 1,
                title: "Research Post",
                body: "Content",
                researcherId: 1,
                questions: [],
                researcher: {
                    user: { name: "Dr. Smith" },
                },
            };

            prisma.post.findUnique.mockResolvedValue(mockPost);

            const res = await request(app).get("/api/posts/1");

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("id", 1);
            expect(res.body.title).toBe("Research Post");
        });

        it("should return 404 for non-existent post", async () => {
            prisma.post.findUnique.mockResolvedValue(null);

            const res = await request(app).get("/api/posts/999");

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Post not found");
        });

        it("should return 400 for invalid id", async () => {
            const res = await request(app).get("/api/posts/invalid");

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid id");
        });

        it("should return 400 for negative id", async () => {
            const res = await request(app).get("/api/posts/-1");

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid id");
        });
    });

    describe("GET /api/posts - getAllPosts", () => {
        it("should get all posts", async () => {
            const mockPosts = [
                {
                    id: 1,
                    title: "Post 1",
                    questions: [],
                    researcher: {
                        user: { name: "Dr. Smith" },
                    },
                },
                {
                    id: 2,
                    title: "Post 2",
                    questions: [],
                    researcher: {
                        user: { name: "Dr. Jones" },
                    },
                },
            ];

            prisma.post.findMany.mockResolvedValue(mockPosts);

            const res = await request(app).get("/api/posts");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(prisma.post.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: { createdAt: "desc" },
                })
            );
        });

        it("should return empty array when no posts exist", async () => {
            prisma.post.findMany.mockResolvedValue([]);

            const res = await request(app).get("/api/posts");

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });
    });

    describe("DELETE /api/posts/:id - deletePost", () => {
        it("should delete a post successfully", async () => {
            const mockPost = {
                id: 1,
                title: "Post to delete",
                researcherId: 1,
            };

            prisma.post.findUnique.mockResolvedValue(mockPost);
            prisma.$transaction.mockImplementation(async (callback) => {
                return await callback({
                    answer: { deleteMany: jest.fn() },
                    question: { deleteMany: jest.fn() },
                    application: { deleteMany: jest.fn() },
                    post: { delete: jest.fn() },
                });
            });

            const res = await request(app).delete("/api/posts/1");

            expect(res.status).toBe(204);
            expect(prisma.$transaction).toHaveBeenCalled();
        });

        it("should return 404 for non-existent post", async () => {
            prisma.post.findUnique.mockResolvedValue(null);

            const res = await request(app).delete("/api/posts/999");

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Post not found");
        });

        it("should return 403 when user is not the post owner", async () => {
            const mockPost = {
                id: 1,
                title: "Post",
                researcherId: 2, // Different researcher
            };

            prisma.post.findUnique.mockResolvedValue(mockPost);

            const res = await request(app).delete("/api/posts/1");

            expect(res.status).toBe(403);
            expect(res.body.error).toBe("Unauthorized");
        });

        it("should return 400 for invalid id", async () => {
            const res = await request(app).delete("/api/posts/invalid");

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid id");
        });
    });

    describe("Database Error Handling", () => {
        it("should handle database error during createPost", async () => {
            const postData = {
                title: "Research Post",
                body: "Content",
            };

            const mockResearcher = {
                userId: 1,
                verifyStatus: "VERIFIED",
            };

            prisma.researcher.findUnique.mockResolvedValue(mockResearcher);
            prisma.post.create.mockRejectedValue(new Error("Database error"));

            const res = await request(app)
                .post("/api/posts")
                .send(postData);

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to create post");
        });

        it("should handle database error during getMyPosts", async () => {
            prisma.post.findMany.mockRejectedValue(new Error("Database error"));

            const res = await request(app).get("/api/posts/my-posts");

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to fetch posts");
        });

        it("should handle database error during getPost", async () => {
            prisma.post.findUnique.mockRejectedValue(new Error("Database error"));

            const res = await request(app).get("/api/posts/1");

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to fetch post");
        });

        it("should handle database error during getAllPosts", async () => {
            prisma.post.findMany.mockRejectedValue(new Error("Database error"));

            const res = await request(app).get("/api/posts");

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to fetch posts");
        });

        it("should handle database error during deletePost", async () => {
            const mockPost = {
                id: 1,
                researcherId: 1,
            };

            prisma.post.findUnique.mockResolvedValue(mockPost);
            prisma.$transaction.mockRejectedValue(new Error("Database error"));

            const res = await request(app).delete("/api/posts/1");

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to delete post");
        });
    });

    describe("Edge Cases", () => {
        it("should handle very long title", async () => {
            const longTitle = "A".repeat(1000);
            const postData = {
                title: longTitle,
                body: "Content",
            };

            const mockResearcher = {
                userId: 1,
                verifyStatus: "VERIFIED",
            };

            const mockPost = {
                id: 1,
                title: longTitle,
            };

            prisma.researcher.findUnique.mockResolvedValue(mockResearcher);
            prisma.post.create.mockResolvedValue(mockPost);

            const res = await request(app)
                .post("/api/posts")
                .send(postData);

            expect(res.status).toBe(201);
        });

        it("should handle empty body and description", async () => {
            const postData = {
                title: "Research Post",
            };

            const mockResearcher = {
                userId: 1,
                verifyStatus: "VERIFIED",
            };

            const mockPost = {
                id: 1,
                title: "Research Post",
                body: "",
            };

            prisma.researcher.findUnique.mockResolvedValue(mockResearcher);
            prisma.post.create.mockResolvedValue(mockPost);

            const res = await request(app)
                .post("/api/posts")
                .send(postData);

            expect(res.status).toBe(201);
            expect(prisma.post.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        body: "",
                    }),
                })
            );
        });

        it("should handle empty tags array", async () => {
            const postData = {
                title: "Research Post",
                body: "Content",
                tags: [],
            };

            const mockResearcher = {
                userId: 1,
                verifyStatus: "VERIFIED",
            };

            const mockPost = {
                id: 1,
                title: "Research Post",
                tags: [],
            };

            prisma.researcher.findUnique.mockResolvedValue(mockResearcher);
            prisma.post.create.mockResolvedValue(mockPost);

            const res = await request(app)
                .post("/api/posts")
                .send(postData);

            expect(res.status).toBe(201);
        });
    });
});