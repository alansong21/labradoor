const request = require("supertest");
const express = require("express");
const answerRoutes = require("../server/routes/answers");
const prisma = require("../server/db/prisma");

// Mock the auth middleware
jest.mock("../server/middleware/auth", () => ({
    authMiddleware: (req, res, next) => {
        req.user = { id: 1 };
        next();
    },
}));

// Mock the prisma client
jest.mock("../server/db/prisma", () => ({
    answer: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    application: {
        findUnique: jest.fn(),
    },
    post: {
        findUnique: jest.fn(),
    },
}));

// Create Express app for testing
const app = express();
app.use(express.json());
app.use("/api/answers", answerRoutes);

describe("Answer Controller Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("POST /api/answers - createAnswer", () => {
        it("should create an answer successfully", async () => {
            const answerData = {
                questionId: 1,
                applicationId: 1,
                body: "Test answer",
            };

            const mockApplication = {
                id: 1,
                studentId: 1,
                postId: 1,
                post: { researcherId: 2 },
            };

            const mockAnswer = {
                id: 1,
                questionId: 1,
                applicationId: 1,
                body: "Test answer",
            };

            prisma.application.findUnique.mockResolvedValue(mockApplication);
            prisma.answer.create.mockResolvedValue(mockAnswer);

            const res = await request(app)
                .post("/api/answers")
                .send(answerData);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty("id");
            expect(res.body.body).toBe("Test answer");
        });

        it("should return 400 for missing required fields", async () => {
            const invalidData = {
                questionId: 1,
                // missing applicationId
            };

            const res = await request(app)
                .post("/api/answers")
                .send(invalidData);

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("error");
        });
    });

    describe("GET /api/answers/:id - getAnswer", () => {
        it("should get an answer by id", async () => {
            const mockAnswer = {
                id: 1,
                questionId: 1,
                applicationId: 1,
                body: "Test answer",
                question: { id: 1, text: "Test question" },
                application: { id: 1, studentId: 1, postId: 1 },
            };

            prisma.answer.findUnique.mockResolvedValue(mockAnswer);
            prisma.post.findUnique.mockResolvedValue({ id: 1, researcherId: 2 });

            const res = await request(app).get("/api/answers/1");

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("id", 1);
            expect(res.body.body).toBe("Test answer");
        });

        it("should return 404 for non-existent answer", async () => {
            prisma.answer.findUnique.mockResolvedValue(null);

            const res = await request(app).get("/api/answers/999");

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Answer not found");
        });

        it("should return 400 for invalid id format", async () => {
            const res = await request(app).get("/api/answers/invalid");

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid id");
        });
    });

    describe("GET /api/answers/application/:id - getApplicationAnswers", () => {
        it("should get all answers for an application", async () => {
            const mockApplication = {
                id: 1,
                studentId: 1,
                postId: 1,
                post: { researcherId: 2 },
            };

            const mockAnswers = [
                { id: 1, applicationId: 1, body: "Answer 1", question: { id: 1 } },
                { id: 2, applicationId: 1, body: "Answer 2", question: { id: 2 } },
            ];

            prisma.application.findUnique.mockResolvedValue(mockApplication);
            prisma.answer.findMany.mockResolvedValue(mockAnswers);

            const res = await request(app).get("/api/answers/application/1");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0].body).toBe("Answer 1");
            expect(res.body[1].body).toBe("Answer 2");
        });

        it("should return empty array when no answers exist", async () => {
            const mockApplication = {
                id: 1,
                studentId: 1,
                postId: 1,
                post: { researcherId: 2 },
            };

            prisma.application.findUnique.mockResolvedValue(mockApplication);
            prisma.answer.findMany.mockResolvedValue([]);

            const res = await request(app).get("/api/answers/application/1");

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        it("should return 404 for non-existent application", async () => {
            prisma.application.findUnique.mockResolvedValue(null);

            const res = await request(app).get("/api/answers/application/999");

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Application not found");
        });
    });

    describe("PATCH /api/answers/:id - updateAnswer", () => {
        it("should update an answer successfully", async () => {
            const mockAnswer = {
                id: 1,
                applicationId: 1,
                body: "Old answer",
                application: { id: 1, studentId: 1 },
            };

            const updatedAnswer = {
                ...mockAnswer,
                body: "Updated answer",
            };

            prisma.answer.findUnique.mockResolvedValue(mockAnswer);
            prisma.answer.update.mockResolvedValue(updatedAnswer);

            const res = await request(app)
                .patch("/api/answers/1")
                .send({ body: "Updated answer" });

            expect(res.status).toBe(200);
            expect(res.body.body).toBe("Updated answer");
            expect(prisma.answer.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { body: "Updated answer" },
            });
        });

        it("should return 404 for non-existent answer", async () => {
            prisma.answer.findUnique.mockResolvedValue(null);

            const res = await request(app)
                .patch("/api/answers/999")
                .send({ body: "Updated answer" });

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Answer not found");
        });

        it("should allow updating with empty body", async () => {
            const mockAnswer = {
                id: 1,
                applicationId: 1,
                body: "Original answer",
                application: { id: 1, studentId: 1 },
            };

            prisma.answer.findUnique.mockResolvedValue(mockAnswer);
            prisma.answer.update.mockResolvedValue(mockAnswer);

            const res = await request(app)
                .patch("/api/answers/1")
                .send({});

            expect(res.status).toBe(200);
        });
    });

    describe("DELETE /api/answers/:id - deleteAnswer", () => {
        it("should delete an answer successfully", async () => {
            const mockAnswer = {
                id: 1,
                applicationId: 1,
                application: { id: 1, studentId: 1, postId: 1 },
            };

            prisma.answer.findUnique.mockResolvedValue(mockAnswer);
            prisma.post.findUnique.mockResolvedValue({ id: 1, researcherId: 2 });
            prisma.answer.delete.mockResolvedValue(mockAnswer);

            const res = await request(app).delete("/api/answers/1");

            expect(res.status).toBe(204);
            expect(prisma.answer.delete).toHaveBeenCalledWith({ where: { id: 1 } });
        });

        it("should return 404 for non-existent answer", async () => {
            prisma.answer.findUnique.mockResolvedValue(null);

            const res = await request(app).delete("/api/answers/999");

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Answer not found");
        });

        it("should return 400 for invalid id format", async () => {
            const res = await request(app).delete("/api/answers/invalid");

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid id");
        });
    });
});