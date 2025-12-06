const request = require("supertest");
const express = require("express");
const cookieParser = require("cookie-parser");
const researcherRoutes = require("../server/routes/researcher");
const prisma = require("../server/db/prisma");

// Mock the prisma client
jest.mock("../server/db/prisma", () => ({
    researcher: {
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
app.use("/api/researchers", researcherRoutes);

describe("Researcher Controller Tests", () => {
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

    describe("PUT /api/researchers/:id - updateResearcher", () => {
        it("should update researcher profile successfully", async () => {
            const mockResearcher = {
                id: 1,
                userId: 1,
                department: "Computer Science",
                verifyStatus: "VERIFIED",
                user: {
                    id: 1,
                    email: "researcher@ucla.edu",
                    name: "Dr. Smith",
                },
            };

            prisma.researcher.update.mockResolvedValue(mockResearcher);

            const res = await request(app)
                .put("/api/researchers/1")
                .send({
                    department: "Computer Science",
                });

            expect(res.status).toBe(200);
            expect(res.body.researcher).toHaveProperty("department", "Computer Science");
            expect(prisma.researcher.update).toHaveBeenCalledWith({
                where: { userId: 1 },
                data: {
                    department: "Computer Science",
                },
                include: { user: true },
            });
        });

        it("should update department to a different value", async () => {
            const mockResearcher = {
                id: 1,
                userId: 1,
                department: "Biology",
                verifyStatus: "VERIFIED",
                user: {
                    id: 1,
                    email: "researcher@ucla.edu",
                    name: "Dr. Smith",
                },
            };

            prisma.researcher.update.mockResolvedValue(mockResearcher);

            const res = await request(app)
                .put("/api/researchers/1")
                .send({
                    department: "Biology",
                });

            expect(res.status).toBe(200);
            expect(res.body.researcher).toHaveProperty("department", "Biology");
        });

        it("should update to a department with multiple words", async () => {
            const mockResearcher = {
                id: 1,
                userId: 1,
                department: "Electrical and Computer Engineering",
                verifyStatus: "VERIFIED",
                user: {
                    id: 1,
                    email: "researcher@ucla.edu",
                    name: "Dr. Smith",
                },
            };

            prisma.researcher.update.mockResolvedValue(mockResearcher);

            const res = await request(app)
                .put("/api/researchers/1")
                .send({
                    department: "Electrical and Computer Engineering",
                });

            expect(res.status).toBe(200);
            expect(res.body.researcher).toHaveProperty("department", "Electrical and Computer Engineering");
        });

        it("should return 400 for invalid user id format", async () => {
            const res = await request(app)
                .put("/api/researchers/invalid")
                .send({
                    department: "Computer Science",
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid user id");
        });

        it("should return 400 for negative user id", async () => {
            const res = await request(app)
                .put("/api/researchers/-1")
                .send({
                    department: "Computer Science",
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid user id");
        });

        it("should return 400 for zero user id", async () => {
            const res = await request(app)
                .put("/api/researchers/0")
                .send({
                    department: "Computer Science",
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid user id");
        });

        it("should return 400 for empty department string", async () => {
            const res = await request(app)
                .put("/api/researchers/1")
                .send({
                    department: "",
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("error");
        });

        it("should return 400 for invalid data types", async () => {
            const res = await request(app)
                .put("/api/researchers/1")
                .send({
                    department: 123,
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("error");
        });

        it("should return 400 for null department", async () => {
            const res = await request(app)
                .put("/api/researchers/1")
                .send({
                    department: null,
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("error");
        });

        it("should return 403 when user tries to update another researcher's profile", async () => {
            const res = await request(app)
                .put("/api/researchers/999")
                .send({
                    department: "Computer Science",
                });

            expect(res.status).toBe(403);
            expect(res.body.error).toBe("Forbidden");
        });

        it("should return 404 when researcher profile not found", async () => {
            prisma.researcher.update.mockRejectedValue({ code: "P2025" });

            const res = await request(app)
                .put("/api/researchers/1")
                .send({
                    department: "Computer Science",
                });

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Researcher not found");
        });

        it("should return 500 for database errors", async () => {
            prisma.researcher.update.mockRejectedValue(new Error("Database connection failed"));

            const res = await request(app)
                .put("/api/researchers/1")
                .send({
                    department: "Computer Science",
                });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to update researcher");
        });

        it("should handle empty request body", async () => {
            const mockResearcher = {
                id: 1,
                userId: 1,
                department: "Computer Science",
                verifyStatus: "VERIFIED",
                user: {
                    id: 1,
                    email: "researcher@ucla.edu",
                    name: "Dr. Smith",
                },
            };

            prisma.researcher.update.mockResolvedValue(mockResearcher);

            const res = await request(app)
                .put("/api/researchers/1")
                .send({});

            expect(res.status).toBe(200);
            expect(prisma.researcher.update).toHaveBeenCalledWith({
                where: { userId: 1 },
                data: {},
                include: { user: true },
            });
        });

        it("should include user data in response", async () => {
            const mockResearcher = {
                id: 1,
                userId: 1,
                department: "Computer Science",
                verifyStatus: "VERIFIED",
                user: {
                    id: 1,
                    email: "researcher@ucla.edu",
                    name: "Dr. Jane Smith",
                    uclaId: "987654321",
                },
            };

            prisma.researcher.update.mockResolvedValue(mockResearcher);

            const res = await request(app)
                .put("/api/researchers/1")
                .send({
                    department: "Computer Science",
                });

            expect(res.status).toBe(200);
            expect(res.body.researcher.user).toHaveProperty("id", 1);
            expect(res.body.researcher.user).toHaveProperty("email", "researcher@ucla.edu");
            expect(res.body.researcher.user).toHaveProperty("name", "Dr. Jane Smith");
        });

        it("should preserve verifyStatus when updating department", async () => {
            const mockResearcher = {
                id: 1,
                userId: 1,
                department: "Mathematics",
                verifyStatus: "PENDING",
                user: {
                    id: 1,
                    email: "researcher@ucla.edu",
                    name: "Dr. Smith",
                },
            };

            prisma.researcher.update.mockResolvedValue(mockResearcher);

            const res = await request(app)
                .put("/api/researchers/1")
                .send({
                    department: "Mathematics",
                });

            expect(res.status).toBe(200);
            expect(res.body.researcher).toHaveProperty("verifyStatus", "PENDING");
            expect(res.body.researcher).toHaveProperty("department", "Mathematics");
        });

        it("should handle special characters in department name", async () => {
            const specialDepartment = "Computer Science & Engineering";
            const mockResearcher = {
                id: 1,
                userId: 1,
                department: specialDepartment,
                verifyStatus: "VERIFIED",
                user: {
                    id: 1,
                    email: "researcher@ucla.edu",
                    name: "Dr. Smith",
                },
            };

            prisma.researcher.update.mockResolvedValue(mockResearcher);

            const res = await request(app)
                .put("/api/researchers/1")
                .send({
                    department: specialDepartment,
                });

            expect(res.status).toBe(200);
            expect(res.body.researcher).toHaveProperty("department", specialDepartment);
        });

        it("should handle very long department names", async () => {
            const longDepartment = "Department of Advanced Computational Biology and Bioinformatics with Machine Learning Applications";
            const mockResearcher = {
                id: 1,
                userId: 1,
                department: longDepartment,
                verifyStatus: "VERIFIED",
                user: {
                    id: 1,
                    email: "researcher@ucla.edu",
                    name: "Dr. Smith",
                },
            };

            prisma.researcher.update.mockResolvedValue(mockResearcher);

            const res = await request(app)
                .put("/api/researchers/1")
                .send({
                    department: longDepartment,
                });

            expect(res.status).toBe(200);
            expect(res.body.researcher).toHaveProperty("department", longDepartment);
        });

        it("should ignore extra fields in request body", async () => {
            const mockResearcher = {
                id: 1,
                userId: 1,
                department: "Physics",
                verifyStatus: "VERIFIED",
                user: {
                    id: 1,
                    email: "researcher@ucla.edu",
                    name: "Dr. Smith",
                },
            };

            prisma.researcher.update.mockResolvedValue(mockResearcher);

            const res = await request(app)
                .put("/api/researchers/1")
                .send({
                    department: "Physics",
                    extraField: "should be ignored",
                    anotherField: 123,
                });

            expect(res.status).toBe(200);
            expect(prisma.researcher.update).toHaveBeenCalledWith({
                where: { userId: 1 },
                data: {
                    department: "Physics",
                },
                include: { user: true },
            });
        });

        it("should not allow updating verifyStatus through this endpoint", async () => {
            const mockResearcher = {
                id: 1,
                userId: 1,
                department: "Computer Science",
                verifyStatus: "VERIFIED",
                user: {
                    id: 1,
                    email: "researcher@ucla.edu",
                    name: "Dr. Smith",
                },
            };

            prisma.researcher.update.mockResolvedValue(mockResearcher);

            const res = await request(app)
                .put("/api/researchers/1")
                .send({
                    department: "Computer Science",
                    verifyStatus: "UNVERIFIED",
                });

            expect(res.status).toBe(200);
            // Verify that verifyStatus was NOT included in the update call
            expect(prisma.researcher.update).toHaveBeenCalledWith({
                where: { userId: 1 },
                data: {
                    department: "Computer Science",
                },
                include: { user: true },
            });
        });

        it("should handle departments with numbers", async () => {
            const mockResearcher = {
                id: 1,
                userId: 1,
                department: "CS 180 Research Lab",
                verifyStatus: "VERIFIED",
                user: {
                    id: 1,
                    email: "researcher@ucla.edu",
                    name: "Dr. Smith",
                },
            };

            prisma.researcher.update.mockResolvedValue(mockResearcher);

            const res = await request(app)
                .put("/api/researchers/1")
                .send({
                    department: "CS 180 Research Lab",
                });

            expect(res.status).toBe(200);
            expect(res.body.researcher).toHaveProperty("department", "CS 180 Research Lab");
        });

        it("should handle departments with hyphens", async () => {
            const mockResearcher = {
                id: 1,
                userId: 1,
                department: "Bio-Chemistry",
                verifyStatus: "VERIFIED",
                user: {
                    id: 1,
                    email: "researcher@ucla.edu",
                    name: "Dr. Smith",
                },
            };

            prisma.researcher.update.mockResolvedValue(mockResearcher);

            const res = await request(app)
                .put("/api/researchers/1")
                .send({
                    department: "Bio-Chemistry",
                });

            expect(res.status).toBe(200);
            expect(res.body.researcher).toHaveProperty("department", "Bio-Chemistry");
        });
    });
});
