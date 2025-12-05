const request = require("supertest");
const express = require("express");
const userRoutes = require("../server/routes/users");
const prisma = require("../server/db/prisma");

let mockUser = { id: 1, email: "test@ucla.edu" };
jest.mock("../server/middleware/auth", () => ({
    authMiddleware: (req, res, next) => {
        req.user = mockUser;
        next();
    },
}));

// Mock the prisma client
jest.mock("../server/db/prisma", () => ({
    user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    student: {
        update: jest.fn(),
    },
    researcher: {
        update: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback({
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        student: {
            update: jest.fn(),
        },
        researcher: {
            update: jest.fn(),
        },
    })),
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
app.use("/api/users", userRoutes);

describe("User Controller Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("GET /api/users - listUsers", () => {
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

            const res = await request(app).get("/api/users");

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

            const res = await request(app).get("/api/users");

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

            const res = await request(app).get("/api/users");

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

            const res = await request(app).get("/api/users");

            expect(res.status).toBe(200);
            expect(prisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: { student: true, researcher: true },
                })
            );
        });
    });

    describe("GET /api/users/:id - getUserById", () => {
        it("should get a user by id successfully", async () => {
            const mockUser = {
                id: 1,
                email: "user@ucla.edu",
                name: "Test User",
                uclaId: "123456789",
                student: { id: 1 },
                researcher: null,
            };

            prisma.user.findUnique.mockResolvedValue(mockUser);

            const res = await request(app).get("/api/users/1");

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

            const res = await request(app).get("/api/users/999");

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("User not found");
        });

        it("should return 400 for invalid id format", async () => {
            const res = await request(app).get("/api/users/invalid");

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid user id");
        });

        it("should return 400 for negative id", async () => {
            const res = await request(app).get("/api/users/-1");

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid user id");
        });

        it("should return 400 for zero id", async () => {
            const res = await request(app).get("/api/users/0");

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid user id");
        });
    });

    describe("PUT /api/users/:id - updateUser", () => {
        it("should update user name successfully", async () => {
            const mockUser = {
                id: 1,
                email: "user@ucla.edu",
                name: "Updated Name",
                uclaId: "123456789",
            };

            prisma.user.update.mockResolvedValue(mockUser);

            const res = await request(app)
                .put("/api/users/1")
                .send({ name: "Updated Name" });

            expect(res.status).toBe(200);
            expect(res.body.user.name).toBe("Updated Name");
            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { name: "Updated Name" },
            });
        });

        it("should update user email successfully", async () => {
            const mockUser = {
                id: 1,
                email: "newemail@ucla.edu",
                name: "Test User",
            };

            prisma.user.update.mockResolvedValue(mockUser);

            const res = await request(app)
                .put("/api/users/1")
                .send({ email: "newemail@ucla.edu" });

            expect(res.status).toBe(200);
            expect(res.body.user.email).toBe("newemail@ucla.edu");
        });

        it("should update user uclaId successfully", async () => {
            const mockUser = {
                id: 1,
                email: "user@ucla.edu",
                name: "Test User",
                uclaId: "987654321",
            };

            prisma.user.update.mockResolvedValue(mockUser);

            const res = await request(app)
                .put("/api/users/1")
                .send({ uclaId: "987654321" });

            expect(res.status).toBe(200);
            expect(res.body.user.uclaId).toBe("987654321");
        });

        it("should update multiple fields at once", async () => {
            const mockUser = {
                id: 1,
                email: "updated@g.ucla.edu",
                name: "Updated Name",
                uclaId: "999999999",
            };

            prisma.user.update.mockResolvedValue(mockUser);

            const res = await request(app)
                .put("/api/users/1")
                .send({
                    name: "Updated Name",
                    email: "updated@g.ucla.edu",
                    uclaId: "999999999",
                });

            expect(res.status).toBe(200);
            expect(res.body.user.name).toBe("Updated Name");
            expect(res.body.user.email).toBe("updated@g.ucla.edu");
        });

        it("should return 404 for non-existent user", async () => {
            prisma.user.update.mockRejectedValue({ code: "P2025" });

            const res = await request(app)
                .put("/api/users/999")
                .send({ name: "Updated" });

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("User not found");
        });

        it("should return 409 for duplicate email", async () => {
            prisma.user.update.mockRejectedValue({ code: "P2002" });

            const res = await request(app)
                .put("/api/users/1")
                .send({ email: "existing@ucla.edu" });

            expect(res.status).toBe(409);
            expect(res.body.error).toBe("Email or UID already in use");
        });

        it("should return 409 for duplicate uclaId", async () => {
            prisma.user.update.mockRejectedValue({ code: "P2002" });

            const res = await request(app)
                .put("/api/users/1")
                .send({ uclaId: "123456789" });

            expect(res.status).toBe(409);
            expect(res.body.error).toBe("Email or UID already in use");
        });

        it("should return 400 for invalid user id", async () => {
            const res = await request(app)
                .put("/api/users/invalid")
                .send({ name: "Updated" });

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid user id");
        });

        it("should return 400 for invalid email format", async () => {
            const res = await request(app)
                .put("/api/users/1")
                .send({ email: "invalid-email" });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("error");
        });

        it("should return 400 for non-UCLA email", async () => {
            const res = await request(app)
                .put("/api/users/1")
                .send({ email: "user@gmail.com" });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("error");
        });

        it("should accept g.ucla.edu email", async () => {
            const mockUser = {
                id: 1,
                email: "user@g.ucla.edu",
                name: "Test",
            };

            prisma.user.update.mockResolvedValue(mockUser);

            const res = await request(app)
                .put("/api/users/1")
                .send({ email: "user@g.ucla.edu" });

            expect(res.status).toBe(200);
        });

        it("should return 400 for empty name", async () => {
            const res = await request(app)
                .put("/api/users/1")
                .send({ name: "" });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("error");
        });

        it("should return 400 for uclaId shorter than 9 characters", async () => {
            const res = await request(app)
                .put("/api/users/1")
                .send({ uclaId: "123456" });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("error");
        });

        it("should accept uclaId with exactly 9 characters", async () => {
            const mockUser = {
                id: 1,
                email: "user@ucla.edu",
                uclaId: "123456789",
            };

            prisma.user.update.mockResolvedValue(mockUser);

            const res = await request(app)
                .put("/api/users/1")
                .send({ uclaId: "123456789" });

            expect(res.status).toBe(200);
        });

        it("should accept empty update body", async () => {
            const mockUser = {
                id: 1,
                email: "user@ucla.edu",
                name: "Test",
            };

            prisma.user.update.mockResolvedValue(mockUser);

            const res = await request(app)
                .put("/api/users/1")
                .send({});

            expect(res.status).toBe(200);
        });

        it("should accept case-insensitive UCLA emails", async () => {
            const mockUser = {
                id: 1,
                email: "user@UCLA.EDU",
                name: "Test",
            };

            prisma.user.update.mockResolvedValue(mockUser);

            const res = await request(app)
                .put("/api/users/1")
                .send({ email: "user@UCLA.EDU" });

            expect(res.status).toBe(200);
        });
    });

    describe("DELETE /api/users/:id - deleteUser", () => {
        it("should delete a user successfully", async () => {
            const mockUser = {
                id: 1,
                student: { id: 1 },
                researcher: null,
            };

            prisma.$transaction.mockImplementation(async (callback) => {
                const tx = {
                    user: {
                        findUnique: jest.fn().mockResolvedValue(mockUser),
                        delete: jest.fn().mockResolvedValue({ id: 1 }),
                    },
                    student: {
                        delete: jest.fn().mockResolvedValue({ id: 1 }),
                    },
                    answer: {
                        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
                    },
                    application: {
                        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
                    },
                    verificationToken: {
                        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
                    },
                    session: {
                        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
                    },
                };
                return callback(tx);
            });

            const res = await request(app).delete("/api/users/1");

            expect(res.status).toBe(204);
        });

        it("should return 404 for non-existent user", async () => {
            prisma.$transaction.mockImplementation(async (callback) => {
                const tx = {
                    user: {
                        findUnique: jest.fn().mockResolvedValue(null),
                    },
                };
                return callback(tx);
            });

            const res = await request(app).delete("/api/users/999");

            expect(res.status).toBe(404);
            expect(res.body.error).toBe("User not found");
        });

        it("should return 400 for invalid id format", async () => {
            const res = await request(app).delete("/api/users/invalid");

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid user id");
        });

        it("should return 400 for negative id", async () => {
            const res = await request(app).delete("/api/users/-1");

            expect(res.status).toBe(400);
            expect(res.body.error).toBe("Invalid user id");
        });
    });

    describe("Database Error Handling", () => {
        it("should handle database error during listUsers", async () => {
            prisma.user.findMany.mockRejectedValue(new Error("Database error"));

            const res = await request(app).get("/api/users");

            // Express catches the error and returns 500
            expect([500]).toContain(res.status);
        });

        it("should handle database error during getUserById", async () => {
            prisma.user.findUnique.mockRejectedValue(new Error("Database error"));

            const res = await request(app).get("/api/users/1");

            expect([500]).toContain(res.status);
        });

        it("should handle unexpected database error during update", async () => {
            prisma.user.update.mockRejectedValue(new Error("Unexpected error"));

            const res = await request(app)
                .put("/api/users/1")
                .send({ name: "Test" });

            expect([500]).toContain(res.status);
        });

        it("should handle unexpected database error during delete", async () => {
            prisma.$transaction.mockRejectedValue(new Error("Unexpected error"));

            const res = await request(app).delete("/api/users/1");

            expect([500]).toContain(res.status);
        });
    });

    describe("Edge Cases", () => {
        it("should handle very long name", async () => {
            const longName = "A".repeat(1000);
            const mockUser = {
                id: 1,
                email: "user@ucla.edu",
                name: longName,
            };

            prisma.user.update.mockResolvedValue(mockUser);

            const res = await request(app)
                .put("/api/users/1")
                .send({ name: longName });

            expect(res.status).toBe(200);
        });

        it("should handle special characters in name", async () => {
            const mockUser = {
                id: 1,
                email: "user@ucla.edu",
                name: "José María O'Brien-Smith",
            };

            prisma.user.update.mockResolvedValue(mockUser);

            const res = await request(app)
                .put("/api/users/1")
                .send({ name: "José María O'Brien-Smith" });

            expect(res.status).toBe(200);
        });

        it("should handle uclaId longer than 7 characters", async () => {
            const mockUser = {
                id: 1,
                email: "user@ucla.edu",
                uclaId: "123456789",
            };

            prisma.user.update.mockResolvedValue(mockUser);

            const res = await request(app)
                .put("/api/users/1")
                .send({ uclaId: "123456789" });

            expect(res.status).toBe(200);
        });
    });

    describe("PUT /api/users/:id/profile - updateUserProfile (TDD)", () => {
        describe("Student Profile Updates", () => {
            it("should update student profile fields successfully", async () => {
                const mockUser = {
                    id: 1,
                    email: "student@ucla.edu",
                    name: "Test Student",
                    student: { id: 1, userId: 1, year: "Junior", major: "CS" },
                    researcher: null,
                };

                const updatedUser = {
                    ...mockUser,
                    student: { ...mockUser.student, year: "Senior", major: "Computer Science", description: "Test description" },
                };

                prisma.user.findUnique.mockResolvedValue(mockUser);
                prisma.$transaction.mockImplementation(async (callback) => {
                    const tx = {
                        user: {
                            update: jest.fn().mockResolvedValue(mockUser),
                            findUnique: jest.fn().mockResolvedValue(updatedUser),
                        },
                        student: {
                            update: jest.fn().mockResolvedValue(updatedUser.student),
                        },
                    };
                    return callback(tx);
                });

                const res = await request(app)
                    .put("/api/users/1/profile")
                    .send({
                        year: "Senior",
                        major: "Computer Science",
                        description: "Test description",
                    });

                expect(res.status).toBe(200);
                expect(prisma.user.findUnique).toHaveBeenCalledWith({
                    where: { id: 1 },
                    include: { student: true, researcher: true },
                });
            });

            it("should update student + base user fields in one request", async () => {
                const mockUser = {
                    id: 1,
                    email: "student@ucla.edu",
                    name: "Old Name",
                    uclaId: "123456789",
                    student: { id: 1, userId: 1, year: "Junior", major: "CS" },
                    researcher: null,
                };

                const updatedUser = {
                    ...mockUser,
                    name: "New Name",
                    uclaId: "987654321",
                    student: { ...mockUser.student, year: "Senior" },
                };

                prisma.user.findUnique.mockResolvedValue(mockUser);
                prisma.$transaction.mockImplementation(async (callback) => {
                    const tx = {
                        user: {
                            update: jest.fn().mockResolvedValue({ ...mockUser, name: "New Name", uclaId: "987654321" }),
                            findUnique: jest.fn().mockResolvedValue(updatedUser),
                        },
                        student: {
                            update: jest.fn().mockResolvedValue(updatedUser.student),
                        },
                    };
                    return callback(tx);
                });

                const res = await request(app)
                    .put("/api/users/1/profile")
                    .send({
                        name: "New Name",
                        uclaId: "987654321",
                        year: "Senior",
                    });

                expect(res.status).toBe(200);
            });

            it("should handle partial student updates", async () => {
                const mockUser = {
                    id: 1,
                    email: "student@ucla.edu",
                    name: "Test",
                    student: { id: 1, userId: 1, year: "Junior", major: "CS" },
                    researcher: null,
                };

                prisma.user.findUnique.mockResolvedValue(mockUser);
                prisma.$transaction.mockImplementation(async (callback) => {
                    const tx = {
                        user: {
                            findUnique: jest.fn().mockResolvedValue(mockUser),
                        },
                        student: {
                            update: jest.fn().mockResolvedValue({ ...mockUser.student, year: "Senior" }),
                        },
                    };
                    return callback(tx);
                });

                const res = await request(app)
                    .put("/api/users/1/profile")
                    .send({ year: "Senior" });

                expect(res.status).toBe(200);
            });
        });

        describe("Researcher Profile Updates", () => {
            it("should update researcher profile fields successfully", async () => {
                const mockUserData = {
                    id: 2,
                    email: "researcher@ucla.edu",
                    name: "Dr. Smith",
                    student: null,
                    researcher: { id: 1, userId: 2, department: "Engineering" },
                };

                const updatedUser = {
                    ...mockUserData,
                    researcher: { ...mockUserData.researcher, department: "Computer Science" },
                };

                mockUser = { id: 2, email: "researcher@ucla.edu" };

                prisma.user.findUnique.mockResolvedValue(mockUserData);
                prisma.$transaction.mockImplementation(async (callback) => {
                    const tx = {
                        user: {
                            findUnique: jest.fn().mockResolvedValue(updatedUser),
                        },
                        researcher: {
                            update: jest.fn().mockResolvedValue(updatedUser.researcher),
                        },
                    };
                    return callback(tx);
                });

                const res = await request(app)
                    .put("/api/users/2/profile")
                    .send({ department: "Computer Science" });

                expect(res.status).toBe(200);

                mockUser = { id: 1, email: "test@ucla.edu" };
            });

            it("should update researcher + base user fields in one request", async () => {
                const mockUserData = {
                    id: 2,
                    email: "researcher@ucla.edu",
                    name: "Old Name",
                    student: null,
                    researcher: { id: 1, userId: 2, department: "Engineering" },
                };

                const updatedUser = {
                    ...mockUserData,
                    name: "New Name",
                    researcher: { ...mockUserData.researcher, department: "CS" },
                };

                // Set mock user to researcher (id: 2)
                mockUser = { id: 2, email: "researcher@ucla.edu" };

                prisma.user.findUnique.mockResolvedValue(mockUserData);
                prisma.$transaction.mockImplementation(async (callback) => {
                    const tx = {
                        user: {
                            update: jest.fn().mockResolvedValue({ ...mockUserData, name: "New Name" }),
                            findUnique: jest.fn().mockResolvedValue(updatedUser),
                        },
                        researcher: {
                            update: jest.fn().mockResolvedValue(updatedUser.researcher),
                        },
                    };
                    return callback(tx);
                });

                const res = await request(app)
                    .put("/api/users/2/profile")
                    .send({
                        name: "New Name",
                        department: "CS",
                    });

                expect(res.status).toBe(200);

                mockUser = { id: 1, email: "test@ucla.edu" };
            });
        });

        describe("Authorization", () => {
            it("should return 403 when user tries to update another user's profile", async () => {
                // req.user.id is 1 (from mock), trying to update user 2
                const res = await request(app)
                    .put("/api/users/2/profile")
                    .send({ name: "Hacker" });

                expect(res.status).toBe(403);
                expect(res.body.error).toBe("Forbidden");
            });

            it("should allow users to update their own profile", async () => {
                const mockUser = {
                    id: 1,
                    email: "user@ucla.edu",
                    name: "Test",
                    student: { id: 1 },
                    researcher: null,
                };

                prisma.user.findUnique.mockResolvedValue(mockUser);
                prisma.$transaction.mockImplementation(async (callback) => {
                    const tx = {
                        user: {
                            update: jest.fn().mockResolvedValue({ ...mockUser, name: "Updated" }),
                            findUnique: jest.fn().mockResolvedValue({ ...mockUser, name: "Updated" }),
                        },
                    };
                    return callback(tx);
                });

                const res = await request(app)
                    .put("/api/users/1/profile")
                    .send({ name: "Updated" });

                expect(res.status).toBe(200);
            });
        });

        describe("Validation", () => {
            it("should return 400 for invalid user id", async () => {
                const res = await request(app)
                    .put("/api/users/invalid/profile")
                    .send({ name: "Test" });

                expect(res.status).toBe(400);
                expect(res.body.error).toBe("Invalid user id");
            });

            it("should return 400 for invalid email format", async () => {
                const res = await request(app)
                    .put("/api/users/1/profile")
                    .send({ email: "invalid-email" });

                expect(res.status).toBe(400);
                expect(res.body).toHaveProperty("error");
            });

            it("should return 400 for non-UCLA email", async () => {
                const res = await request(app)
                    .put("/api/users/1/profile")
                    .send({ email: "user@gmail.com" });

                expect(res.status).toBe(400);
                expect(res.body).toHaveProperty("error");
            });

            it("should return 400 for invalid uclaId length", async () => {
                const res = await request(app)
                    .put("/api/users/1/profile")
                    .send({ uclaId: "123" });

                expect(res.status).toBe(400);
                expect(res.body).toHaveProperty("error");
            });
        });

        describe("Error Handling", () => {
            it("should return 404 for non-existent user", async () => {
                prisma.user.findUnique.mockResolvedValue(null);

                const res = await request(app)
                    .put("/api/users/999/profile")
                    .send({ name: "Test" });

                expect(res.status).toBe(404);
                expect(res.body.error).toBe("User not found");
            });

            it("should return 409 for duplicate email", async () => {
                const mockUser = {
                    id: 1,
                    email: "user@ucla.edu",
                    student: { id: 1 },
                };

                prisma.user.findUnique.mockResolvedValue(mockUser);
                prisma.$transaction.mockRejectedValue({ code: "P2002" });

                const res = await request(app)
                    .put("/api/users/1/profile")
                    .send({ email: "existing@ucla.edu" });

                expect(res.status).toBe(409);
                expect(res.body.error).toBe("Email or UID already in use");
            });

            it("should handle database errors gracefully", async () => {
                const mockUser = {
                    id: 1,
                    email: "user@ucla.edu",
                    student: { id: 1 },
                };

                prisma.user.findUnique.mockResolvedValue(mockUser);
                prisma.$transaction.mockRejectedValue(new Error("Database error"));

                const res = await request(app)
                    .put("/api/users/1/profile")
                    .send({ name: "Test" });

                expect(res.status).toBe(500);
                expect(res.body.error).toBe("Failed to update profile");
            });
        });

        describe("Edge Cases", () => {
            it("should handle empty update body", async () => {
                const mockUser = {
                    id: 1,
                    email: "user@ucla.edu",
                    name: "Test",
                    student: { id: 1 },
                };

                prisma.user.findUnique.mockResolvedValue(mockUser);
                prisma.$transaction.mockImplementation(async (callback) => {
                    const tx = {
                        user: {
                            findUnique: jest.fn().mockResolvedValue(mockUser),
                        },
                    };
                    return callback(tx);
                });

                const res = await request(app)
                    .put("/api/users/1/profile")
                    .send({});

                expect(res.status).toBe(200);
            });

            it("should handle updating only base user fields", async () => {
                const mockUser = {
                    id: 1,
                    email: "user@ucla.edu",
                    name: "Old Name",
                    student: { id: 1 },
                };

                prisma.user.findUnique.mockResolvedValue(mockUser);
                prisma.$transaction.mockImplementation(async (callback) => {
                    const tx = {
                        user: {
                            update: jest.fn().mockResolvedValue({ ...mockUser, name: "New Name" }),
                            findUnique: jest.fn().mockResolvedValue({ ...mockUser, name: "New Name" }),
                        },
                    };
                    return callback(tx);
                });

                const res = await request(app)
                    .put("/api/users/1/profile")
                    .send({ name: "New Name" });

                expect(res.status).toBe(200);
            });

            it("should return updated user with all relations", async () => {
                const mockUser = {
                    id: 1,
                    email: "user@ucla.edu",
                    name: "Test",
                    student: { id: 1, year: "Junior" },
                    researcher: null,
                };

                prisma.user.findUnique.mockResolvedValue(mockUser);
                prisma.$transaction.mockImplementation(async (callback) => {
                    const tx = {
                        user: {
                            findUnique: jest.fn().mockResolvedValue(mockUser),
                        },
                    };
                    return callback(tx);
                });

                const res = await request(app)
                    .put("/api/users/1/profile")
                    .send({});

                expect(res.status).toBe(200);
                expect(res.body.user).toHaveProperty("id");
                expect(res.body.user).toHaveProperty("email");
            });
        });
    });
});