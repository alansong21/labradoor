import { describe, it, beforeEach, expect, vi } from "vitest";
import { requestResearcherSignup } from "../controllers/researcherController";

vi.mock("../db/prisma", () => ({
    default: {
        user: {
            create: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
        },
    },
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