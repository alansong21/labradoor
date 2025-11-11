import type { Request, Response } from "express";
import { z } from "zod";

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

    return res.status(501).json({ error: "Not implemented" });
}