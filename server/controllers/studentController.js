const prisma = require("../db/prisma");
const { z } = require("zod");

const upsertStudentSchema = z.object({
  year: z.string().optional(),
  major: z.string().optional(),
  description: z.string().optional(),
});

/**
 * GET /api/student/me
 * Requires: logged-in user
 * Returns the Student row for this user (if it exists) + basic user info.
 */
async function getMyStudentProfile(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const student = await prisma.student.findUnique({
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
          select: { applications: true },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ error: "Student profile not found" });
    }

    return res.json(student);
  } catch (e) {
    console.error("Error in getMyStudentProfile:", e);
    return res.status(500).json({ error: "Failed to fetch student profile" });
  }
}

/**
 * POST /api/student/me
 * Requires: logged-in user
 * Creates or updates the Student profile for this user.
 * - If none exists: create with given year/major/description
 * - If exists: update those fields
 */
async function upsertMyStudentProfile(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const parsed = upsertStudentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { year, major, description } = parsed.data;

  try {
    const existing = await prisma.student.findUnique({
      where: { userId: req.user.id },
    });

    let student;

    if (!existing) {
      student = await prisma.student.create({
        data: {
          userId: req.user.id,
          year,
          major,
          description: description ?? null,
        },
      });
    } else {
      student = await prisma.student.update({
        where: { userId: req.user.id },
        data: {
          year,
          major,
          description: description ?? null,
        },
      });
    }

    return res.status(existing ? 200 : 201).json(student);
  } catch (e) {
    console.error("Error in upsertMyStudentProfile:", e);
    return res.status(500).json({ error: "Failed to save student profile" });
  }
}

module.exports = {
  getMyStudentProfile,
  upsertMyStudentProfile,
};
