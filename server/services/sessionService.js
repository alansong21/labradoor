/**
 * Session Service
 * Handles creation and deletion of user sessions in the database.
 */
const crypto = require("crypto");
const prisma = require("../db/prisma");

const hash = value => crypto.createHash("sha256").update(value).digest("hex");
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

async function createSession(userId) {
  const raw = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hash(raw),
      expiresAt,
    },
  });

  return { raw, expiresAt };
}

async function deleteSession(id) {
  await prisma.session.delete({ where: { id } }).catch(() => { });
}

module.exports = { createSession, deleteSession };
