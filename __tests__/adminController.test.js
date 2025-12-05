const request = require("supertest");
const express = require("express");
const cookieParser = require("cookie-parser");
const adminRoutes = require("../server/routes/admin");
const prisma = require("../server/db/prisma");

// Mock the prisma client
jest.mock("../server/db/prisma", () => ({
    user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
    },
    researcher: {
        findMany: jest.fn(),
        update: jest.fn(),
    },
    student: {
        delete: jest.fn(),
    },
    application: {
        deleteMany: jest.fn(),
    },
    answer: {
        deleteMany: jest.fn(),
    },
    post: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
    },
    question: {
        deleteMany: jest.fn(),
    },
    verificationToken: {
        deleteMany: jest.fn(),
    },
    session: {
        deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
}));

// Mock publicUser utility
jest.mock("../server/utils/user", () => ({
    publicUser: jest.fn((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        uclaId: user.uclaId,
    })),
}));

// Create Express app for testing
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/admin", adminRoutes);

// Helper function to create admin auth cookie
const createAdminCookie = (email = "admin@ucla.edu") => {
    const adminData = { email };
    return Buffer.from(JSON.stringify(adminData)).toString('base64');
};

describe("Admin Controller Tests", () => {
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

    describe("Admin Authentication", () => {
        it("should return 401 when no admin cookie is present", async () => {
            const res = await request(app).get("/api/admin/users");

            expect(res.status).toBe(401);
            expect(res.body.error).toBe("Not authenticated");
        });

        it("should return 401 for invalid admin cookie", async () => {
            const res = await request(app)
                .get("/api/admin/users")
                .set('Cookie', ['admin_session=invalid_base64']);

            expect(res.status).toBe(401);
            expect(res.body.error).toBe("Invalid session");
        });
    });

    describe("GET /api/admin/researchers - getAllResearchers", () => {
        it("should list all researchers successfully", async () => {
            const mockResearchers = [
                {
                    id: 1,
                    userId: 1,
                    verifyStatus: "VERIFIED",
                    user: {
                        id: 1,
                        email: "researcher1@ucla.edu",
                        name: "Researcher One",
                        createdAt: new Date("2024-01-15"),
                    },
                    _count: {
                        posts: 5,
                    },
                },
                {
                    id: 2,
                    userId: 2,
                    verifyStatus: "PENDING",
                    user: {
                        id: 2,
                        email: "researcher2@ucla.edu",
                        name: "Researcher Two",
                        createdAt: new Date("2024-01-10"),
                    },
                    _count: {
                        posts: 2,
                    },
                },
            ];

            prisma.researcher.findMany.mockResolvedValue(mockResearchers);

            const res = await request(app)
                .get("/api/admin/researchers")
                .set('Cookie', [`admin_session=${createAdminCookie()}`]);

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
            expect(res.body[0]).toHaveProperty("verifyStatus", "VERIFIED");
            expect(prisma.researcher.findMany).toHaveBeenCalledWith({
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            createdAt: true,
                        },
                    },
                    _count: {
                        select: {
                            posts: true,
                        },
                    },
                },
                orderBy: {
                    user: {
                        createdAt: "desc",
                    },
                },
            });
        });

        it("should return empty array when no researchers exist", async () => {
            prisma.researcher.findMany.mockResolvedValue([]);

            const res = await request(app)
                .get("/api/admin/researchers")
                .set('Cookie', [`admin_session=${createAdminCookie()}`]);

            expect(res.status).toBe(200);
            expect(res.body).toEqual([]);
        });

        it("should handle database error", async () => {
            prisma.researcher.findMany.mockRejectedValue(new Error("Database error"));

            const res = await request(app)
                .get("/api/admin/researchers")
                .set('Cookie', [`admin_session=${createAdminCookie()}`]);

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to fetch researchers");
        });
    });

    describe("PATCH /api/admin/researchers/:userId/verify - updateResearcherVerification", () => {
        it("should update researcher verification to VERIFIED", async () => {
            const mockResearcher = {
                id: 1,
                userId: 1,
                verifyStatus: "VERIFIED",
                user: {
                    id: 1,
                    email: "researcher@ucla.edu",
                    name: "Test Researcher",
                },
            };

            prisma.researcher.update.mockResolvedValue(mockResearcher);

            const res = await request(app)
                .patch("/api/admin/researchers/1/verify")
                .set('Cookie', [`admin_session=${createAdminCookie()}`])
                .send({ verifyStatus: "VERIFIED" });

            expect(res.status).toBe(200);
            expect(res.body.verifyStatus).toBe("VERIFIED");
            expect(prisma.researcher.update).toHaveBeenCalledWith({
                where: { userId: 1 },
                data: { verifyStatus: "VERIFIED" },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                        },
                    },
                },
            });
        });

        it("should update researcher verification to PENDING", async () => {
            const mockResearcher = {
                id: 1,
                userId: 1,
                verifyStatus: "PENDING",
                user: {
                    id: 1,
                    email: "researcher@ucla.edu",
                    name: "Test Researcher",
                },
            };

            prisma.researcher.update.mockResolvedValue(mockResearcher);

            const res = await request(app)
                .patch("/api/admin/researchers/1/verify")
                .set('Cookie', [`admin_session=${createAdminCookie()}`])
                .send({ verifyStatus: "PENDING" });

            expect(res.status).toBe(200);
            expect(res.body.verifyStatus).toBe("PENDING");
        });

        it("should update researcher verification to UNVERIFIED", async () => {
            const mockResearcher = {
                id: 1,
                userId: 1,
                verifyStatus: "UNVERIFIED",
                user: {
                    id: 1,
                    email: "researcher@ucla.edu",
                    name: "Test Researcher",
                },
            };

            prisma.researcher.update.mockResolvedValue(mockResearcher);

            const res = await request(app)
                .patch("/api/admin/researchers/1/verify")
                .set('Cookie', [`admin_session=${createAdminCookie()}`])
                .send({ verifyStatus: "UNVERIFIED" });

            expect(res.status).toBe(200);
            expect(res.body.verifyStatus).toBe("UNVERIFIED");
        });

        it("should return 400 for invalid userId", async () => {
            const res = await request(app)
                .patch("/api/admin/researchers/invalid/verify")
                .set('Cookie', [`admin_session=${createAdminCookie()}`])
                .send({ verifyStatus: "VERIFIED" });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid userId");
        });

        it("should return 400 for invalid verifyStatus", async () => {
            const res = await request(app)
                .patch("/api/admin/researchers/1/verify")
                .set('Cookie', [`admin_session=${createAdminCookie()}`])
                .send({ verifyStatus: "INVALID_STATUS" });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("error");
        });

        it("should return 400 for missing verifyStatus", async () => {
            const res = await request(app)
                .patch("/api/admin/researchers/1/verify")
                .set('Cookie', [`admin_session=${createAdminCookie()}`])
                .send({});

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("error");
        });

        it("should return 404 for non-existent researcher", async () => {
            prisma.researcher.update.mockRejectedValue({ code: "P2025" });

            const res = await request(app)
                .patch("/api/admin/researchers/999/verify")
                .set('Cookie', [`admin_session=${createAdminCookie()}`])
                .send({ verifyStatus: "VERIFIED" });

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("Researcher not found");
        });

        it("should handle database error", async () => {
            prisma.researcher.update.mockRejectedValue(new Error("Database error"));

            const res = await request(app)
                .patch("/api/admin/researchers/1/verify")
                .set('Cookie', [`admin_session=${createAdminCookie()}`])
                .send({ verifyStatus: "VERIFIED" });

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to update researcher");
        });
    });

    describe("GET /api/admin/users - listAllUsers", () => {
        it("should list all users successfully", async () => {
            const mockUsers = [
                {
                    id: 1,
                    email: "user1@ucla.edu",
                    name: "User One",
                    createdAt: new Date("2024-01-15"),
                    student: { id: 1 },
                    researcher: null,
                },
                {
                    id: 2,
                    email: "user2@g.ucla.edu",
                    name: "User Two",
                    createdAt: new Date("2024-01-10"),
                    student: null,
                    researcher: { id: 1 },
                },
            ];

            prisma.user.findMany.mockResolvedValue(mockUsers);

            const res = await request(app)
                .get("/api/admin/users")
                .set('Cookie', [`admin_session=${createAdminCookie()}`]);

            expect(res.status).toBe(200);
            expect(res.body.users).toHaveLength(2);
            expect(res.body.users[0]).toHaveProperty("email", "user1@ucla.edu");
            expect(prisma.user.findMany).toHaveBeenCalledWith({
                orderBy: { createdAt: "desc" },
                include: { student: true, researcher: true },
            });
        });

        it("should return empty array when no users exist", async () => {
            prisma.user.findMany.mockResolvedValue([]);

            const res = await request(app)
                .get("/api/admin/users")
                .set('Cookie', [`admin_session=${createAdminCookie()}`]);

            expect(res.status).toBe(200);
            expect(res.body.users).toEqual([]);
        });

        it("should order users by createdAt descending", async () => {
            const mockUsers = [
                {
                    id: 3,
                    email: "newest@ucla.edu",
                    name: "Newest",
                    createdAt: new Date("2024-01-20"),
                },
                {
                    id: 2,
                    email: "middle@ucla.edu",
                    name: "Middle",
                    createdAt: new Date("2024-01-15"),
                },
                {
                    id: 1,
                    email: "oldest@ucla.edu",
                    name: "Oldest",
                    createdAt: new Date("2024-01-10"),
                },
            ];

            prisma.user.findMany.mockResolvedValue(mockUsers);

            const res = await request(app)
                .get("/api/admin/users")
                .set('Cookie', [`admin_session=${createAdminCookie()}`]);

            expect(res.status).toBe(200);
            expect(res.body.users[0].email).toBe("newest@ucla.edu");
            expect(res.body.users[2].email).toBe("oldest@ucla.edu");
        });

        it("should include student and researcher data", async () => {
            const mockUsers = [
                {
                    id: 1,
                    email: "user@ucla.edu",
                    name: "Test User",
                    student: { id: 1, userId: 1, major: "CS" },
                    researcher: { id: 1, userId: 1, department: "Engineering" },
                },
            ];

            prisma.user.findMany.mockResolvedValue(mockUsers);

            const res = await request(app)
                .get("/api/admin/users")
                .set('Cookie', [`admin_session=${createAdminCookie()}`]);

            expect(res.status).toBe(200);
            expect(prisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: { student: true, researcher: true },
                })
            );
        });

        it("should handle database error", async () => {
            prisma.user.findMany.mockRejectedValue(new Error("Database error"));

            const res = await request(app)
                .get("/api/admin/users")
                .set('Cookie', [`admin_session=${createAdminCookie()}`]);

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to fetch users");
        });
    });

    describe("GET /api/admin/users/:id - getUserById", () => {
        it("should get a user by id successfully", async () => {
            const mockUser = {
                id: 1,
                email: "user@ucla.edu",
                name: "Test User",
                uclaId: "1234567",
                student: { id: 1 },
                researcher: null,
            };

            prisma.user.findUnique.mockResolvedValue(mockUser);

            const res = await request(app)
                .get("/api/admin/users/1")
                .set('Cookie', [`admin_session=${createAdminCookie()}`]);

            expect(res.status).toBe(200);
            expect(res.body.user).toHaveProperty("id", 1);
            expect(res.body.user).toHaveProperty("email", "user@ucla.edu");
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
                include: { student: true, researcher: true },
            });
        });

        it("should return 404 for non-existent user", async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            const res = await request(app)
                .get("/api/admin/users/999")
                .set('Cookie', [`admin_session=${createAdminCookie()}`]);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("User not found");
        });

        it("should return 400 for invalid id format", async () => {
            const res = await request(app)
                .get("/api/admin/users/invalid")
                .set('Cookie', [`admin_session=${createAdminCookie()}`]);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid user id");
        });

        it("should return 400 for negative id", async () => {
            const res = await request(app)
                .get("/api/admin/users/-1")
                .set('Cookie', [`admin_session=${createAdminCookie()}`]);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid user id");
        });

        it("should return 400 for zero id", async () => {
            const res = await request(app)
                .get("/api/admin/users/0")
                .set('Cookie', [`admin_session=${createAdminCookie()}`]);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid user id");
        });

        it("should handle database error", async () => {
            prisma.user.findUnique.mockRejectedValue(new Error("Database error"));

            const res = await request(app)
                .get("/api/admin/users/1")
                .set('Cookie', [`admin_session=${createAdminCookie()}`]);

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to fetch user");
        });
    });

    describe("DELETE /api/admin/users/:id - deleteUser", () => {
        it("should delete a user successfully", async () => {
            const mockUser = {
                id: 1,
                email: "user@ucla.edu",
                student: null,
                researcher: null,
            };

            prisma.$transaction.mockImplementation(async (callback) => {
                return await callback({
                    user: {
                        findUnique: jest.fn().mockResolvedValue(mockUser),
                        delete: jest.fn().mockResolvedValue(mockUser),
                    },
                    verificationToken: {
                        deleteMany: jest.fn(),
                    },
                    session: {
                        deleteMany: jest.fn(),
                    },
                });
            });

            const res = await request(app)
                .delete("/api/admin/users/1")
                .set('Cookie', [`admin_session=${createAdminCookie()}`]);

            expect(res.status).toBe(204);
        });

        it("should delete student user with all related data", async () => {
            const mockUser = {
                id: 1,
                email: "student@ucla.edu",
                student: { id: 1, userId: 1 },
                researcher: null,
            };

            prisma.$transaction.mockImplementation(async (callback) => {
                return await callback({
                    user: {
                        findUnique: jest.fn().mockResolvedValue(mockUser),
                        delete: jest.fn().mockResolvedValue(mockUser),
                    },
                    student: {
                        delete: jest.fn(),
                    },
                    answer: {
                        deleteMany: jest.fn(),
                    },
                    application: {
                        deleteMany: jest.fn(),
                    },
                    verificationToken: {
                        deleteMany: jest.fn(),
                    },
                    session: {
                        deleteMany: jest.fn(),
                    },
                });
            });

            const res = await request(app)
                .delete("/api/admin/users/1")
                .set('Cookie', [`admin_session=${createAdminCookie()}`]);

            expect(res.status).toBe(204);
        });

        it("should delete researcher user with all related data", async () => {
            const mockUser = {
                id: 1,
                email: "researcher@ucla.edu",
                student: null,
                researcher: { id: 1, userId: 1 },
            };

            const mockPosts = [{ id: 1 }, { id: 2 }];

            prisma.$transaction.mockImplementation(async (callback) => {
                return await callback({
                    user: {
                        findUnique: jest.fn().mockResolvedValue(mockUser),
                        delete: jest.fn().mockResolvedValue(mockUser),
                    },
                    researcher: {
                        delete: jest.fn(),
                    },
                    post: {
                        findMany: jest.fn().mockResolvedValue(mockPosts),
                        deleteMany: jest.fn(),
                    },
                    answer: {
                        deleteMany: jest.fn(),
                    },
                    application: {
                        deleteMany: jest.fn(),
                    },
                    question: {
                        deleteMany: jest.fn(),
                    },
                    verificationToken: {
                        deleteMany: jest.fn(),
                    },
                    session: {
                        deleteMany: jest.fn(),
                    },
                });
            });

            const res = await request(app)
                .delete("/api/admin/users/1")
                .set('Cookie', [`admin_session=${createAdminCookie()}`]);

            expect(res.status).toBe(204);
        });

        it("should return 404 for non-existent user", async () => {
            prisma.$transaction.mockImplementation(async (callback) => {
                return await callback({
                    user: {
                        findUnique: jest.fn().mockResolvedValue(null),
                    },
                });
            });

            const res = await request(app)
                .delete("/api/admin/users/999")
                .set('Cookie', [`admin_session=${createAdminCookie()}`]);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("User not found");
        });

        it("should return 400 for invalid id format", async () => {
            const res = await request(app)
                .delete("/api/admin/users/invalid")
                .set('Cookie', [`admin_session=${createAdminCookie()}`]);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid user id");
        });

        it("should return 400 for negative id", async () => {
            const res = await request(app)
                .delete("/api/admin/users/-1")
                .set('Cookie', [`admin_session=${createAdminCookie()}`]);

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid user id");
        });

        it("should handle Prisma P2025 error code", async () => {
            prisma.$transaction.mockRejectedValue({ code: "P2025" });

            const res = await request(app)
                .delete("/api/admin/users/1")
                .set('Cookie', [`admin_session=${createAdminCookie()}`]);

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("User not found");
        });

        it("should handle unexpected database error", async () => {
            prisma.$transaction.mockRejectedValue(new Error("Unexpected error"));

            const res = await request(app)
                .delete("/api/admin/users/1")
                .set('Cookie', [`admin_session=${createAdminCookie()}`]);

            expect(res.status).toBe(500);
            expect(res.body.error).toBe("Failed to delete user");
        });
    });
});