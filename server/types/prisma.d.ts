import type { PrismaClient } from "../generated/prisma";

declare module "../db/prisma" {
  const prisma: PrismaClient;
  export default prisma;
}
