const request = require("supertest");
const express = require("express");
const cookieParser = require("cookie-parser");
const studentRoutes = require("../server/routes/students");
const prisma = require("../server/db/prisma");

// Mock the prisma client
jest.mock("../server/db/prisma", () => ({
    student: {
        update: jest.fn(),
    },
}));

// Mock auth middleware
jest.mock("../server/middleware/auth", () => ({
    authMiddleware: (req, res, next) => {
        // Mock authenticated user
        req.user = req.mockUser || { id: 1 };
        next();
    },
}));

// Create Express app for testing
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/students", studentRoutes);

describe("Student Controller Tests", () => {
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

    describe("PUT /api/students/:id - updateStudent", () => {
        it("should update student profile successfully", async () => {
            const mockStudent = {
                userId: 1,
                year: "Junior",
                major: "Computer Science",
                description: "I love coding",
                user: {
                    id: 1,
                    email: "student@ucla.edu",
                    name: "John Doe",
                },
            };

            prisma.student.update.mockResolvedValue(mockStudent);

            const res = await request(app)
                .put("/api/students/1")
                .send({
                    year: "Junior",
                    major: "Computer Science",
                    description: "I love coding",
                });

            expect(res.status).toBe(200);
            expect(res.body.student).toHaveProperty("year", "Junior");
            expect(res.body.student).toHaveProperty("major", "Computer Science");
            expect(res.body.student).toHaveProperty("description", "I love coding");
            expect(prisma.student.update).toHaveBeenCalledWith({
                where: { userId: 1 },
                data: {
                    year: "Junior",
                    major: "Computer Science",
                    description: "I love coding",
                },
                include: { user: true },
            });
        });

        it("should update only year field", async () => {
            const mockStudent = {
                userId: 1,
                year: "Senior",
                major: "Computer Science",
                description: null,
                user: {
                    id: 1,
                    email: "student@ucla.edu",
                    name: "John Doe",
                },
            };

            prisma.student.update.mockResolvedValue(mockStudent);

            const res = await request(app)
                .put("/api/students/1")
                .send({
                    year: "Senior",
                });

            expect(res.status).toBe(200);
            expect(res.body.student).toHaveProperty("year", "Senior");
            expect(prisma.student.update).toHaveBeenCalledWith({
                where: { userId: 1 },
                data: { year: "Senior" },
                include: { user: true },
            });
        });

        it("should update only major field", async () => {
            const mockStudent = {
                userId: 1,
                year: "Junior",
                major: "Mathematics",
                description: null,
                user: {
                    id: 1,
                    email: "student@ucla.edu",
                    name: "John Doe",
                },
            };

            prisma.student.update.mockResolvedValue(mockStudent);

            const res = await request(app)
                .put("/api/students/1")
                .send({
                    major: "Mathematics",
                });

            expect(res.status).toBe(200);
            expect(res.body.student).toHaveProperty("major", "Mathematics");
        });

        it("should update only description field", async () => {
            const mockStudent = {
                userId: 1,
                year: "Junior",
                major: "Computer Science",
                description: "Updated description",
                user: {
                    id: 1,
                    email: "student@ucla.edu",
                    name: "John Doe",
                },
            };

            prisma.student.update.mockResolvedValue(mockStudent);

            const res = await request(app)
                .put("/api/students/1")
                .send({
                    description: "Updated description",
                });

            expect(res.status).toBe(200);
            expect(res.body.student).toHaveProperty("description", "Updated description");
        });

        it("should allow empty description", async () => {
            const mockStudent = {
                userId: 1,
                year: "Junior",
                major: "Computer Science",
                description: "",
                user: {
                    id: 1,
                    email: "student@ucla.edu",
                    name: "John Doe",
                },
            };

            prisma.student.update.mockResolvedValue(mockStudent);

            const res = await request(app)
                .put("/api/students/1")
                .send({
                    description: "",
                });

            expect(res.status).toBe(200);
            expect(res.body.student).toHaveProperty("description", "");
        });

        it("should return 400 for invalid user id format", async () => {
            const res = await request(app)
                .put("/api/students/invalid")
                .send({
                    year: "Junior",
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid user id");
        });

        it("should return 400 for negative user id", async () => {
            const res = await request(app)
                .put("/api/students/-1")
                .send({
                    year: "Junior",
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid user id");
        });

        it("should return 400 for zero user id", async () => {
            const res = await request(app)
                .put("/api/students/0")
                .send({
                    year: "Junior",
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid user id");
        });

        it("should return 400 for empty year string", async () => {
            const res = await request(app)
                .put("/api/students/1")
                .send({
                    year: "",
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("error");
        });

        it("should return 400 for empty major string", async () => {
            const res = await request(app)
                .put("/api/students/1")
                .send({
                    major: "",
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("error");
        });

        it("should return 400 for invalid data types", async () => {
            const res = await request(app)
                .put("/api/students/1")
                .send({
                    year: 123,
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("error");
        });

        it("should return 403 when user tries to update another student's profile", async () => {
            const res = await request(app)
                .put("/api/students/999")
                .send({
                    year: "Junior",
                });

            expect(res.status).toBe(403);
            expect(res.body.error).toBe("Forbidden");
        });

        it("should return 404 when student profile not found", async () => {
            prisma.student.update.mockRejectedValue({ code: "P2025" });

            const res = await request(app)
                .put("/api/students/1")
                .send({
                    year: "Junior",
                });

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Student not found");
        });

        it("should return 500 for database errors", async () => {
            prisma.student.update.mockRejectedValue(new Error("Database connection failed"));

            const res = await request(app)
                .put("/api/students/1")
                .send({
                    year: "Junior",
                });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to update student");
        });

        it("should handle empty request body", async () => {
            const mockStudent = {
                userId: 1,
                year: "Junior",
                major: "Computer Science",
                description: null,
                user: {
                    id: 1,
                    email: "student@ucla.edu",
                    name: "John Doe",
                },
            };

            prisma.student.update.mockResolvedValue(mockStudent);

            const res = await request(app)
                .put("/api/students/1")
                .send({});

            expect(res.status).toBe(200);
            expect(prisma.student.update).toHaveBeenCalledWith({
                where: { userId: 1 },
                data: {},
                include: { user: true },
            });
        });

        it("should include user data in response", async () => {
            const mockStudent = {
                userId: 1,
                year: "Junior",
                major: "Computer Science",
                description: "Test description",
                user: {
                    id: 1,
                    email: "student@ucla.edu",
                    name: "John Doe",
                    uclaId: "123456789",
                },
            };

            prisma.student.update.mockResolvedValue(mockStudent);

            const res = await request(app)
                .put("/api/students/1")
                .send({
                    year: "Junior",
                });

            expect(res.status).toBe(200);
            expect(res.body.student.user).toHaveProperty("id", 1);
            expect(res.body.student.user).toHaveProperty("email", "student@ucla.edu");
            expect(res.body.student.user).toHaveProperty("name", "John Doe");
        });

        it("should handle special characters in description", async () => {
            const specialDescription = "I'm interested in AI/ML & Data Science! #PassionForTech";
            const mockStudent = {
                userId: 1,
                year: "Junior",
                major: "Computer Science",
                description: specialDescription,
                user: {
                    id: 1,
                    email: "student@ucla.edu",
                    name: "John Doe",
                },
            };

            prisma.student.update.mockResolvedValue(mockStudent);

            const res = await request(app)
                .put("/api/students/1")
                .send({
                    description: specialDescription,
                });

            expect(res.status).toBe(200);
            expect(res.body.student).toHaveProperty("description", specialDescription);
        });

        it("should handle long description text", async () => {
            const longDescription = "a".repeat(1000);
            const mockStudent = {
                userId: 1,
                year: "Junior",
                major: "Computer Science",
                description: longDescription,
                user: {
                    id: 1,
                    email: "student@ucla.edu",
                    name: "John Doe",
                },
            };

            prisma.student.update.mockResolvedValue(mockStudent);

            const res = await request(app)
                .put("/api/students/1")
                .send({
                    description: longDescription,
                });

            expect(res.status).toBe(200);
            expect(res.body.student).toHaveProperty("description", longDescription);
        });
    });
});
