const { z } = require("zod");
const prisma = require("../db/prisma");
const { publicUser } = require("../utils/user");

const UCLA_EMAIL_REGEX = /^[^@]+@(?:ucla|g\.ucla)\.edu$/i;
const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
const updateSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().regex(UCLA_EMAIL_REGEX).optional(),
    uclaId: z.string().min(7).optional(),
});

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

// Gets a single user by email. 
async function getUserByEmail(req, res) {
    const emailSchema = z.object({ email: z.string().email().regex(UCLA_EMAIL_REGEX) });
    const parsed = emailSchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ error: "Invalid email" });
    
    const user = await prisma.user.findUnique({
        where: { email: parsed.data.email },
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

async function deleteUser(req, res) {
    const parsedParams = idParamSchema.safeParse(req.params);
    if (!parsedParams.success) return res.status(400).json({ error: "Invalid user id" });

    try {
        const userId = parsedParams.data.id;

        // Use a transaction to delete all related data
        await prisma.$transaction(async (tx) => {
            // Check if user exists and get their role
            const user = await tx.user.findUnique({
                where: { id: userId },
                include: { student: true, researcher: true },
            });

            if (!user) {
                throw new Error("USER_NOT_FOUND");
            }

            // If user is a student, delete their applications and answers
            if (user.student) {
                // Delete answers for this student's applications
                await tx.answer.deleteMany({
                    where: {
                        application: {
                            studentId: userId,
                        },
                    },
                });

                // Delete student's applications
                await tx.application.deleteMany({
                    where: { studentId: userId },
                });

                // Delete the student record
                await tx.student.delete({
                    where: { userId: userId },
                });
            }

            // If user is a researcher, delete their posts and related data
            if (user.researcher) {
                // Get all post IDs for this researcher
                const posts = await tx.post.findMany({
                    where: { researcherId: userId },
                    select: { id: true },
                });
                const postIds = posts.map(p => p.id);

                if (postIds.length > 0) {
                    // Delete answers for applications to these posts
                    await tx.answer.deleteMany({
                        where: {
                            application: {
                                postId: { in: postIds },
                            },
                        },
                    });

                    // Delete applications to these posts
                    await tx.application.deleteMany({
                        where: { postId: { in: postIds } },
                    });

                    // Delete questions for these posts
                    await tx.question.deleteMany({
                        where: { postId: { in: postIds } },
                    });

                    // Delete the posts
                    await tx.post.deleteMany({
                        where: { researcherId: userId },
                    });
                }

                // Delete the researcher record
                await tx.researcher.delete({
                    where: { userId: userId },
                });
            }

            // Delete verification tokens
            await tx.verificationToken.deleteMany({
                where: { userId: userId },
            });

            // Delete sessions
            await tx.session.deleteMany({
                where: { userId: userId },
            });

            // Delete the user
            await tx.user.delete({
                where: { id: userId },
            });
        });

        res.status(204).send();
    } catch (err) {
        if (err.message === "USER_NOT_FOUND") {
            return res.status(404).json({ error: "User not found" });
        }
        if (err?.code === "P2025") {
            return res.status(404).json({ error: "User not found" });
        }
        console.error("Error deleting user:", err);
        return res.status(500).json({ error: "Failed to delete user" });
    }
}

module.exports = {
    listUsers,
    getUserById,
    updateUser,
    deleteUser,
};
