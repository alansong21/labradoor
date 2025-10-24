const crypto = require("crypto");
const prisma = require("../db/prisma");

const hash = value => crypto.createHash("sha256").update(value).digest("hex");

async function createVerificationToken({ userId, type = "SIGNUP", ttlMinutes = 15 }) {
  const raw = crypto.randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      userId,
      type,
      tokenHash: hash(raw),
      expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
    },
  });
  return raw;
}

async function consumeVerificationToken(raw, type = "SIGNUP") {
  const token = await prisma.verificationToken.findUnique({
    where: { tokenHash: hash(raw) },
  });

  if (!token || token.type !== type) throw new Error("Invalid token");
  if (token.consumedAt) throw new Error("Token already used");
  if (token.expiresAt < new Date()) throw new Error("Token expired");

  await prisma.verificationToken.update({
    where: { tokenHash: token.tokenHash },
    data: { consumedAt: new Date() },
  });

  return token;
}

module.exports = { createVerificationToken, consumeVerificationToken };
