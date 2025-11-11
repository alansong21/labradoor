import { describe, it, beforeEach, expect, vi } from "vitest";
import { requestResearcherSignup } from "../controllers/researcherController";
import prisma from "../db/prisma";
import { fetchFacultyEmail } from "../services/facultyVerificationService";
import { hashPassword } from "../services/passwordService";
import { createVerificationToken } from "../services/tokenService";
import { sendVerificationLink } from "../services/emailService";


vi.mock("../db/prisma", () => ({
    default: {
        user: {
            create: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
        },
    },
}));

vi.mock("../services/passwordService", () => ({
    hashPassword: vi.fn().mockResolvedValue("hashed-password"),
}));

vi.mock("../services/tokenService", () => ({
    createVerificationToken: vi.fn().mockResolvedValue("token-123"),
    consumeVerificationToken: vi.fn(),
}));

vi.mock("../services/emailService", () => ({
    sendVerificationLink: vi.fn(),
}));

vi.mock("../services/facultyVerificationService", () => ({
    fetchFacultyEmail: vi.fn(),
}));

const mockRes = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
};

describe("requestResearcherSignup validation", () => {
    let res: ReturnType<typeof mockRes>;

    beforeEach(() => {
        res = mockRes();
        vi.clearAllMocks();
    });

    it("rejects missing department", async () => {
        const req: any = {
            body: {
                email: "prof@ucla.edu",
                password: "Password123!",
                firstName: "Ada",
                lastName: "Lovelace",
            },
        };

        await requestResearcherSignup(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalled();
    });

    it("rejects unsupported department", async () => {
        const req: any = {
            body: {
                email: "prof@ucla.edu",
                password: "Password123!",
                firstName: "Ada",
                lastName: "Lovelace",
                department: "PHYSICS",
            },
        };

        await requestResearcherSignup(req, res);

        expect (res.status).toHaveBeenCalledWith(400);
    });

    it("rejects missing first or last name", async () => {
        const req: any = {
            body: {
                email: "prof@ucla.edu",
                password: "Password123!",
                department: "COMPUTER_SCIENCE",
            },
        };

        await requestResearcherSignup(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });
});

const baseBody = {
    email: "prof@ucla.edu",
    password: "Password123!",
    firstName: "Ada",
    lastName: "Lovelace",
    department: "COMPUTER_SCIENCE",
};

describe("requestResearcherSignup faculty verification", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("rejects when faculty email does not match signup email", async () => {
        vi.mocked(fetchFacultyEmail).mockResolvedValue("other@cs.ucla.edu");

        const req: any = { body: baseBody };
        const res = mockRes();

        await requestResearcherSignup(req, res);

        expect(fetchFacultyEmail).toHaveBeenCalledWith({
            department: "COMPUTER_SCIENCE",
            firstName: "Ada",
            lastName: "Lovelace",
        });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("creates a user and sends verification when faculty email matches", async () => {
        vi.mocked(fetchFacultyEmail).mockResolvedValue(baseBody.email);
        vi.mocked(prisma.user.create).mockResolvedValue({ id: 42, email: baseBody.email });

        const req: any = { body: baseBody };
        const res = mockRes();

        await requestResearcherSignup(req, res);

        expect(fetchFacultyEmail).toHaveBeenCalled();
        expect(hashPassword).toHaveBeenCalledWith(baseBody.password);
        expect(prisma.user.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                email: baseBody.email,
                firstName: "Ada",
                lastName: "Lovelace",
                department: "COMPUTER_SCIENCE",
                passwordHash: "hashed-password",
                emailVerifiedAt: null,
                role: "RESEARCHER",
            }),
        });
        expect(createVerificationToken).toHaveBeenCalledWith(expect.objectContaining({ userId: 42, type: "SIGNUP" }));
        expect(sendVerificationLink).toHaveBeenCalledWith(expect.objectContaining({ email: baseBody.email }));
        expect(res.status).toHaveBeenCalledWith(202);
    })
});