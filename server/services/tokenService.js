const crypto = require("crypto");
const prisma = require("../db/prisma");

const hash = value => crypto.createHash("sha256").update(value).digest("hex");

const encodeMetadata = metadata => {
  if (!metadata || Object.keys(metadata).length === 0) return "";
  const json = JSON.stringify(metadata);
  return Buffer.from(json, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

const decodeMetadata = encoded => {
  if (!encoded) return {};
  const paddingLength = (4 - (encoded.length % 4)) % 4;
  const padded = encoded + "=".repeat(paddingLength);
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  try {
    const json = Buffer.from(base64, "base64").toString("utf8");
    return json ? JSON.parse(json) : {};
  } catch {
    return {};
  }
};

const buildRawToken = metadata => {
  const random = crypto.randomBytes(32).toString("hex");
  const encodedMetadata = encodeMetadata(metadata);
  return encodedMetadata ? `${random}.${encodedMetadata}` : random;
};

const extractMetadataFromRaw = raw => {
  if (typeof raw !== "string") return {};
  const separatorIndex = raw.indexOf(".");
  if (separatorIndex === -1) return {};
  const encoded = raw.slice(separatorIndex + 1);
  if (!encoded) return {};
  return decodeMetadata(encoded);
};

async function createVerificationToken({ userId, type = "SIGNUP", ttlMinutes = 15, metadata }) {
  const raw = buildRawToken(metadata);
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

  return { token, metadata: extractMetadataFromRaw(raw) };
}

module.exports = { createVerificationToken, consumeVerificationToken };
