const request = require("supertest");
const express = require("express");
const authRoutes = require("../server/routes/auth");
const prisma = require("../server/db/prisma");
const tokenService = require("../server/services/tokenService");
const sessionService = require("../server/services/sessionService");
const emailService = require("../server/services/emailService");
const passwordService = require("../server/services/passwordService");

// Mock all external services
jest.mock("../server/db/prisma", () => ({
    user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
    },
}));

jest.mock("../server/services/tokenService", () => ({
    createVerificationToken: jest.fn(),
    consumeVerificationToken: jest.fn(),
}));

jest.mock("../server/services/sessionService", () => ({
    createSession: jest.fn(),
    deleteSession: jest.fn(),
}));

jest.mock("../server/services/emailService", () => ({
    sendVerificationLink: jest.fn(),
}));

jest.mock("../server/services/passwordService", () => ({
    hashPassword: jest.fn(),
    verifyPassword: jest.fn(),
}));

jest.mock("../server/utils/user", () => ({
    publicUser: jest.fn((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
    })),
}));

// Mock auth middleware
jest.mock("../server/middleware/auth", () => ({
    authMiddleware: (req, res, next) => {
        req.user = { id: 1, email: "test@ucla.edu", name: "Test User" };
        req.sessionId = "session123";
        next();
    },
    SESSION_COOKIE: "session",
}));

// Create Express app for testing
const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

describe("Auth Controller Tests", () => {
    // Suppress console.error during tests
    let consoleErrorSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.APP_BASE_URL = "http://localhost:3000";
        // Mock console.error to suppress error outputs
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        // Restore console.error after each test
        consoleErrorSpy.mockRestore();
    });
    describe("POST /api/auth/signup - requestSignup", () => {
        // it("should successfully create a new user and send verification email", async () => {
        //     const signupData = {
        //         email: "newuser@ucla.edu",
        //         password: "password123",
        //         name: "New User",
        //         uclaId: "1234567",
        //         role: "STUDENT",
        //     };

        //     const mockUser = {
        //         id: 1,
        //         email: "newuser@ucla.edu",
        //         name: "New User",
        //         uclaId: "1234567",
        //         emailVerifiedAt: null,
        //     };

        //     passwordService.hashPassword.mockResolvedValue("hashedPassword123");
        //     prisma.user.create.mockResolvedValue(mockUser);
        //     tokenService.createVerificationToken.mockResolvedValue("verification-token-123");
        //     emailService.sendVerificationLink.mockResolvedValue(true);

        //     const res = await request(app)
        //         .post("/api/auth/signup")
        //         .send(signupData);

        //     expect(res.status).toBe(202);
        //     expect(res.body.message).toContain("Verification link sent");
        // });

        it("should handle signup without optional fields", async () => {
            const signupData = {
                email: "user@g.ucla.edu",
                password: "password123",
                role: "RESEARCHER",
            };

            const mockUser = {
                id: 2,
                email: "user@g.ucla.edu",
                name: null,
                emailVerifiedAt: null,
            };

            passwordService.hashPassword.mockResolvedValue("hashedPassword123");
            prisma.user.create.mockResolvedValue(mockUser);
            tokenService.createVerificationToken.mockResolvedValue("token-456");

            const res = await request(app)
                .post("/api/auth/signup")
                .send(signupData);

            expect(res.status).toBe(202);
        });

        it("should return 400 for invalid UCLA email", async () => {
            const signupData = {
                email: "user@gmail.com",
                password: "password123",
                role: "STUDENT",
            };

            const res = await request(app)
                .post("/api/auth/signup")
                .send(signupData);

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("error");
        });

        it("should return 400 for short password", async () => {
            const signupData = {
                email: "user@ucla.edu",
                password: "short",
                role: "STUDENT",
            };

            const res = await request(app)
                .post("/api/auth/signup")
                .send(signupData);

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("error");
        });

        it("should return 400 for missing role", async () => {
            const signupData = {
                email: "user@ucla.edu",
                password: "password123",
            };

            const res = await request(app)
                .post("/api/auth/signup")
                .send(signupData);

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty("error");
        });

        it("should return 409 if email already exists and is verified", async () => {
            const signupData = {
                email: "existing@ucla.edu",
                password: "password123",
                role: "STUDENT",
            };

            const existingUser = {
                id: 1,
                email: "existing@ucla.edu",
                emailVerifiedAt: new Date(),
            };

            passwordService.hashPassword.mockResolvedValue("hashedPassword123");
            prisma.user.create.mockRejectedValue({ code: "P2002" });
            prisma.user.findUnique.mockResolvedValue(existingUser);

            const res = await request(app)
                .post("/api/auth/signup")
                .send(signupData);

            expect(res.status).toBe(409);
            expect(res.body.error).toContain("Account already exists");
        });

        it("should accept g.ucla.edu emails", async () => {
            const signupData = {
                email: "student@g.ucla.edu",
                password: "password123",
                role: "STUDENT",
            };

            passwordService.hashPassword.mockResolvedValue("hashedPassword");
            prisma.user.create.mockResolvedValue({ id: 1, email: signupData.email });
            tokenService.createVerificationToken.mockResolvedValue("token");

            const res = await request(app)
                .post("/api/auth/signup")
                .send(signupData);

            expect(res.status).toBe(202);
        });
    });

    describe("POST /api/auth/login - login", () => {
        it("should successfully login with valid credentials", async () => {
            const loginData = {
                email: "user@ucla.edu",
                password: "password123",
            };

            const mockUser = {
                id: 1,
                email: "user@ucla.edu",
                name: "Test User",
                passwordHash: "hashedPassword",
                emailVerifiedAt: new Date(),
            };

            const mockSession = {
                raw: "session-token-123",
                expiresAt: new Date(Date.now() + 86400000),
            };

            prisma.user.findUnique.mockResolvedValue(mockUser);
            passwordService.verifyPassword.mockResolvedValue(true);
            sessionService.createSession.mockResolvedValue(mockSession);

            const res = await request(app)
                .post("/api/auth/login")
                .send(loginData);

            expect(res.status).toBe(200);
            expect(res.body.user).toHaveProperty("id", 1);
            expect(res.body.user).toHaveProperty("email", "user@ucla.edu");
        });

        it("should return 401 for non-existent user", async () => {
            const loginData = {
                email: "nonexistent@ucla.edu",
                password: "password123",
            };

            prisma.user.findUnique.mockResolvedValue(null);

            const res = await request(app)
                .post("/api/auth/login")
                .send(loginData);

            expect(res.status).toBe(401);
            expect(res.body.error).toBe("Invalid credentials");
        });

        it("should return 401 for unverified email", async () => {
            const loginData = {
                email: "unverified@ucla.edu",
                password: "password123",
            };

            const mockUser = {
                id: 1,
                email: "unverified@ucla.edu",
                passwordHash: "hashedPassword",
                emailVerifiedAt: null,
            };

            prisma.user.findUnique.mockResolvedValue(mockUser);

            const res = await request(app)
                .post("/api/auth/login")
                .send(loginData);

            expect(res.status).toBe(401);
            expect(res.body.error).toBe("Invalid credentials");
        });

        it("should return 401 for incorrect password", async () => {
            const loginData = {
                email: "user@ucla.edu",
                password: "wrongpassword",
            };

            const mockUser = {
                id: 1,
                email: "user@ucla.edu",
                passwordHash: "hashedPassword",
                emailVerifiedAt: new Date(),
            };

            prisma.user.findUnique.mockResolvedValue(mockUser);
            passwordService.verifyPassword.mockResolvedValue(false);

            const res = await request(app)
                .post("/api/auth/login")
                .send(loginData);

            expect(res.status).toBe(401);
            expect(res.body.error).toBe("Invalid credentials");
        });

        it("should return 400 for non-UCLA email", async () => {
            const loginData = {
                email: "user@gmail.com",
                password: "password123",
            };

            const res = await request(app)
                .post("/api/auth/login")
                .send(loginData);

            expect(res.status).toBe(400);
        });
    });

    describe("GET /api/auth/me - getMe", () => {
        it("should return current user", async () => {
            const res = await request(app).get("/api/auth/me");

            expect(res.status).toBe(200);
            expect(res.body.user).toHaveProperty("id", 1);
            expect(res.body.user).toHaveProperty("email", "test@ucla.edu");
        });
    });

    describe("POST /api/auth/logout - logout", () => {
        it("should successfully logout and clear session", async () => {
            sessionService.deleteSession.mockResolvedValue(true);

            const res = await request(app).post("/api/auth/logout");

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ ok: true });
            expect(sessionService.deleteSession).toHaveBeenCalledWith("session123");
        });
    });

    describe("Validation Tests", () => {
        it("should reject email with spaces", async () => {
            const signupData = {
                email: "user @ucla.edu",
                password: "password123",
                role: "STUDENT",
            };

            const res = await request(app)
                .post("/api/auth/signup")
                .send(signupData);

            expect(res.status).toBe(400);
        });

        it("should accept case-insensitive UCLA emails", async () => {
            const signupData = {
                email: "user@UCLA.EDU",
                password: "password123",
                role: "STUDENT",
            };

            passwordService.hashPassword.mockResolvedValue("hashedPassword");
            prisma.user.create.mockResolvedValue({ id: 1, email: signupData.email });
            tokenService.createVerificationToken.mockResolvedValue("token");

            const res = await request(app)
                .post("/api/auth/signup")
                .send(signupData);

            expect(res.status).toBe(202);
        });

        it("should reject subdomain that is not g.ucla.edu", async () => {
            const signupData = {
                email: "user@mail.ucla.edu",
                password: "password123",
                role: "STUDENT",
            };

            const res = await request(app)
                .post("/api/auth/signup")
                .send(signupData);

            expect(res.status).toBe(400);
        });

        it("should reject UCLA ID shorter than 9 characters", async () => {
            const signupData = {
                email: "user@ucla.edu",
                password: "password123",
                uclaId: "12345678",
                role: "STUDENT",
            };

            const res = await request(app)
                .post("/api/auth/signup")
                .send(signupData);

            expect(res.status).toBe(400);
        });

        it("should accept UCLA ID with exactly 9 characters", async () => {
            const signupData = {
                email: "user@ucla.edu",
                password: "password123",
                uclaId: "123456789",
                role: "STUDENT",
            };

            const mockUser = {
                id: 1,
                email: "user@ucla.edu",
                uclaId: "1234567",
            };

            passwordService.hashPassword.mockResolvedValue("hashedPassword");
            prisma.user.create.mockResolvedValue(mockUser);
            tokenService.createVerificationToken.mockResolvedValue("token");
            emailService.sendVerificationLink.mockResolvedValue(true);

            const res = await request(app)
                .post("/api/auth/signup")
                .send(signupData);

            expect(res.status).toBe(202);
        });

        it("should reject empty string name", async () => {
            const signupData = {
                email: "user@ucla.edu",
                password: "password123",
                name: "",
                role: "STUDENT",
            };

            const res = await request(app)
                .post("/api/auth/signup")
                .send(signupData);

            expect(res.status).toBe(400);
        });

        it("should accept name with special characters", async () => {
            const signupData = {
                email: "user@ucla.edu",
                password: "password123",
                name: "José María O'Brien-Smith",
                role: "RESEARCHER",
            };

            passwordService.hashPassword.mockResolvedValue("hashedPassword");
            prisma.user.create.mockResolvedValue({ id: 1, email: signupData.email });
            tokenService.createVerificationToken.mockResolvedValue("token");
            emailService.sendVerificationLink.mockResolvedValue(true);

            const res = await request(app)
                .post("/api/auth/signup")
                .send(signupData);

            expect(res.status).toBe(202);
        });
    });
});