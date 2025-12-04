const { z } = require("zod");
const prisma = require("../db/prisma");
const { publicUser } = require("../utils/user");

// UCLA_EMAIL_REGEX – enforces UCLA-only email domain
// idParamSchema – validates user id param
// updateSchema – validates fields allowed during user update

const UCLA_EMAIL_REGEX = /^[^@]+@(?:ucla|g\.ucla)\.edu$/i;
const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
const updateSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().regex(UCLA_EMAIL_REGEX).optional(),
    uclaId: z.string().min(7).optional(),
});




// listUsers – returns all users (students + researchers) ordered by creation date


// List all users, ordered by creation date descending
// Includes students and researchers
async function listUsers(_req, res) {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        include: { student: true, researcher: true },
    });
    res.json({ users: users.map(publicUser) });
}

// Gets a single researcher or student user by ID. 
async function getUserById(req, res) {
    const parsedParams = idParamSchema.safeParse(req.params);
    if (!parsedParams.success) return res.status(400).json({ error: "Invalid user id" });

    const user = await prisma.user.findUnique({
        where: { id: parsedParams.data.id },
        include: { student: true, researcher: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ user: publicUser(user) });
}



// Updates a user in any of the fields allowed by updateSchema (see above). 
async function updateUser(req, res) {
    const parsedParams = idParamSchema.safeParse(req.params);
    if (!parsedParams.success) return res.status(400).json({ error: "Invalid user id" });

    const parsedBody = updateSchema.safeParse(req.body);
    if (!parsedBody.success) return res.status(400).json({ error: parsedBody.error.flatten() });

    try {
        const user = await prisma.user.update({
            where: { id: parsedParams.data.id },
            data: parsedBody.data,
        });
        res.json({ user: publicUser(user) });
    } catch (err) {
        if (err?.code === "P2025") return res.status(404).json({ error: "User not found" });
        if (err?.code === "P2002") return res.status(409).json({ error: "Email or UID already in use" });
        throw err;
    }
}

// Deletes a user by ID.
async function deleteUser(req, res) {
    const parsedParams = idParamSchema.safeParse(req.params);
    if (!parsedParams.success) return res.status(400).json({ error: "Invalid user id" });

    try {
        await prisma.user.delete({ where: { id: parsedParams.data.id } });
    } catch (err) {
        if (err?.code === "P2025") return res.status(404).json({ error: "User not found" });
        throw err;
    }
    res.status(204).send();
}

module.exports = {
    listUsers,
    getUserById,
    updateUser,
    deleteUser,
};
