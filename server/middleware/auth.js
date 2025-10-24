const crypto = require("crypto");
const prisma = require("../db/prisma");

const SESSION_COOKIE = "session";

async function authMiddleware(req, res, next) {
    const token = req.cookies?.[SESSION_COOKIE];
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const session = await prisma.session.findUnique({
        where: { tokenHash },
        include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
        return res.status(401).json({ error: "Session expired" });
    }

    const { passwordHash, ...user } = session.user;
    req.user = user;
    req.sessionId = session.id;
    next();
}

module.exports = { authMiddleware, SESSION_COOKIE };
