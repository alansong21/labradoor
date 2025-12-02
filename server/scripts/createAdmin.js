/**
 * Script to create an admin user
 * Usage: node scripts/createAdmin.js <email> <password>
 */

const { hashPassword } = require("../services/passwordService");
const prisma = require("../db/prisma");

async function createAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error("Usage: node scripts/createAdmin.js <email> <password>");
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Password must be at least 8 characters long");
    process.exit(1);
  }

  try {
    const passwordHash = await hashPassword(password);

    const admin = await prisma.admin.upsert({
      where: { email },
      update: { passwordHash },
      create: { email, passwordHash },
    });

    console.log(`✅ Admin user created/updated: ${admin.email}`);
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
