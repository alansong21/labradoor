/**
 * User Controller
 * Handles general user management: listing, retrieving, updating, and deleting users.
 * Supports both Student and Researcher profiles.
 */
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
    uclaId: z.string().length(9).or(z.literal("")).optional(),
});

// updateProfileSchema – validates all fields for unified profile update
const optionalProfileString = z.preprocess(
    value => {
        if (typeof value !== "string") return value;
        const trimmed = value.trim();
        return trimmed === "" ? undefined : trimmed;
    },
    z.string().optional()
);

const updateProfileSchema = z.object({
    // Base user fields
    name: z.string().min(1).optional(),
    email: z.string().email().regex(UCLA_EMAIL_REGEX).optional(),
    uclaId: z.string().length(9).or(z.literal("")).optional(),
    // Student fields
    year: optionalProfileString,
    major: optionalProfileString,
    description: z.string().optional(),
    // Researcher fields
    department: optionalProfileString,
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

// Deletes a user by ID.
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

// updateUserProfile – unified endpoint to update user + role-specific fields in one transaction
async function updateUserProfile(req, res) {
    const parsedParams = idParamSchema.safeParse(req.params);
    if (!parsedParams.success) return res.status(400).json({ error: "Invalid user id" });

    const parsedBody = updateProfileSchema.safeParse(req.body);
    if (!parsedBody.success) return res.status(400).json({ error: parsedBody.error.flatten() });

    const userId = parsedParams.data.id;

    try {
        // Fetch user to determine role
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { student: true, researcher: true },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Auth: users can only update their own profile
        if (req.user?.id !== userId) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const body = typeof req.body === "object" && req.body !== null ? req.body : {};
        const yearProvided = Object.prototype.hasOwnProperty.call(body, "year");
        const majorProvided = Object.prototype.hasOwnProperty.call(body, "major");
        const departmentProvided = Object.prototype.hasOwnProperty.call(body, "department");

        const { name, email, uclaId, year, major, description, department } = parsedBody.data;

        if (user.student) {
            const effectiveYear = yearProvided ? year : user.student?.year;
            if (!effectiveYear || !effectiveYear.toString().trim()) {
                return res.status(400).json({ error: "Year is required for student profiles" });
            }
            const effectiveMajor = majorProvided ? major : user.student?.major;
            if (!effectiveMajor || !effectiveMajor.toString().trim()) {
                return res.status(400).json({ error: "Major is required for student profiles" });
            }
        }

        if (user.researcher) {
            const effectiveDepartment = departmentProvided ? department : user.researcher?.department;
            if (!effectiveDepartment || !effectiveDepartment.toString().trim()) {
                return res.status(400).json({ error: "Department is required for researcher profiles" });
            }
        }

        // Update in transaction for atomicity
        const result = await prisma.$transaction(async (tx) => {
            // Update base user fields if provided
            const userUpdateData = {};
            if (name !== undefined) userUpdateData.name = name;
            if (email !== undefined) userUpdateData.email = email;
            if (uclaId !== undefined) userUpdateData.uclaId = uclaId;

            let updatedUser = user;
            if (Object.keys(userUpdateData).length > 0) {
                updatedUser = await tx.user.update({
                    where: { id: userId },
                    data: userUpdateData,
                });
            }

            // Update student-specific fields if student
            if (user.student && (year !== undefined || major !== undefined || description !== undefined)) {
                const studentUpdateData = {};
                if (year !== undefined) studentUpdateData.year = year;
                if (major !== undefined) studentUpdateData.major = major;
                if (description !== undefined) studentUpdateData.description = description;

                await tx.student.update({
                    where: { userId },
                    data: studentUpdateData,
                });
            }

            // Update researcher-specific fields if researcher
            if (user.researcher && department !== undefined) {
                await tx.researcher.update({
                    where: { userId },
                    data: { department },
                });
            }

            // Fetch updated user with relations
            return tx.user.findUnique({
                where: { id: userId },
                include: { student: true, researcher: true },
            });
        });

        res.json({ user: publicUser(result) });
    } catch (err) {
        if (err?.code === "P2025") return res.status(404).json({ error: "User not found" });
        if (err?.code === "P2002") return res.status(409).json({ error: "Email or UID already in use" });
        console.error("Error updating user profile:", err);
        res.status(500).json({ error: "Failed to update profile" });
    }
}

module.exports = {
    listUsers,
    getUserById,
    getUserByEmail,
    updateUser,
    updateUserProfile,
    deleteUser,
};
