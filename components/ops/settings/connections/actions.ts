"use server"

import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function saveSimbriefPilotId(pilotId: string): Promise<{ error?: string }> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { error: "Not authenticated." }

  await prisma.userPreferences.upsert({
    where: { userId: session.user.id },
    update: { simbriefPilotId: pilotId },
    create: { userId: session.user.id, simbriefPilotId: pilotId },
  })

  return {}
}

export async function removeSimbriefPilotId(): Promise<{ error?: string }> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { error: "Not authenticated." }

  await prisma.userPreferences.update({
    where: { userId: session.user.id },
    data: { simbriefPilotId: null },
  })

  return {}
}