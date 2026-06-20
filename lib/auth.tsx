import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"
import { Resend } from "resend"

import { PasswordResetEmail } from "@/emails/password-reset"
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  RESET_PASSWORD_TOKEN_EXPIRES_IN_S,
} from "@/lib/constants"
import prisma from "@/lib/prisma"

const resend = new Resend(process.env.RESEND_API_KEY)

// Use preconfigured singleton from prisma.ts
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // postgresql for Railway
    usePlural: false, // Singular name matching for the schema @@map names
  }),
  emailAndPassword: {
    enabled: true, // Allow email/password auth with below password criteria
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: PASSWORD_MAX_LENGTH,
    // Password reset via Resend and React Email
    sendResetPassword: async ({ user, url }) => {
      void resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: user.email,
        subject: "SIMOCC Password Reset",
        react: <PasswordResetEmail resetUrl={url} />,
      })
    },
    resetPasswordTokenExpiresIn: RESET_PASSWORD_TOKEN_EXPIRES_IN_S,
  }, // TODO: SOCIAL PROVIDERS
  plugins: [nextCookies()], // nextCookies plugin for cookie setting for server action use
})

export type Session = typeof auth.$Infer.Session
