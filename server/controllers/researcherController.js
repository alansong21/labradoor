const { z } = require("zod");
const prisma = require("../db/prisma");

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
const updateResearcherSchema = z.object({
    department: z.string().min(1).optional(),
});

async function updateResearcher(req, res) {
    const parsedParams = idParamSchema.safeParse(req.params);
    if (!parsedParams.success) {
        return res.status(400).json({ error: "Invalid user id" });
    }

    const parsedBody = updateResearcherSchema.safeParse(req.body);
    if (!parsedBody.success) {
        return res.status(400).json({ error: parsedBody.error.flatten() });
    }

    // Check if the user is updating their own profile
    if (req.user?.id !== parsedParams.data.id) {
        return res.status(403).json({ error: "Forbidden" });
    }

    try {
        const researcher = await prisma.researcher.update({
            where: { userId: parsedParams.data.id },
            data: parsedBody.data,
            include: { user: true },
        });

        res.json({ researcher });
    } catch (err) {
        if (err?.code === "P2025") {
            return res.status(404).json({ error: "Researcher not found" });
        }
        console.error("Error updating researcher:", err);
        res.status(500).json({ error: "Failed to update researcher" });
    }
}

module.exports = {
    updateResearcher,
};
