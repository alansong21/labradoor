/**
 * Admin Controller
 * Handles administrative actions such as fetching all researchers and updating their verification status.
 */
const { z } = require("zod");
const prisma = require("../db/prisma");

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

module.exports = {
  getAllResearchers,
  updateResearcherVerification,
};
