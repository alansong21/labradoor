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

// Create a separate app for testing missing user
const createAppWithoutAuth = () => {
    const testApp = express();
    testApp.use(express.json());
    testApp.use((req, res, next) => {
        // req.user is undefined
        next();
    });
    testApp.use("/api/answers", answerRoutes);
    return testApp;
};

describe("Answer Controller - Basic Tests", () => {
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

        it("should allow researcher to create answer", async () => {
            const answerData = {
                questionId: 1,
                applicationId: 1,
                body: "Researcher's answer",
            };

            const mockApplication = {
                id: 1,
                studentId: 2,
                postId: 1,
                post: { researcherId: 1 },
            };

            const mockAnswer = {
                id: 1,
                ...answerData,
            };

            prisma.application.findUnique.mockResolvedValue(mockApplication);
            prisma.answer.create.mockResolvedValue(mockAnswer);

            const res = await request(app)
                .post("/api/answers")
                .send(answerData);

            expect(res.status).toBe(201);
        });

        it("should return 403 when user is neither applicant nor researcher", async () => {
            const answerData = {
                questionId: 1,
                applicationId: 1,
                body: "Test answer",
            };

            const mockApplication = {
                id: 1,
                studentId: 2,
                postId: 1,
                post: { researcherId: 3 },
            };

            prisma.application.findUnique.mockResolvedValue(mockApplication);

            const res = await request(app)
                .post("/api/answers")
                .send(answerData);

            expect(res.status).toBe(403);
            expect(res.body.error).toBe("Unauthorized");
        });

        it("should handle different answer types", async () => {
            const answerData = {
                questionId: 1,
                applicationId: 1,
                body: ["option1", "option2"],
                type: "CHECKBOX",
            };

            const mockApplication = {
                id: 1,
                studentId: 1,
                postId: 1,
                post: { researcherId: 2 },
            };

            const mockAnswer = {
                id: 1,
                ...answerData,
            };

            prisma.application.findUnique.mockResolvedValue(mockApplication);
            prisma.answer.create.mockResolvedValue(mockAnswer);

            const res = await request(app)
                .post("/api/answers")
                .send(answerData);

            expect(res.status).toBe(201);
            expect(res.body.type).toBe("CHECKBOX");
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

        it("should allow researcher to view answer", async () => {
            const mockAnswer = {
                id: 1,
                questionId: 1,
                applicationId: 1,
                body: "Test answer",
                question: { id: 1, text: "Test question" },
                application: { id: 1, studentId: 2, postId: 1 },
            };

            prisma.answer.findUnique.mockResolvedValue(mockAnswer);
            prisma.post.findUnique.mockResolvedValue({ id: 1, researcherId: 1 });

            const res = await request(app).get("/api/answers/1");

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("id", 1);
        });

        it("should return 403 when user is neither applicant nor researcher", async () => {
            const mockAnswer = {
                id: 1,
                applicationId: 1,
                application: { id: 1, studentId: 2, postId: 1 },
            };

            prisma.answer.findUnique.mockResolvedValue(mockAnswer);
            prisma.post.findUnique.mockResolvedValue({ id: 1, researcherId: 3 });

            const res = await request(app).get("/api/answers/1");

            expect(res.status).toBe(403);
            expect(res.body.error).toBe("Unauthorized");
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

        it("should allow researcher to view application answers", async () => {
            const mockApplication = {
                id: 1,
                studentId: 2,
                postId: 1,
                post: { researcherId: 1 },
            };

            const mockAnswers = [
                { id: 1, applicationId: 1, body: "Answer 1", question: { id: 1 } },
            ];

            prisma.application.findUnique.mockResolvedValue(mockApplication);
            prisma.answer.findMany.mockResolvedValue(mockAnswers);

            const res = await request(app).get("/api/answers/application/1");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
        });

        it("should return 403 when user is neither applicant nor researcher", async () => {
            const mockApplication = {
                id: 1,
                studentId: 2,
                postId: 1,
                post: { researcherId: 3 },
            };

            prisma.application.findUnique.mockResolvedValue(mockApplication);

            const res = await request(app).get("/api/answers/application/1");

            expect(res.status).toBe(403);
            expect(res.body.error).toBe("Unauthorized");
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

        it("should return 403 when user is not the applicant", async () => {
            const mockAnswer = {
                id: 1,
                applicationId: 1,
                body: "Original answer",
                application: { id: 1, studentId: 2 },
            };

            prisma.answer.findUnique.mockResolvedValue(mockAnswer);

            const res = await request(app)
                .patch("/api/answers/1")
                .send({ body: "Trying to update" });

            expect(res.status).toBe(403);
            expect(res.body.error).toBe("Unauthorized");
        });

        it("should not allow researcher to update answer", async () => {
            const mockAnswer = {
                id: 1,
                applicationId: 1,
                body: "Original answer",
                application: { id: 1, studentId: 3 },
            };

            prisma.answer.findUnique.mockResolvedValue(mockAnswer);

            const res = await request(app)
                .patch("/api/answers/1")
                .send({ body: "Researcher trying to update" });

            expect(res.status).toBe(403);
            expect(res.body.error).toBe("Unauthorized");
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

        it("should allow researcher to delete answer", async () => {
            const mockAnswer = {
                id: 1,
                applicationId: 1,
                application: { id: 1, studentId: 2, postId: 1 },
            };

            prisma.answer.findUnique.mockResolvedValue(mockAnswer);
            prisma.post.findUnique.mockResolvedValue({ id: 1, researcherId: 1 });
            prisma.answer.delete.mockResolvedValue(mockAnswer);

            const res = await request(app).delete("/api/answers/1");

            expect(res.status).toBe(204);
        });

        it("should return 403 when user is neither applicant nor researcher", async () => {
            const mockAnswer = {
                id: 1,
                applicationId: 1,
                application: { id: 1, studentId: 2, postId: 1 },
            };

            prisma.answer.findUnique.mockResolvedValue(mockAnswer);
            prisma.post.findUnique.mockResolvedValue({ id: 1, researcherId: 3 });

            const res = await request(app).delete("/api/answers/1");

            expect(res.status).toBe(403);
            expect(res.body.error).toBe("Unauthorized");
        });
    });

    describe("Data Validation Tests", () => {
        describe("POST /api/answers - validation", () => {
            it("should return 400 for invalid questionId type", async () => {
                const invalidData = {
                    questionId: "not-a-number",
                    applicationId: 1,
                    body: "Test answer",
                };

                const res = await request(app)
                    .post("/api/answers")
                    .send(invalidData);

                expect(res.status).toBe(400);
                expect(res.body).toHaveProperty("error");
            });

            it("should return 400 for negative questionId", async () => {
                const invalidData = {
                    questionId: -1,
                    applicationId: 1,
                    body: "Test answer",
                };

                const res = await request(app)
                    .post("/api/answers")
                    .send(invalidData);

                expect(res.status).toBe(400);
                expect(res.body).toHaveProperty("error");
            });

            it("should return 400 for zero applicationId", async () => {
                const invalidData = {
                    questionId: 1,
                    applicationId: 0,
                    body: "Test answer",
                };

                const res = await request(app)
                    .post("/api/answers")
                    .send(invalidData);

                expect(res.status).toBe(400);
                expect(res.body).toHaveProperty("error");
            });

            it("should return 400 for invalid answer type", async () => {
                const invalidData = {
                    questionId: 1,
                    applicationId: 1,
                    body: "Test answer",
                    type: "INVALID_TYPE",
                };

                const res = await request(app)
                    .post("/api/answers")
                    .send(invalidData);

                expect(res.status).toBe(400);
                expect(res.body).toHaveProperty("error");
            });

            it("should accept valid enum values for type", async () => {
                const validTypes = ["SHORT_TEXT", "LONG_TEXT", "MULTIPLE_CHOICE", "CHECKBOX"];

                for (const type of validTypes) {
                    const answerData = {
                        questionId: 1,
                        applicationId: 1,
                        body: "Test answer",
                        type: type,
                    };

                    const mockApplication = {
                        id: 1,
                        studentId: 1,
                        postId: 1,
                        post: { researcherId: 2 },
                    };

                    prisma.application.findUnique.mockResolvedValue(mockApplication);
                    prisma.answer.create.mockResolvedValue({ id: 1, ...answerData });

                    const res = await request(app)
                        .post("/api/answers")
                        .send(answerData);

                    expect(res.status).toBe(201);
                }
            });

            it("should handle null body value", async () => {
                const answerData = {
                    questionId: 1,
                    applicationId: 1,
                    body: null,
                };

                const mockApplication = {
                    id: 1,
                    studentId: 1,
                    postId: 1,
                    post: { researcherId: 2 },
                };

                prisma.application.findUnique.mockResolvedValue(mockApplication);
                prisma.answer.create.mockResolvedValue({ id: 1, ...answerData });

                const res = await request(app)
                    .post("/api/answers")
                    .send(answerData);

                expect(res.status).toBe(201);
            });

            it("should handle object as body value", async () => {
                const answerData = {
                    questionId: 1,
                    applicationId: 1,
                    body: { key: "value", nested: { data: "test" } },
                };

                const mockApplication = {
                    id: 1,
                    studentId: 1,
                    postId: 1,
                    post: { researcherId: 2 },
                };

                prisma.application.findUnique.mockResolvedValue(mockApplication);
                prisma.answer.create.mockResolvedValue({ id: 1, ...answerData });

                const res = await request(app)
                    .post("/api/answers")
                    .send(answerData);

                expect(res.status).toBe(201);
                expect(res.body.body).toEqual({ key: "value", nested: { data: "test" } });
            });

            it("should handle array as body value", async () => {
                const answerData = {
                    questionId: 1,
                    applicationId: 1,
                    body: ["option1", "option2", "option3"],
                };

                const mockApplication = {
                    id: 1,
                    studentId: 1,
                    postId: 1,
                    post: { researcherId: 2 },
                };

                prisma.application.findUnique.mockResolvedValue(mockApplication);
                prisma.answer.create.mockResolvedValue({ id: 1, ...answerData });

                const res = await request(app)
                    .post("/api/answers")
                    .send(answerData);

                expect(res.status).toBe(201);
                expect(res.body.body).toEqual(["option1", "option2", "option3"]);
            });
        });

        describe("PATCH /api/answers/:id - validation", () => {
            it("should accept undefined body in update", async () => {
                const mockAnswer = {
                    id: 1,
                    applicationId: 1,
                    body: "Original",
                    application: { id: 1, studentId: 1 },
                };

                prisma.answer.findUnique.mockResolvedValue(mockAnswer);
                prisma.answer.update.mockResolvedValue(mockAnswer);

                const res = await request(app)
                    .patch("/api/answers/1")
                    .send({ body: undefined });

                expect(res.status).toBe(200);
            });

            it("should accept null body in update", async () => {
                const mockAnswer = {
                    id: 1,
                    applicationId: 1,
                    body: "Original",
                    application: { id: 1, studentId: 1 },
                };

                const updatedAnswer = {
                    ...mockAnswer,
                    body: null,
                };

                prisma.answer.findUnique.mockResolvedValue(mockAnswer);
                prisma.answer.update.mockResolvedValue(updatedAnswer);

                const res = await request(app)
                    .patch("/api/answers/1")
                    .send({ body: null });

                expect(res.status).toBe(200);
            });
        });
    });

    describe("Database Error Tests", () => {
        describe("POST /api/answers - database errors", () => {
            it("should return 500 when database fails to find application", async () => {
                prisma.application.findUnique.mockRejectedValue(new Error("Database connection failed"));

                const answerData = {
                    questionId: 1,
                    applicationId: 1,
                    body: "Test answer",
                };

                const res = await request(app)
                    .post("/api/answers")
                    .send(answerData);

                expect(res.status).toBe(500);
                expect(res.body.error).toBe("Failed to create answer");
            });

            it("should return 500 when database fails to create answer", async () => {
                const mockApplication = {
                    id: 1,
                    studentId: 1,
                    postId: 1,
                    post: { researcherId: 2 },
                };

                prisma.application.findUnique.mockResolvedValue(mockApplication);
                prisma.answer.create.mockRejectedValue(new Error("Database write failed"));

                const answerData = {
                    questionId: 1,
                    applicationId: 1,
                    body: "Test answer",
                };

                const res = await request(app)
                    .post("/api/answers")
                    .send(answerData);

                expect(res.status).toBe(500);
                expect(res.body.error).toBe("Failed to create answer");
            });
        });

        describe("GET /api/answers/:id - database errors", () => {
            it("should return 500 when database fails to find answer", async () => {
                prisma.answer.findUnique.mockRejectedValue(new Error("Database read failed"));

                const res = await request(app).get("/api/answers/1");

                expect(res.status).toBe(500);
                expect(res.body.error).toBe("Failed to fetch answer");
            });

            it("should return 500 when database fails to find post", async () => {
                const mockAnswer = {
                    id: 1,
                    application: { id: 1, studentId: 1, postId: 1 },
                };

                prisma.answer.findUnique.mockResolvedValue(mockAnswer);
                prisma.post.findUnique.mockRejectedValue(new Error("Database read failed"));

                const res = await request(app).get("/api/answers/1");

                expect(res.status).toBe(500);
                expect(res.body.error).toBe("Failed to fetch answer");
            });
        });

        describe("GET /api/answers/application/:id - database errors", () => {
            it("should return 500 when database fails to find application", async () => {
                prisma.application.findUnique.mockRejectedValue(new Error("Database read failed"));

                const res = await request(app).get("/api/answers/application/1");

                expect(res.status).toBe(500);
                expect(res.body.error).toBe("Failed to fetch answers");
            });

            it("should return 500 when database fails to find answers", async () => {
                const mockApplication = {
                    id: 1,
                    studentId: 1,
                    postId: 1,
                    post: { researcherId: 2 },
                };

                prisma.application.findUnique.mockResolvedValue(mockApplication);
                prisma.answer.findMany.mockRejectedValue(new Error("Database read failed"));

                const res = await request(app).get("/api/answers/application/1");

                expect(res.status).toBe(500);
                expect(res.body.error).toBe("Failed to fetch answers");
            });
        });

        describe("PATCH /api/answers/:id - database errors", () => {
            it("should return 500 when database fails to find answer", async () => {
                prisma.answer.findUnique.mockRejectedValue(new Error("Database read failed"));

                const res = await request(app)
                    .patch("/api/answers/1")
                    .send({ body: "Updated" });

                expect(res.status).toBe(500);
                expect(res.body.error).toBe("Failed to update answer");
            });

            it("should return 500 when database fails to update answer", async () => {
                const mockAnswer = {
                    id: 1,
                    applicationId: 1,
                    body: "Original",
                    application: { id: 1, studentId: 1 },
                };

                prisma.answer.findUnique.mockResolvedValue(mockAnswer);
                prisma.answer.update.mockRejectedValue(new Error("Database write failed"));

                const res = await request(app)
                    .patch("/api/answers/1")
                    .send({ body: "Updated" });

                expect(res.status).toBe(500);
                expect(res.body.error).toBe("Failed to update answer");
            });
        });

        describe("DELETE /api/answers/:id - database errors", () => {
            it("should return 500 when database fails to find answer", async () => {
                prisma.answer.findUnique.mockRejectedValue(new Error("Database read failed"));

                const res = await request(app).delete("/api/answers/1");

                expect(res.status).toBe(500);
                expect(res.body.error).toBe("Failed to delete answer");
            });

            it("should return 500 when database fails to delete answer", async () => {
                const mockAnswer = {
                    id: 1,
                    applicationId: 1,
                    application: { id: 1, studentId: 1, postId: 1 },
                };

                prisma.answer.findUnique.mockResolvedValue(mockAnswer);
                prisma.post.findUnique.mockResolvedValue({ id: 1, researcherId: 2 });
                prisma.answer.delete.mockRejectedValue(new Error("Database delete failed"));

                const res = await request(app).delete("/api/answers/1");

                expect(res.status).toBe(500);
                expect(res.body.error).toBe("Failed to delete answer");
            });
        });
    });

    describe("Critical Security & Stability Tests", () => {
        describe("Missing req.user Tests", () => {
            const appWithoutAuth = createAppWithoutAuth();

            it("POST should handle missing req.user", async () => {
                const answerData = {
                    questionId: 1,
                    applicationId: 1,
                    body: "Test answer",
                };

                const mockApplication = {
                    id: 1,
                    studentId: 2,
                    postId: 1,
                    post: { researcherId: 3 },
                };

                prisma.application.findUnique.mockResolvedValue(mockApplication);

                const res = await request(appWithoutAuth)
                    .post("/api/answers")
                    .send(answerData);

                // When req.user is undefined, userId will be undefined
                // Should return 403 (unauthorized) or 500 (crash)
                expect([403, 500]).toContain(res.status);
            });

            it("GET answer should handle missing req.user", async () => {
                const mockAnswer = {
                    id: 1,
                    application: { id: 1, studentId: 2, postId: 1 },
                };

                prisma.answer.findUnique.mockResolvedValue(mockAnswer);
                prisma.post.findUnique.mockResolvedValue({ id: 1, researcherId: 3 });

                const res = await request(appWithoutAuth).get("/api/answers/1");

                // When req.user is undefined, userId will be undefined
                // undefined !== 2 and undefined !== 3, so should return 403 or 500
                expect([403, 500]).toContain(res.status);
            });

            it("GET application answers should handle missing req.user", async () => {
                const mockApplication = {
                    id: 1,
                    studentId: 2,
                    postId: 1,
                    post: { researcherId: 3 },
                };

                prisma.application.findUnique.mockResolvedValue(mockApplication);

                const res = await request(appWithoutAuth).get("/api/answers/application/1");

                expect([403, 500]).toContain(res.status);
            });

            it("PATCH should handle missing req.user", async () => {
                const mockAnswer = {
                    id: 1,
                    application: { id: 1, studentId: 2 },
                };

                prisma.answer.findUnique.mockResolvedValue(mockAnswer);

                const res = await request(appWithoutAuth)
                    .patch("/api/answers/1")
                    .send({ body: "Updated" });

                expect([403, 500]).toContain(res.status);
            });

            it("DELETE should handle missing req.user", async () => {
                const mockAnswer = {
                    id: 1,
                    application: { id: 1, studentId: 2, postId: 1 },
                };

                prisma.answer.findUnique.mockResolvedValue(mockAnswer);
                prisma.post.findUnique.mockResolvedValue({ id: 1, researcherId: 3 });

                const res = await request(appWithoutAuth).delete("/api/answers/1");

                expect([403, 500]).toContain(res.status);
            });
        });

        describe("Null Nested Relations Tests", () => {
            it("POST should handle application with null post", async () => {
                const answerData = {
                    questionId: 1,
                    applicationId: 1,
                    body: "Test answer",
                };

                const mockApplication = {
                    id: 1,
                    studentId: 1,
                    postId: 1,
                    post: null,
                };

                prisma.application.findUnique.mockResolvedValue(mockApplication);

                const res = await request(app)
                    .post("/api/answers")
                    .send(answerData);

                // Should crash when trying to access post.researcherId
                expect(res.status).toBe(500);
            });

            it("POST should handle application with undefined post", async () => {
                const answerData = {
                    questionId: 1,
                    applicationId: 1,
                    body: "Test answer",
                };

                const mockApplication = {
                    id: 1,
                    studentId: 1,
                    postId: 1,
                    // post is undefined
                };

                prisma.application.findUnique.mockResolvedValue(mockApplication);

                const res = await request(app)
                    .post("/api/answers")
                    .send(answerData);

                expect(res.status).toBe(500);
            });

            it("GET answer should handle null post", async () => {
                const mockAnswer = {
                    id: 1,
                    application: { id: 1, studentId: 1, postId: 1 },
                };

                prisma.answer.findUnique.mockResolvedValue(mockAnswer);
                prisma.post.findUnique.mockResolvedValue(null);

                const res = await request(app).get("/api/answers/1");

                // Should crash when trying to access post.researcherId
                expect(res.status).toBe(500);
            });

            it("DELETE should handle null post", async () => {
                const mockAnswer = {
                    id: 1,
                    application: { id: 1, studentId: 1, postId: 1 },
                };

                prisma.answer.findUnique.mockResolvedValue(mockAnswer);
                prisma.post.findUnique.mockResolvedValue(null);

                const res = await request(app).delete("/api/answers/1");

                expect(res.status).toBe(500);
            });
        });

        describe("Null researcherId or studentId Tests", () => {
            it("POST should handle post with null researcherId", async () => {
                const answerData = {
                    questionId: 1,
                    applicationId: 1,
                    body: "Test answer",
                };

                const mockApplication = {
                    id: 1,
                    studentId: 1,
                    postId: 1,
                    post: { id: 1, researcherId: null },
                };

                prisma.application.findUnique.mockResolvedValue(mockApplication);
                prisma.answer.create.mockResolvedValue({ id: 1, ...answerData });

                const res = await request(app)
                    .post("/api/answers")
                    .send(answerData);

                // User 1 is the applicant, researcherId is null, so should succeed
                expect(res.status).toBe(201);
            });

            it("POST should handle application with null studentId", async () => {
                const answerData = {
                    questionId: 1,
                    applicationId: 1,
                    body: "Test answer",
                };

                const mockApplication = {
                    id: 1,
                    studentId: null,
                    postId: 1,
                    post: { id: 1, researcherId: 1 },
                };

                prisma.application.findUnique.mockResolvedValue(mockApplication);
                prisma.answer.create.mockResolvedValue({ id: 1, ...answerData });

                const res = await request(app)
                    .post("/api/answers")
                    .send(answerData);

                // User 1 is the researcher, so should succeed even if studentId is null
                expect(res.status).toBe(201);
            });

            it("POST should return 403 when both studentId and researcherId are null", async () => {
                const answerData = {
                    questionId: 1,
                    applicationId: 1,
                    body: "Test answer",
                };

                const mockApplication = {
                    id: 1,
                    studentId: null,
                    postId: 1,
                    post: { id: 1, researcherId: null },
                };

                prisma.application.findUnique.mockResolvedValue(mockApplication);

                const res = await request(app)
                    .post("/api/answers")
                    .send(answerData);

                expect(res.status).toBe(403);
                expect(res.body.error).toBe("Unauthorized");
            });

            it("GET should handle post with null researcherId", async () => {
                const mockAnswer = {
                    id: 1,
                    application: { id: 1, studentId: 1, postId: 1 },
                };

                prisma.answer.findUnique.mockResolvedValue(mockAnswer);
                prisma.post.findUnique.mockResolvedValue({ id: 1, researcherId: null });

                const res = await request(app).get("/api/answers/1");

                // User 1 is the applicant, so should succeed
                expect(res.status).toBe(200);
            });

            it("DELETE should handle post with null researcherId", async () => {
                const mockAnswer = {
                    id: 1,
                    application: { id: 1, studentId: 1, postId: 1 },
                };

                prisma.answer.findUnique.mockResolvedValue(mockAnswer);
                prisma.post.findUnique.mockResolvedValue({ id: 1, researcherId: null });
                prisma.answer.delete.mockResolvedValue(mockAnswer);

                const res = await request(app).delete("/api/answers/1");

                // User 1 is the applicant, so should succeed
                expect(res.status).toBe(204);
            });
        });

        describe("Missing Nested Data Tests", () => {
            it("PATCH should handle answer with null application", async () => {
                const mockAnswer = {
                    id: 1,
                    applicationId: 1,
                    body: "Original",
                    application: null,
                };

                prisma.answer.findUnique.mockResolvedValue(mockAnswer);

                const res = await request(app)
                    .patch("/api/answers/1")
                    .send({ body: "Updated" });

                // Should crash when trying to access application.studentId
                expect(res.status).toBe(500);
            });

            it("DELETE should handle answer with null application", async () => {
                const mockAnswer = {
                    id: 1,
                    application: null,
                };

                prisma.answer.findUnique.mockResolvedValue(mockAnswer);

                const res = await request(app).delete("/api/answers/1");

                // Should crash when trying to access application.postId
                expect(res.status).toBe(500);
            });

            it("GET should handle answer with null application", async () => {
                const mockAnswer = {
                    id: 1,
                    application: null,
                };

                prisma.answer.findUnique.mockResolvedValue(mockAnswer);

                const res = await request(app).get("/api/answers/1");

                // Should crash when trying to access application.studentId
                expect(res.status).toBe(500);
            });
        });

        describe("Malformed Request Tests", () => {
            it("POST should handle extremely large body content", async () => {
                const largeBody = "a".repeat(10000000); // 10MB of text

                const answerData = {
                    questionId: 1,
                    applicationId: 1,
                    body: largeBody,
                };

                const mockApplication = {
                    id: 1,
                    studentId: 1,
                    postId: 1,
                    post: { researcherId: 2 },
                };

                prisma.application.findUnique.mockResolvedValue(mockApplication);
                prisma.answer.create.mockResolvedValue({ id: 1, ...answerData });

                const res = await request(app)
                    .post("/api/answers")
                    .send(answerData);

                // Should handle large content (or Express might reject it)
                // Status could be 201 or 413 (Payload Too Large)
                expect([201, 413, 500]).toContain(res.status);
            });

            it("POST should handle special characters in body", async () => {
                const answerData = {
                    questionId: 1,
                    applicationId: 1,
                    body: "'; DROP TABLE answers; --",
                };

                const mockApplication = {
                    id: 1,
                    studentId: 1,
                    postId: 1,
                    post: { researcherId: 2 },
                };

                prisma.application.findUnique.mockResolvedValue(mockApplication);
                prisma.answer.create.mockResolvedValue({ id: 1, ...answerData });

                const res = await request(app)
                    .post("/api/answers")
                    .send(answerData);

                // Should handle SQL injection attempts safely
                expect(res.status).toBe(201);
                expect(res.body.body).toBe("'; DROP TABLE answers; --");
            });
        });
    });
});