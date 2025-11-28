const { z } = require("zod");
const prisma = require("../db/prisma");
const { createVerificationToken, consumeVerificationToken } = require("../services/tokenService");
const { createSession, deleteSession } = require("../services/sessionService");
const { sendVerificationLink } = require("../services/emailService");
const { SESSION_COOKIE } = require("../middleware/auth");
const { hashPassword, verifyPassword } = require("../services/passwordService");
const { publicUser } = require("../utils/user");

const UCLA_EMAIL_REGEX = /^[^@]+@(?:ucla|g\.ucla)\.edu$/i;

const signupSchema = z.object({
  email: z.string().email().regex(UCLA_EMAIL_REGEX, "Must be a valid UCLA email"),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
  uclaId: z.string().min(7).optional(),
  role: z.enum(["STUDENT", "RESEARCHER"]).optional(),
});

const tokenSchema = z.object({
  token: z.string().min(10),
});

const loginSchema = z.object({
  email: z.string().email().regex(UCLA_EMAIL_REGEX),
  password: z.string().min(8),
});

async function requestSignup(req, res) {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, name, uclaId, password, role } = parsed.data;
  const passwordHash = await hashPassword(password);
  const baseData = {
    name: name ?? null,
    passwordHash,
    emailVerifiedAt: null,
    role: role || "STUDENT",
  };
  if (uclaId) {
    baseData.uclaId = uclaId;
  }

  let user;
  try {
    user = await prisma.user.create({
      data: { email, ...baseData },
    });
  } catch (err) {
    if (err?.code !== "P2002") {
      throw err;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing?.emailVerifiedAt) {
      return res.status(409).json({ error: "Account already exists. Please log in." });
    }

    user = await prisma.user.update({
      where: { email },
      data: baseData,
    });
  }

  const rawToken = await createVerificationToken({ userId: user.id, type: "SIGNUP" });
  const url = `${process.env.APP_BASE_URL ?? "http://localhost:3000"}/verify-signup?token=${rawToken}`;
  sendVerificationLink({ email, url, type: "SIGNUP" });

  res.status(202).json({ message: "Verification link sent (check server logs)" });
}

async function verifySignup(req, res) {
  const parsed = tokenSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Token required" });

  let token;
  try {
    token = await consumeVerificationToken(parsed.data.token, "SIGNUP");
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  await prisma.user.update({
    where: { id: token.userId },
    data: { emailVerifiedAt: new Date() },
  });

  return res.json({ message: "Email verified. You can now log in." });
}

async function login(req, res) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !user.emailVerifiedAt) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const passwordValid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!passwordValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const { raw, expiresAt } = await createSession(user.id);

  res
    .cookie(SESSION_COOKIE, raw, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
    })
    .json({ user: publicUser(user) });
}

async function getMe(req, res) {
  res.json({ user: req.user });
}

async function logout(req, res) {
  if (req.sessionId) {
    await deleteSession(req.sessionId);
  }
  res.clearCookie(SESSION_COOKIE).json({ ok: true });
}

module.exports = {
  requestSignup,
  verifySignup,
  login,
  getMe,
  logout,
};
