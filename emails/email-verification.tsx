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

import { EMAIL_VERIFICATION_TOKEN_EXPIRES_IN_S } from "@/lib/constants"
import { timeDecode } from "@/lib/utils/time"

interface EmailVerificationEmailProps {
  verifyUrl: string
  expiresIn?: string
}
export function EmailVerificationEmail({
  verifyUrl,
  expiresIn = `${timeDecode(EMAIL_VERIFICATION_TOKEN_EXPIRES_IN_S)}`,
}: EmailVerificationEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>Verify your SIMOCC email address</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="p-8 max-w-md min-w-64 flex gap-20">
            <Heading className="text-3xl">SIMOCC</Heading>
            <Text className="text-base text-gray-700">
              Email verification is required to confirm this email address. Click the link below to verify your email address.
            </Text>
            <div className="mt-6">
              <Button
                href={verifyUrl}
                className="bg-black text-white text-sm px-4 py-2 rounded-lg"
              >
                Verify Email
              </Button>
              <Text className="text-xs text-gray-500">
                This link will expire in {expiresIn}.
              </Text>
            </div>
            <Hr className="border-gray-300 my-6" />
            <Text className="text-xs text-gray-500">
              If this action was not initiated by you, you can ignore this email.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

EmailVerificationEmail.PreviewProps = {
  verifyUrl: "https://simocc.com/verify-email?token=abc123xyz",
  expiresIn: `${timeDecode(EMAIL_VERIFICATION_TOKEN_EXPIRES_IN_S)}`,
} satisfies EmailVerificationEmailProps

export default EmailVerificationEmail
