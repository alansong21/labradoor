const { z } = require("zod");
const prisma = require("../db/prisma");

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
const updateStudentSchema = z.object({
    year: z.string().min(1).optional(),
    major: z.string().min(1).optional(),
    description: z.string().optional(),
});

async function updateStudent(req, res) {
    const parsedParams = idParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
        return res.status(400).json({ error: "Invalid user id" });
    }

    const parsedBody = updateStudentSchema.safeParse(req.body);
    if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.error.flatten() });
    }

    // Check if the user is updating their own profile
    if (req.user?.id !== parsedParams.data.id) {
        return res.status(403).json({ error: "Forbidden" });
    }

    try {
        const student = await prisma.student.update({
            where: { userId: parsedParams.data.id },
            data: parsedBody.data,
            include: { user: true },
        });

        res.json({ student });
    } catch (err) {
        if (err?.code === "P2025") {
            return res.status(404).json({ error: "Student not found" });
        }
        console.error("Error updating student:", err);
        res.status(500).json({ error: "Failed to update student" });
    }
}

module.exports = {
    updateStudent,
};
