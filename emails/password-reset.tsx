import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Tailwind,
  Text,
} from "react-email"

import { RESET_PASSWORD_TOKEN_EXPIRES_IN_S } from "@/lib/constants"

interface PasswordResetEmailProps {
  resetUrl: string
  expiresIn?: string
}

export function expiryDecode(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const parts = []
  if (h > 0) parts.push(`${h} ${h === 1 ? "hour" : "hours"}`)
  if (m > 0) parts.push(`${m} ${m === 1 ? "minute" : "minutes"}`)
  if (s > 0) parts.push(`${s} ${s === 1 ? "second" : "seconds"}`)
  return parts.join(", ")
}

export function PasswordResetEmail({
  resetUrl,
  expiresIn = `${expiryDecode(RESET_PASSWORD_TOKEN_EXPIRES_IN_S)}`,
}: PasswordResetEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Reset your SIMOCC password</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="p-8 max-w-md min-w-64 flex gap-20">
            <Heading className="text-3xl">SIMOCC</Heading>
            <Text className="text-base text-gray-700">
              A password reset was requested. Click the link below to proceed.
            </Text>
            <div className="mt-6">
              <Button
                href={resetUrl}
                className="bg-black text-white text-sm px-4 py-2 rounded-lg"
              >
                Reset Password
              </Button>
              <Text className="text-xs text-gray-500">
                This link will expire in {expiresIn}.
              </Text>
            </div>
            <Hr className="border-gray-300 my-6" />
            <Text className="text-xs text-gray-500">
              If this request was not made by you, you can ignore this email.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

PasswordResetEmail.PreviewProps = {
  resetUrl: "https://simocc.com/reset-password?token=abc123xyz",
  expiresIn: `${expiryDecode(RESET_PASSWORD_TOKEN_EXPIRES_IN_S)}`,
} satisfies PasswordResetEmailProps

export default PasswordResetEmail
