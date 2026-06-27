import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"
import { Resend } from "resend"

import { PasswordResetEmail } from "@/emails/password-reset"
import {
  EMAIL_VERIFICATION_TOKEN_EXPIRES_IN_S,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  RESET_PASSWORD_TOKEN_EXPIRES_IN_S,
} from "@/lib/constants"
import prisma from "@/lib/prisma"
import EmailVerificationEmail from "@/emails/email-verification"
import DeleteAccountVerificationEmail from "@/emails/delete-account-verification"

const resend = new Resend(process.env.RESEND_API_KEY)

// Use preconfigured singleton from prisma.ts
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // postgresql for Railway
    usePlural: false, // Singular name matching for the schema @@map names
  }),
  emailAndPassword: {
    enabled: true, // Allow email/password auth with below password criteria
    requireEmailVerification: false, // Implement later, ignore email verification on sign-up for now
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
  },
  // TODO: SOCIAL PROVIDERS
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      void resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: user.email,
        subject: "SIMOCC Email Verification",
        react: <EmailVerificationEmail verifyUrl={url} />,
      })
    },
    expiresIn: EMAIL_VERIFICATION_TOKEN_EXPIRES_IN_S,
  },
  user: {
    changeEmail: {
      enabled: true,
    },
    deleteUser: {
      enabled: true,
      sendDeleteAccountVerification: async ({ user, url }) => {
        void resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: user.email,
          subject: "SIMOCC Account Deletion",
          react: <DeleteAccountVerificationEmail deleteAccountUrl={url} />,
        })
      },
    },
  },
  plugins: [nextCookies()], // nextCookies plugin for cookie setting for server action use
})

export type Session = typeof auth.$Infer.Session
