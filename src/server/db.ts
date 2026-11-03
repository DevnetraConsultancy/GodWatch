import "server-only";
import { PrismaClient } from "@prisma/client";

/**
 * One Prisma client per process. Cached on globalThis in every environment:
 * Next bundles server components and server actions separately, and without
 * this each bundle would open its own connection pool.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

globalForPrisma.prisma = prisma;
