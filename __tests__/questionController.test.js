const request = require("supertest");
const express = require("express");
const questionRoutes = require("../server/routes/questions");
const prisma = require("../server/db/prisma");

// Mock the auth middleware
jest.mock("../server/middleware/auth", () => ({
    authMiddleware: (req, res, next) => {
        req.user = { id: 1 };
        next();
    },
    requireRole: () => (_req, _res, next) => next(),
}));

// Mock the prisma client
jest.mock("../server/db/prisma", () => ({
    question: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    post: {
        findUnique: jest.fn(),
    },
}));

// Create Express app for testing
const app = express();
app.use(express.json());
app.use("/api/questions", questionRoutes);

describe("Question Controller Tests", () => {
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


    describe("Public Routes", () => {
        it("GET /:id should be accessible without authentication", async () => {
            const mockQuestion = {
                id: 1,
                postId: 1,
                type: "SHORT_TEXT",
                body: "Test question",
            };

            prisma.question.findUnique.mockResolvedValue(mockQuestion);

            const res = await request(app).get("/api/questions/1");

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("id", 1);
        });

        it("GET /post/:postId should be accessible without authentication", async () => {
            const mockQuestions = [
                { id: 1, postId: 1, type: "SHORT_TEXT", body: "Question 1" },
            ];

            prisma.question.findMany.mockResolvedValue(mockQuestions);

            const res = await request(app).get("/api/questions/post/1");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
        });
    });

    describe("POST /api/questions - createQuestion", () => {
        it("should create a question successfully", async () => {
            const questionData = {
                postId: 1,
                type: "SHORT_TEXT",
                body: "What is your research interest?",
            };

            const mockPost = {
                id: 1,
                researcherId: 1,
            };

            const mockQuestion = {
                id: 1,
                postId: 1,
                type: "SHORT_TEXT",
                body: "What is your research interest?",
            };

            prisma.post.findUnique.mockResolvedValue(mockPost);
            prisma.question.create.mockResolvedValue(mockQuestion);

            const res = await request(app)
                .post("/api/questions")
                .send(questionData);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty("id");
            expect(res.body.type).toBe("SHORT_TEXT");
            expect(prisma.question.create).toHaveBeenCalledWith({
                data: {
                    postId: 1,
                    type: "SHORT_TEXT",
                    body: "What is your research interest?",
                },
            });
        });

        it("should return 400 for missing required fields", async () => {
            const invalidData = {
                postId: 1,
                // missing type and body
            };

            const res = await request(app)
                .post("/api/questions")
                .send(invalidData);

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("error");
        });

        it("should return 400 for invalid type", async () => {
            const invalidData = {
                postId: 1,
                type: "INVALID_TYPE",
                body: "Question text",
            };

            const res = await request(app)
                .post("/api/questions")
                .send(invalidData);

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("error");
        });

        it("should return 404 for non-existent post", async () => {
            const questionData = {
                postId: 999,
                type: "SHORT_TEXT",
                body: "Question text",
            };

            prisma.post.findUnique.mockResolvedValue(null);

            const res = await request(app)
                .post("/api/questions")
                .send(questionData);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Post not found");
        });

        it("should return 403 when user is not the post researcher", async () => {
            const questionData = {
                postId: 1,
                type: "SHORT_TEXT",
                body: "Question text",
            };

            const mockPost = {
                id: 1,
                researcherId: 2, // Different researcher
            };

            prisma.post.findUnique.mockResolvedValue(mockPost);

            const res = await request(app)
                .post("/api/questions")
                .send(questionData);

            expect(res.status).toBe(403);
            expect(res.body.error).toBe("Unauthorized");
        });

        it("should accept all valid question types", async () => {
            const validTypes = ["SHORT_TEXT", "LONG_TEXT", "MULTIPLE_CHOICE", "CHECKBOX"];

            for (const type of validTypes) {
                const questionData = {
                    postId: 1,
                    type: type,
                    body: "Test question",
                };

                const mockPost = {
                    id: 1,
                    researcherId: 1,
                };

                prisma.post.findUnique.mockResolvedValue(mockPost);
                prisma.question.create.mockResolvedValue({ id: 1, ...questionData });

                const res = await request(app)
                    .post("/api/questions")
                    .send(questionData);

                expect(res.status).toBe(201);
            }
        });

        it("should handle object as body value", async () => {
            const questionData = {
                postId: 1,
                type: "MULTIPLE_CHOICE",
                body: {
                    question: "Select your preference",
                    options: ["Option A", "Option B", "Option C"],
                },
            };

            const mockPost = {
                id: 1,
                researcherId: 1,
            };

            prisma.post.findUnique.mockResolvedValue(mockPost);
            prisma.question.create.mockResolvedValue({ id: 1, ...questionData });

            const res = await request(app)
                .post("/api/questions")
                .send(questionData);

            expect(res.status).toBe(201);
            expect(res.body.body).toEqual(questionData.body);
        });
    });

    describe("GET /api/questions/:id - getQuestion", () => {
        it("should get a question by id", async () => {
            const mockQuestion = {
                id: 1,
                postId: 1,
                type: "SHORT_TEXT",
                body: "Test question",
            };

            prisma.question.findUnique.mockResolvedValue(mockQuestion);

            const res = await request(app).get("/api/questions/1");

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("id", 1);
            expect(res.body.body).toBe("Test question");
        });

        it("should return 404 for non-existent question", async () => {
            prisma.question.findUnique.mockResolvedValue(null);

            const res = await request(app).get("/api/questions/999");

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Question not found");
        });

        it("should return 400 for invalid id format", async () => {
            const res = await request(app).get("/api/questions/invalid");

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid id");
        });

        it("should return 400 for negative id", async () => {
            const res = await request(app).get("/api/questions/-1");

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid id");
        });
    });

    describe("GET /api/questions/post/:postId - getPostQuestions", () => {
        it("should get all questions for a post", async () => {
            const mockQuestions = [
                { id: 1, postId: 1, type: "SHORT_TEXT", body: "Question 1" },
                { id: 2, postId: 1, type: "LONG_TEXT", body: "Question 2" },
                { id: 3, postId: 1, type: "MULTIPLE_CHOICE", body: "Question 3" },
            ];

            prisma.question.findMany.mockResolvedValue(mockQuestions);

            const res = await request(app).get("/api/questions/post/1");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(3);
            expect(res.body[0].body).toBe("Question 1");
            expect(prisma.question.findMany).toHaveBeenCalledWith({
                where: { postId: 1 },
                orderBy: { id: "asc" },
            });
        });

        it("should return empty array when no questions exist", async () => {
            prisma.question.findMany.mockResolvedValue([]);

            const res = await request(app).get("/api/questions/post/1");

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        it("should return 400 for invalid post id", async () => {
            const res = await request(app).get("/api/questions/post/invalid");

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid post id");
        });

        it("should return questions ordered by id ascending", async () => {
            const mockQuestions = [
                { id: 3, postId: 1, body: "Third" },
                { id: 1, postId: 1, body: "First" },
                { id: 2, postId: 1, body: "Second" },
            ];

            // Simulate database ordering
            const orderedQuestions = [...mockQuestions].sort((a, b) => a.id - b.id);
            prisma.question.findMany.mockResolvedValue(orderedQuestions);

            const res = await request(app).get("/api/questions/post/1");

            expect(res.status).toBe(200);
            expect(res.body[0].id).toBe(1);
            expect(res.body[1].id).toBe(2);
            expect(res.body[2].id).toBe(3);
        });
    });

    describe("PATCH /api/questions/:id - updateQuestion", () => {
        it("should update question body successfully", async () => {
            const mockQuestion = {
                id: 1,
                postId: 1,
                type: "SHORT_TEXT",
                body: "Old question",
                post: { id: 1, researcherId: 1 },
            };

            const updatedQuestion = {
                ...mockQuestion,
                body: "Updated question",
            };

            prisma.question.findUnique.mockResolvedValue(mockQuestion);
            prisma.question.update.mockResolvedValue(updatedQuestion);

            const res = await request(app)
                .patch("/api/questions/1")
                .send({ body: "Updated question" });

            expect(res.status).toBe(200);
            expect(res.body.body).toBe("Updated question");
            expect(prisma.question.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { body: "Updated question" },
            });
        });

        it("should update question type successfully", async () => {
            const mockQuestion = {
                id: 1,
                postId: 1,
                type: "SHORT_TEXT",
                body: "Question",
                post: { id: 1, researcherId: 1 },
            };

            const updatedQuestion = {
                ...mockQuestion,
                type: "LONG_TEXT",
            };

            prisma.question.findUnique.mockResolvedValue(mockQuestion);
            prisma.question.update.mockResolvedValue(updatedQuestion);

            const res = await request(app)
                .patch("/api/questions/1")
                .send({ type: "LONG_TEXT" });

            expect(res.status).toBe(200);
            expect(res.body.type).toBe("LONG_TEXT");
        });

        it("should update both body and type", async () => {
            const mockQuestion = {
                id: 1,
                postId: 1,
                type: "SHORT_TEXT",
                body: "Old question",
                post: { id: 1, researcherId: 1 },
            };

            const updatedQuestion = {
                ...mockQuestion,
                type: "MULTIPLE_CHOICE",
                body: { question: "New", options: ["A", "B"] },
            };

            prisma.question.findUnique.mockResolvedValue(mockQuestion);
            prisma.question.update.mockResolvedValue(updatedQuestion);

            const res = await request(app)
                .patch("/api/questions/1")
                .send({
                    type: "MULTIPLE_CHOICE",
                    body: { question: "New", options: ["A", "B"] },
                });

            expect(res.status).toBe(200);
            expect(res.body.type).toBe("MULTIPLE_CHOICE");
        });

        it("should return 404 for non-existent question", async () => {
            prisma.question.findUnique.mockResolvedValue(null);

            const res = await request(app)
                .patch("/api/questions/999")
                .send({ body: "Updated" });

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Question not found");
        });

        it("should return 403 when user is not the post researcher", async () => {
            const mockQuestion = {
                id: 1,
                postId: 1,
                type: "SHORT_TEXT",
                body: "Question",
                post: { id: 1, researcherId: 2 }, // Different researcher
            };

            prisma.question.findUnique.mockResolvedValue(mockQuestion);

            const res = await request(app)
                .patch("/api/questions/1")
                .send({ body: "Updated" });

            expect(res.status).toBe(403);
            expect(res.body.error).toBe("Unauthorized");
        });

        it("should accept empty update body", async () => {
            const mockQuestion = {
                id: 1,
                postId: 1,
                type: "SHORT_TEXT",
                body: "Question",
                post: { id: 1, researcherId: 1 },
            };

            prisma.question.findUnique.mockResolvedValue(mockQuestion);
            prisma.question.update.mockResolvedValue(mockQuestion);

            const res = await request(app)
                .patch("/api/questions/1")
                .send({});

            expect(res.status).toBe(200);
        });

        it("should return 400 for invalid type in update", async () => {
            const res = await request(app)
                .patch("/api/questions/1")
                .send({ type: "INVALID_TYPE" });

            expect(res.status).toBe(400);
        });
    });

    describe("DELETE /api/questions/:id - deleteQuestion", () => {
        it("should delete a question successfully", async () => {
            const mockQuestion = {
                id: 1,
                postId: 1,
                post: { id: 1, researcherId: 1 },
            };

            prisma.question.findUnique.mockResolvedValue(mockQuestion);
            prisma.question.delete.mockResolvedValue(mockQuestion);

            const res = await request(app).delete("/api/questions/1");

            expect(res.status).toBe(204);
            expect(prisma.question.delete).toHaveBeenCalledWith({ where: { id: 1 } });
        });

        it("should return 404 for non-existent question", async () => {
            prisma.question.findUnique.mockResolvedValue(null);

            const res = await request(app).delete("/api/questions/999");

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Question not found");
        });

        it("should return 403 when user is not the post researcher", async () => {
            const mockQuestion = {
                id: 1,
                postId: 1,
                post: { id: 1, researcherId: 2 }, // Different researcher
            };

            prisma.question.findUnique.mockResolvedValue(mockQuestion);

            const res = await request(app).delete("/api/questions/1");

            expect(res.status).toBe(403);
            expect(res.body.error).toBe("Unauthorized");
        });

        it("should return 400 for invalid id", async () => {
            const res = await request(app).delete("/api/questions/invalid");

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid id");
        });
    });

    describe("Database Error Handling", () => {
        it("should handle database error during create", async () => {
            const questionData = {
                postId: 1,
                type: "SHORT_TEXT",
                body: "Question",
            };

            const mockPost = {
                id: 1,
                researcherId: 1,
            };

            prisma.post.findUnique.mockResolvedValue(mockPost);
            prisma.question.create.mockRejectedValue(new Error("Database error"));

            const res = await request(app)
                .post("/api/questions")
                .send(questionData);

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to create question");
        });

        it("should handle database error during get", async () => {
            prisma.question.findUnique.mockRejectedValue(new Error("Database error"));

            const res = await request(app).get("/api/questions/1");

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to fetch question");
        });

        it("should handle database error during getPostQuestions", async () => {
            prisma.question.findMany.mockRejectedValue(new Error("Database error"));

            const res = await request(app).get("/api/questions/post/1");

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to fetch questions");
        });

        it("should handle database error during update", async () => {
            const mockQuestion = {
                id: 1,
                post: { researcherId: 1 },
            };

            prisma.question.findUnique.mockResolvedValue(mockQuestion);
            prisma.question.update.mockRejectedValue(new Error("Database error"));

            const res = await request(app)
                .patch("/api/questions/1")
                .send({ body: "Updated" });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to update question");
        });

        it("should handle database error during delete", async () => {
            const mockQuestion = {
                id: 1,
                post: { researcherId: 1 },
            };

            prisma.question.findUnique.mockResolvedValue(mockQuestion);
            prisma.question.delete.mockRejectedValue(new Error("Database error"));

            const res = await request(app).delete("/api/questions/1");

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to delete question");
        });
    });

    describe("Critical Edge Cases", () => {
        it("should handle null post in update", async () => {
            const mockQuestion = {
                id: 1,
                postId: 1,
                post: null,
            };

            prisma.question.findUnique.mockResolvedValue(mockQuestion);

            const res = await request(app)
                .patch("/api/questions/1")
                .send({ body: "Updated" });

            expect(res.status).toBe(500);
        });

        it("should handle null post in delete", async () => {
            const mockQuestion = {
                id: 1,
                postId: 1,
                post: null,
            };

            prisma.question.findUnique.mockResolvedValue(mockQuestion);

            const res = await request(app).delete("/api/questions/1");

            expect(res.status).toBe(500);
        });

        it("should handle null researcherId in post", async () => {
            const questionData = {
                postId: 1,
                type: "SHORT_TEXT",
                body: "Question",
            };

            const mockPost = {
                id: 1,
                researcherId: null,
            };

            prisma.post.findUnique.mockResolvedValue(mockPost);

            const res = await request(app)
                .post("/api/questions")
                .send(questionData);

            expect(res.status).toBe(403);
            expect(res.body.error).toBe("Unauthorized");
        });
    });
});
