import { SimbriefForm } from "@/components/ops/settings/connections/simbrief-form"
import { getSession } from "@/lib/get-session"
import prisma from "@/lib/prisma"

export async function SimbriefFormWrapper() {
    const session = await getSession()
    if (!session) return null

    const preferences = await prisma.userPreferences.findUnique({
        where: { userId: session.user.id },
        select: { simbriefPilotId: true },
    })

    return <SimbriefForm currentPilotId={preferences?.simbriefPilotId ?? null} />
}