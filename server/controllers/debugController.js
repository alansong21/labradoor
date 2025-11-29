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

module.exports = { becomeResearcher };
