#!/usr/bin/env node
const readline = require("readline");
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to run in production");
  process.exit(1);
}
if (process.env.ENABLE_DEV_TOOLS !== "true") {
  console.error("ENABLE_DEV_TOOLS must be 'true' to run this script");
  process.exit(1);
}
const REQUIRED_DEV_SECRET = process.env.DEV_SECRET; // optional; if set, must pass --secret

function ask(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(prompt, (ans) => { rl.close(); resolve(ans); }));
}

async function findUser({ email, id }) {
  if (email) return prisma.user.findUnique({ where: { email } });
  if (id) return prisma.user.findUnique({ where: { id: Number(id) } });
  return null;
}

async function deleteUserAndRelated(userId) {
    return prisma.$transaction([
    prisma.post.deleteMany({ where: { researcherId: userId } }),
    prisma.session.deleteMany({ where: { userId } }),
    prisma.verificationToken.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
}

(async () => {
  try {
    const args = process.argv.slice(2);
    const emailArg = args.find(a => a.startsWith("--email="));
    const idArg = args.find(a => a.startsWith("--id="));
    const secretArg = args.find(a => a.startsWith("--secret="));

    if (!emailArg && !idArg) {
      console.error("Usage: node deleteUser.js --email=someone@example.com   OR   --id=123");
      process.exit(2);
    }

    if (REQUIRED_DEV_SECRET) {
      if (!secretArg) {
        console.error("DEV_SECRET is set in env; you must supply --secret=VALUE");
        process.exit(1);
      }
      const provided = secretArg.split("=")[1];
      if (provided !== REQUIRED_DEV_SECRET) {
        console.error("Invalid --secret value");
        process.exit(1);
      }
    }

    const email = emailArg ? emailArg.split("=")[1] : null;
    const id = idArg ? idArg.split("=")[1] : null;

    const user = await findUser({ email, id });
    if (!user) {
      console.error("User not found");
      process.exit(1);
    }

    console.log("Found user:", { id: user.id, email: user.email, name: user.name, uclaId: user.uclaId });
    const confirm = await ask(`Type DELETE to permanently remove this user (id=${user.id}): `);
    if (confirm !== "DELETE") {
      console.log("Aborted.");
      process.exit(0);
    }

    await deleteUserAndRelated(user.id);
    console.log("Deleted user and related records for user id:", user.id);
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    try { await prisma.$disconnect(); } catch (_) {}
    process.exit(1);
  }
})();