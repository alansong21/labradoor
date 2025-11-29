const prisma = require("../db/prisma");

async function becomeResearcher(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const existing = await prisma.researcher.findUnique({
      where: { userId: req.user.id },
    });

    if (existing) {
      return res.json({ message: "Already a researcher", researcher: existing });
    }

    const researcher = await prisma.researcher.create({
      data: {
        userId: req.user.id,
        verifyStatus: "VERIFIED",
        department: "CS",
      },
    });

    return res.status(201).json({ message: "Became researcher", researcher });
  } catch (e) {
    console.error("Error in becomeResearcher:", e);
    return res.status(500).json({ error: "Failed to create researcher" });
  }
}

async function becomeStudent(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const existing = await prisma.student.findUnique({
      where: { userId: req.user.id },
    });

    if (existing) {
      return res.json({ message: "Already a student", student: existing });
    }

    const student = await prisma.student.create({
      data: {
        userId: req.user.id,
        year: "1st",              // debug default
        major: "Undeclared",      // debug default
        description: "Debug student profile",
      },
    });

    return res.status(201).json({ message: "Became student", student });
  } catch (e) {
    console.error("Error in becomeStudent:", e);
    return res.status(500).json({ error: "Failed to create student profile" });
  }
}

module.exports = { becomeResearcher, becomeStudent };
