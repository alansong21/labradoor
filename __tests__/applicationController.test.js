const request = require("supertest");
const express = require("express");
const applicationRoutes = require("../server/routes/applications");
const prisma = require("../server/db/prisma");

jest.mock("../server/middleware/auth", () => ({
    authMiddleware: (req, _res, next) => {
        req.user = req.mockUser || { id: 1 };
        next();
    },
    requireRole: () => (_req, _res, next) => next(),
}));

jest.mock("../server/db/prisma", () => ({
    post: {
        findUnique: jest.fn(),
    },
    student: {
        findUnique: jest.fn(),
    },
    application: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    question: {
        findMany: jest.fn(),
    },
    answer: {
        create: jest.fn(),
        deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
}));

const app = express();
app.use(express.json());

let currentUser = { id: 1 };
app.use((req, _res, next) => {
    req.mockUser = currentUser;
    next();
});

app.use("/api/applications", applicationRoutes);

describe("Application Controller Tests", () => {
    let consoleErrorSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        currentUser = { id: 1 };
        prisma.$transaction.mockImplementation(async callback => callback(prisma));
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    describe("POST /api/applications", () => {
        it("creates an application and normalizes responses", async () => {
            prisma.post.findUnique.mockResolvedValue({ id: 1 });
            prisma.student.findUnique.mockResolvedValue({ userId: 1 });
            prisma.application.findFirst.mockResolvedValue(null);
            prisma.question.findMany.mockResolvedValue([
                { id: 10, type: "CHECKBOX", body: { options: ["AI", "ML"] } },
                { id: 11, type: "LONG_TEXT", body: {} },
            ]);
            prisma.application.create.mockResolvedValue({ id: 99 });
            prisma.answer.create.mockResolvedValue({});
            prisma.application.findUnique.mockResolvedValue({
                id: 99,
                answers: [],
            });

            const res = await request(app)
                .post("/api/applications")
                .send({
                    postId: 1,
                    responses: [
                        { questionId: 10, answer: "AI" },
                        { questionId: 11, answer: "I love research" },
                    ],
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty("id", 99);
            expect(prisma.answer.create).toHaveBeenCalledTimes(2);
            expect(prisma.answer.create.mock.calls[0][0]).toMatchObject({
                data: {
                    applicationId: 99,
                    questionId: 10,
                    type: "CHECKBOX",
                    body: { value: ["AI"] },
                },
            });
        });

        it("requires the student profile to exist", async () => {
            prisma.post.findUnique.mockResolvedValue({ id: 1 });
            prisma.student.findUnique.mockResolvedValue(null);

            const res = await request(app)
                .post("/api/applications")
                .send({ postId: 1 });

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/Complete your student profile/i);
        });

        it("prevents duplicate applications", async () => {
            prisma.post.findUnique.mockResolvedValue({ id: 1 });
            prisma.student.findUnique.mockResolvedValue({ userId: 1 });
            prisma.application.findFirst.mockResolvedValue({ id: 5 });

            const res = await request(app)
                .post("/api/applications")
                .send({ postId: 1 });

            expect(res.status).toBe(409);
        });

        it("rejects responses for unknown questions", async () => {
            prisma.post.findUnique.mockResolvedValue({ id: 1 });
            prisma.student.findUnique.mockResolvedValue({ userId: 1 });
            prisma.application.findFirst.mockResolvedValue(null);
            prisma.question.findMany.mockResolvedValue([]);

            const res = await request(app)
                .post("/api/applications")
                .send({
                    postId: 1,
                    responses: [{ questionId: 10, answer: "AI" }],
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/Invalid question response/);
        });

        it("validates multiple choice answers", async () => {
            prisma.post.findUnique.mockResolvedValue({ id: 1 });
            prisma.student.findUnique.mockResolvedValue({ userId: 1 });
            prisma.application.findFirst.mockResolvedValue(null);
            prisma.question.findMany.mockResolvedValue([
                { id: 10, type: "MULTIPLE_CHOICE", body: { options: ["A", "B"] } },
            ]);

            const res = await request(app)
                .post("/api/applications")
                .send({
                    postId: 1,
                    responses: [{ questionId: 10, answer: "C" }],
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/Invalid answer for multiple choice/);
        });
    });

    describe("GET /api/applications/post/:postId", () => {
        it("allows the owning researcher to view applications", async () => {
            currentUser = { id: 7 };
            prisma.post.findUnique.mockResolvedValue({ id: 1, researcherId: 7 });
            prisma.application.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

            const res = await request(app).get("/api/applications/post/1");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
        });

        it("returns 404 when the post does not exist", async () => {
            prisma.post.findUnique.mockResolvedValue(null);

            const res = await request(app).get("/api/applications/post/1");

            expect(res.status).toBe(404);
        });

        it("prevents other researchers from viewing applications", async () => {
            currentUser = { id: 2 };
            prisma.post.findUnique.mockResolvedValue({ id: 1, researcherId: 99 });

            const res = await request(app).get("/api/applications/post/1");

            expect(res.status).toBe(403);
        });

        it("handles database errors", async () => {
            prisma.post.findUnique.mockRejectedValue(new Error("DB down"));

            const res = await request(app).get("/api/applications/post/1");

            expect(res.status).toBe(500);
        });
    });

    describe("GET /api/applications/my-applications", () => {
        it("returns the student's applications", async () => {
            prisma.application.findMany.mockResolvedValue([{ id: 1 }]);

            const res = await request(app).get("/api/applications/my-applications");

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(1);
        });

        it("returns 204 when there are no applications", async () => {
            prisma.application.findMany.mockResolvedValue([]);

            const res = await request(app).get("/api/applications/my-applications");

            expect(res.status).toBe(204);
        });

        it("handles database errors", async () => {
            prisma.application.findMany.mockRejectedValue(new Error("DB error"));

            const res = await request(app).get("/api/applications/my-applications");

            expect(res.status).toBe(500);
        });
    });

    describe("GET /api/applications/:id", () => {
        it("allows the student applicant to view the record", async () => {
            prisma.application.findUnique.mockResolvedValue({
                id: 1,
                postId: 2,
                studentId: 1,
            });
            prisma.post.findUnique.mockResolvedValue({ id: 2, researcherId: 5 });

            const res = await request(app).get("/api/applications/1");

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("id", 1);
        });

        it("allows the owning researcher to view the record", async () => {
            currentUser = { id: 5 };
            prisma.application.findUnique.mockResolvedValue({
                id: 1,
                postId: 2,
                studentId: 1,
            });
            prisma.post.findUnique.mockResolvedValue({ id: 2, researcherId: 5 });

            const res = await request(app).get("/api/applications/1");

            expect(res.status).toBe(200);
        });

        it("returns 404 when the application does not exist", async () => {
            prisma.application.findUnique.mockResolvedValue(null);

            const res = await request(app).get("/api/applications/1");

            expect(res.status).toBe(404);
        });

        it("returns 403 for unauthorized users", async () => {
            currentUser = { id: 77 };
            prisma.application.findUnique.mockResolvedValue({
                id: 1,
                postId: 2,
                studentId: 1,
            });
            prisma.post.findUnique.mockResolvedValue({ id: 2, researcherId: 88 });

            const res = await request(app).get("/api/applications/1");

            expect(res.status).toBe(403);
        });

        it("validates the id parameter", async () => {
            const res = await request(app).get("/api/applications/invalid");

            expect(res.status).toBe(400);
        });

        it("handles database errors while fetching", async () => {
            prisma.application.findUnique.mockRejectedValue(new Error("DB error"));

            const res = await request(app).get("/api/applications/1");

            expect(res.status).toBe(500);
        });
    });

    describe("PATCH /api/applications/:id", () => {
        it("allows the researcher to update status", async () => {
            currentUser = { id: 5 };
            prisma.application.findUnique.mockResolvedValue({
                id: 1,
                post: { researcherId: 5 },
            });
            prisma.application.update.mockResolvedValue({ id: 1, status: "ACCEPTED" });

            const res = await request(app)
                .patch("/api/applications/1")
                .send({ status: "ACCEPTED" });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("status", "ACCEPTED");
        });

        it("validates the id parameter", async () => {
            const res = await request(app)
                .patch("/api/applications/invalid")
                .send({ status: "ACCEPTED" });

            expect(res.status).toBe(400);
        });

        it("validates status input", async () => {
            const res = await request(app)
                .patch("/api/applications/1")
                .send({ status: "UNKNOWN" });

            expect(res.status).toBe(400);
        });

        it("returns 404 for missing applications", async () => {
            prisma.application.findUnique.mockResolvedValue(null);

            const res = await request(app)
                .patch("/api/applications/1")
                .send({ status: "ACCEPTED" });

            expect(res.status).toBe(404);
        });

        it("prevents unauthorized researchers", async () => {
            currentUser = { id: 1 };
            prisma.application.findUnique.mockResolvedValue({
                id: 1,
                post: { researcherId: 55 },
            });

            const res = await request(app)
                .patch("/api/applications/1")
                .send({ status: "ACCEPTED" });

            expect(res.status).toBe(403);
        });

        it("handles errors during update", async () => {
            currentUser = { id: 5 };
            prisma.application.findUnique.mockResolvedValue({
                id: 1,
                post: { researcherId: 5 },
            });
            prisma.application.update.mockRejectedValue(new Error("DB error"));

            const res = await request(app)
                .patch("/api/applications/1")
                .send({ status: "ACCEPTED" });

            expect(res.status).toBe(500);
        });
    });

    describe("DELETE /api/applications/:id", () => {
        it("allows the student to delete their application", async () => {
            prisma.application.findUnique.mockResolvedValue({
                id: 1,
                studentId: 1,
            });
            prisma.application.delete.mockResolvedValue({});

            const res = await request(app).delete("/api/applications/1");

            expect(res.status).toBe(204);
        });

        it("validates the id parameter", async () => {
            const res = await request(app).delete("/api/applications/invalid");

            expect(res.status).toBe(400);
        });

        it("returns 404 when the application does not exist", async () => {
            prisma.application.findUnique.mockResolvedValue(null);

            const res = await request(app).delete("/api/applications/1");

            expect(res.status).toBe(404);
        });

        it("prevents other students from deleting the record", async () => {
            prisma.application.findUnique.mockResolvedValue({
                id: 1,
                studentId: 99,
            });

            const res = await request(app).delete("/api/applications/1");

            expect(res.status).toBe(403);
        });

        it("handles delete errors", async () => {
            prisma.application.findUnique.mockResolvedValue({
                id: 1,
                studentId: 1,
            });
            prisma.application.delete.mockRejectedValue(new Error("DB error"));

            const res = await request(app).delete("/api/applications/1");

            expect(res.status).toBe(500);
        });
    });
});
