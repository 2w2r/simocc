import { PrismaPg } from "@prisma/adapter-pg"

import "dotenv/config"

import { PrismaClient } from "@/lib/generated/prisma/client"

// Create adapter for pre-configuration
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

// Create PrismaClient on globalThis so the client is reused and not recreated each time
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Pre-configure prisma with adapter
const prisma = globalForPrisma.prisma || new PrismaClient({ adapter })

// Apply global caching to non-production env only as no hot reload on Railway production env
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default prisma
