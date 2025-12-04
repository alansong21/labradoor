/**
 * Auth Middleware
 * Verifies the session cookie attached to requests.
 * Attaches the authenticated user to the request object if valid.
 */
const crypto = require("crypto");
const prisma = require("../db/prisma");

const SESSION_COOKIE = "session";

const resolveRoleFromUser = user => {
    if (!user) return null;
    if (user.researcher) return "RESEARCHER";
    if (user.student) return "STUDENT";
    return null;
};

async function authMiddleware(req, res, next) {
    const token = req.cookies?.[SESSION_COOKIE];
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const session = await prisma.session.findUnique({
        where: { tokenHash },
        include: {
            user: {
                include: {
                    student: true,
                    researcher: true,
                },
            },
        },
    });

    if (!session || session.expiresAt < new Date()) {
        return res.status(401).json({ error: "Session expired" });
    }

    const { passwordHash, ...user } = session.user;
    req.user = user;
    req.userRole = resolveRoleFromUser(user);
    req.sessionId = session.id;
    next();
}

const requireRole = (...roles) => {
    const allowed = roles.map(role => role.toUpperCase());
    return (req, res, next) => {
        const role = req.userRole?.toUpperCase();
        if (!role || !allowed.includes(role)) {
            return res.status(403).json({ error: "Forbidden" });
        }
        next();
    };
};

module.exports = { authMiddleware, requireRole, SESSION_COOKIE };
