import type { Request, Response } from "express";
import { z } from "zod";
import prisma from "../db/prisma";
import { hashPassword } from "../services/passwordService";
import { createVerificationToken } from "../services/tokenService";
import { sendVerificationLink } from "../services/emailService";
import { fetchFacultyEmail } from "../services/facultyVerificationService";

const UCLA_EMAIL_REGEX = /^[^@]+@(?:ucla|g\.ucla)\.edu$/i;

const researcherSignupSchema = z.object({
    email: z.string().email().regex(UCLA_EMAIL_REGEX, "Must be a valid UCLA email"),
    password: z.string().min(8),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    department: z.enum(["COMPUTER_SCIENCE"]),
});

export async function requestResearcherSignup(req: Request, res: Response) {
    const parsed = researcherSignupSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { email, firstName, lastName, department, password } = parsed.data;

    const facultyEmail = await fetchFacultyEmail({ department, firstName, lastName });
    if (!facultyEmail || facultyEmail.toLowerCase() !== email.toLowerCase()) {
        return res.status(400).json({ error: "Faculty email does match department site listing." });
    }

    const passwordHash = await hashPassword(password);

    let user;
    try {
        user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                firstName,
                lastName,
                department,
                role: "RESEARCHER",
                emailVerifiedAt: null,
            },
        });
    } catch (err: any) {
        if (err?.code !== "P2002") {
            throw err;
        }
        user = await prisma.user.update({
            where: { email },
            data: {
                passwordHash,
                firstName,
                lastName,
                department,
                role: "RESEARCHER",
                emailVerifiedAt: null,
            },
        });
    }

    const rawToken = await createVerificationToken({ userId: user.id, type: "SIGNUP" });
    const url = `${process.env.APP_BASE_URL ?? "http://localhost:3000"}/verify-signup?token=${rawToken}`;
    await sendVerificationLink({ email, url, type: "SIGNUP" });

    return res.status(202).json({ message: "Verification link sent" });
}
