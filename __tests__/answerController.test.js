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
    },
    application: {
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
            prisma.post = { findUnique: jest.fn().mockResolvedValue({ id: 1, researcherId: 2 }) };

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
    });
});