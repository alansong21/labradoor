const { PrismaClient } = require("../generated/prisma");

let prisma;
if (process.env.NODE_ENV === "production") {
    prisma = new PrismaClient();
} else {
    global._prisma = global._prisma || new PrismaClient();
    prisma = global._prisma;
}

module.exports = prisma;