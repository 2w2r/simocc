"use server"

import { revalidatePath } from "next/cache"

import { getSession } from "@/lib/get-session"
import prisma from "@/lib/prisma"

type AddAircraftError = {
  field: "registration" | "icaoCode" | "general"
  message: string
}

type AddAircraftResult =
  | { success: true; error?: never }
  | { error: AddAircraftError; success?: never }

export async function addAircraft(
  formData: FormData
): Promise<AddAircraftResult> {
  const session = await getSession()
  if (!session)
    return { error: { field: "general", message: "Not authenticated." } }

  const registration = (formData.get("registration") as string)
    ?.trim()
    .toUpperCase()
  const icaoCode = (formData.get("icaoCode") as string)?.trim().toUpperCase()
  const operatorSourceId = formData.get("operatorSourceId")
    ? Number(formData.get("operatorSourceId"))
    : null

  if (!registration || !icaoCode) {
    return { error: { field: "general" as const, message: "Invalid request." } }
  }

  if (!/^[A-Z0-9]{1,2}-?[A-Z0-9]{1,5}$/.test(registration)) {
    return {
      error: {
        field: "registration" as const,
        message: "Invalid registration format.",
      },
    }
  }

  if (!/^[A-Z0-9]{2,4}$/.test(icaoCode)) {
    return {
      error: {
        field: "icaoCode" as const,
        message: "Invalid ICAO Aircraft Type Designator format.",
      },
    }
  }

  try {
    await prisma.aircraft.create({
      data: {
        userId: session.user.id,
        registration,
        icaoCode,
        operatorSourceId,
      },
    })
  } catch {
    return {
      error: {
        field: "general" as const,
        message: "Aircraft already in fleet.",
      },
    }
  }

  revalidatePath("/fleet")
  return { success: true }
}

export async function removeAircraftMany(ids: string[]) {
  const session = await getSession()
  if (!session)
    return { error: { field: "general", message: "Not authenticated." } }

  await prisma.aircraft.deleteMany({
    where: {
      id: { in: ids },
      userId: session.user.id,
    },
  })

  revalidatePath("/fleet")
}

export async function searchOperators(query: string) {
  if (!query || query.length < 1) return []

  const upper = query.toUpperCase().trim()

  if (upper.includes("/")) {
    const [icaoPart, iataPart] = upper.split("/").map((s) => s.trim())
    return prisma.operatorReference.findMany({
      where: {
        AND: [
          ...(icaoPart ? [{ icaoCode: { contains: icaoPart } }] : []),
          ...(iataPart ? [{ iataCode: { contains: iataPart } }] : []),
        ],
      },
      take: 10,
    })
  }

  const codeMatches = await prisma.operatorReference.findMany({
    where: {
      OR: [
        { icaoCode: { contains: upper } },
        { iataCode: { contains: upper } },
      ],
    },
    take: 10,
  })

  const sortedCodeMatches = codeMatches.sort((a, b) => {
    const score = (op: typeof a) =>
      op.icaoCode === upper ? 0 : op.iataCode === upper ? 1 : 2
    return score(a) - score(b)
  })

  const codeMatchIds = new Set(sortedCodeMatches.map((op) => op.id))

  const nameMatches = await prisma.operatorReference.findMany({
    where: {
      name: { contains: query, mode: "insensitive" },
      id: { notIn: [...codeMatchIds] },
    },
    take: 10,
    orderBy: { name: "asc" },
  })

  const seen = new Set<string>()
  const results = []
  for (const op of [...sortedCodeMatches, ...nameMatches]) {
    if (!seen.has(op.id)) {
      seen.add(op.id)
      results.push(op)
      if (results.length === 10) break
    }
  }

  return results
}
