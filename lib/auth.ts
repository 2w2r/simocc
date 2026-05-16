import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"

import prisma from "@/lib/prisma"

// Use preconfigured singleton from prisma.ts
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // postgresql for Railway
    usePlural: false, // Singular name matching for the schema @@map names
  }),
  emailAndPassword: {
    enabled: true, // Allow email/password auth
  }, // TODO: SOCIAL PROVIDERS
  plugins: [nextCookies()], // nextCookies plugin for cookie setting for server action use
})

export type Session = typeof auth.$Infer.Session
