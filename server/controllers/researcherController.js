const prisma = require("../db/prisma");
const { z } = require("zod");

const upsertResearcherSchema = z.object({
  department: z.string().min(1, "Department is required"),
});

/**
 * GET /api/researcher/me
 * Requires: logged-in user
 */
async function getMyResearcherProfile(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const researcher = await prisma.researcher.findUnique({
      where: { userId: req.user.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!researcher) {
      return res.status(404).json({ error: "Researcher profile not found" });
    }

    return res.json(researcher);
  } catch (e) {
    console.error("Error in getMyResearcherProfile:", e);
    return res.status(500).json({ error: "Failed to fetch researcher profile" });
  }
}

/**
 * POST /api/researcher/me
 * Requires: logged-in user
 * Creates or updates the Researcher profile for this user.
 */
async function upsertMyResearcherProfile(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const parsed = upsertResearcherSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { department } = parsed.data;

  try {
    const existing = await prisma.researcher.findUnique({
      where: { userId: req.user.id },
    });

    let researcher;

    if (!existing) {
      researcher = await prisma.researcher.create({
        data: {
          userId: req.user.id,
          department,
          verifyStatus: "PENDING",
        },
      });
    } else {
      researcher = await prisma.researcher.update({
        where: { userId: req.user.id },
        data: {
          department,
        },
      });
    }

    return res.status(existing ? 200 : 201).json(researcher);
  } catch (e) {
    console.error("Error in upsertMyResearcherProfile:", e);
    return res.status(500).json({ error: "Failed to save researcher profile" });
  }
}

module.exports = {
  getMyResearcherProfile,
  upsertMyResearcherProfile,
};
