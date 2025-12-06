/**
 * Admin Controller
 * Handles administrative actions such as fetching all researchers and updating their verification status.
 */
const { z } = require("zod");
const prisma = require("../db/prisma");
const { publicUser } = require("../utils/user");

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

//getAllResearchers - fetches researchers from the database


async function getAllResearchers(req, res) {
  try {
    const researchers = await prisma.researcher.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: {
        user: {
          createdAt: "desc",
        },
      },
    });

    res.json(researchers);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch researchers" });
  }
}

const updateVerificationSchema = z.object({
  verifyStatus: z.enum(["VERIFIED", "PENDING", "UNVERIFIED"]),
});

// updateResearcherVerification - update researcher verification status


async function updateResearcherVerification(req, res) {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid userId" });
  }

  const parsed = updateVerificationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const researcher = await prisma.researcher.update({
      where: { userId },
      data: { verifyStatus: parsed.data.verifyStatus },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    res.json(researcher);
  } catch (e) {
    console.error(e);
    if (e.code === "P2025") {
      return res.status(404).json({ error: "Researcher not found" });
    }
    res.status(500).json({ error: "Failed to update researcher" });
  }
}

// List all users (admin version)
async function listAllUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { student: true, researcher: true },
    });
    res.json({ users: users.map(publicUser) });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
}

// Get a single user by ID (admin version)
async function getUserById(req, res) {
  const parsedParams = idParamSchema.safeParse(req.params);
  if (!parsedParams.success) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: parsedParams.data.id },
      include: { student: true, researcher: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: publicUser(user) });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
}

//Helper function to delete student-related data
async function deleteUserData(tx, user, userId) {
  if (!user.student) {
    return;
  }
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
  })
}

//Helper function to delete student-related data
async function deleteResearcherData(tx, user, userId) {
  if (!user.researcher) {
    return;
  }
  // Get all post IDs for this researcher
  const posts = await tx.post.findMany({
    where: { researcherId: userId },
    select: { id: true },
  });
  const postIds = posts.map((p) => p.id);

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

async function deleteUserCommonData(tx, userId) {
  // Delete verification tokens
  await tx.verificationToken.deleteMany({
    where: { userId: userId },
  });

  // Delete sessions
  await tx.session.deleteMany({
    where: { userId: userId },
  });
}

// Delete a user (admin version)
async function deleteUser(req, res) {
  const parsedParams = idParamSchema.safeParse(req.params);
  if(!parsedParams.success) {
    return res.status(400).json({ error: "Invalid user id" });
  }

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

      // If user is a student, delete their applications and related data
      if(user.student) {
        await deleteUserData(tx, user, userId);
      }

      // If user is a researcher, delete their posts and related data
      if (user.researcher) {
        await deleteResearcherData(tx, user, userId);
      }

      // Delete common user data
      await deleteUserCommonData(tx, userId);

      // Finally, delete the user
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
  getAllResearchers,
  updateResearcherVerification,
  listAllUsers,
  getUserById,
  deleteUser,
};
