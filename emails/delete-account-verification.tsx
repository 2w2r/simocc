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

import { DELETE_ACCOUNT_VERIFICATION_TOKEN_EXPIRES_IN_S } from "@/lib/constants"
import { timeDecode } from "@/lib/utils/time"

interface DeleteAccountVerificationEmailProps {
    deleteAccountUrl: string
    expiresIn?: string
}
export function DeleteAccountVerificationEmail({
    deleteAccountUrl,
    expiresIn = `${timeDecode(DELETE_ACCOUNT_VERIFICATION_TOKEN_EXPIRES_IN_S)}`,
}: DeleteAccountVerificationEmailProps) {
    return (
        <Html lang="en">
            <Head />
            <Preview>Confirm SIMOCC account deletion</Preview>
            <Tailwind>
                <Body className="bg-white font-sans">
                    <Container className="p-8 max-w-md min-w-64 flex gap-20">
                        <Heading className="text-3xl">SIMOCC</Heading>
                        <Text className="text-base text-gray-700">
                            Confirmation is required to delete your account. Click the link below to confirm.
                        </Text>
                        <div className="mt-6">
                            <Button
                                href={deleteAccountUrl}
                                className="bg-red-500 text-white text-sm px-4 py-2 rounded-lg"
                            >
                                Confirm Account Deletion
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

DeleteAccountVerificationEmail.PreviewProps = {
    deleteAccountUrl: "http://localhost:3000/account-deleted",
    expiresIn: `${timeDecode(DELETE_ACCOUNT_VERIFICATION_TOKEN_EXPIRES_IN_S)}`,
} satisfies DeleteAccountVerificationEmailProps

export default DeleteAccountVerificationEmail
