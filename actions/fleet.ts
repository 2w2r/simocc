"use server"

import { revalidatePath } from "next/cache"

import { getSession } from "@/lib/get-session"
import prisma from "@/lib/prisma"
import { customOperatorQueryArgs, CustomOperator, removableOperatorQueryArgs, Aircraft, aircraftQueryArgs } from "@/components/ops/fleet/types"

type AddAircraftError = {
  field: "registration" | "icaoCode" | "general"
  message: string
}

type AddAircraftResult =
  | { success: true; error?: never }
  | { error: AddAircraftError; success?: never }

type ActionError = { field: string; message: string }

type RemoveCustomOperatorResult = {
  removedCount: number
  blocked: { id: string; name: string }[]
}

function scoreCodeMatch(
  operator: { icaoCode: string | null; iataCode: string | null },
  upper: string
): number {
  if (operator.icaoCode === upper) return 0
  if (operator.iataCode === upper) return 1
  return 2
}

function mergeDeduped<T extends { id: string }>(
  primary: T[],
  secondary: T[],
  limit: number
): T[] {
  const seen = new Set<string>()
  const results: T[] = []
  for (const item of [...primary, ...secondary]) {
    if (!seen.has(item.id)) {
      seen.add(item.id)
      results.push(item)
      if (results.length === limit) break
    }
  }
  return results
}

export async function getFleetAircraft(): Promise<Aircraft[]> {
  const session = await getSession()
  if (!session) return []

  const [aircraft, operators] = await Promise.all([
    prisma.aircraft.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      ...aircraftQueryArgs,
    }),
    prisma.operatorReference.findMany({
      where: { OR: [{ userId: session.user.id }, { userId: null }] },
    }),
  ])

  const operatorById = new Map(operators.map((op) => [op.id, op]))

  return aircraft.map((a) => ({
    ...a,
    operator: operatorById.get(a.operatorId)!,
  }))
}

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
  const operatorId = (formData.get("operatorId") as string)?.trim() || null

  if (!registration || !icaoCode || !operatorId)
    return { error: { field: "general" as const, message: "Invalid request." } }

  if (!/^[A-Z0-9]{1,2}-?[A-Z0-9]{1,5}$/.test(registration))
    return {
      error: {
        field: "registration" as const,
        message: "Invalid registration format.",
      },
    }

  if (!/^[A-Z0-9]{2,4}$/.test(icaoCode))
    return {
      error: {
        field: "icaoCode" as const,
        message: "Invalid ICAO Aircraft Type Designator format.",
      },
    }

  try {
    await prisma.aircraft.create({
      data: {
        userId: session.user.id,
        registration,
        icaoCode,
        operatorId,
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

  const session = await getSession()

  const upper = query.toUpperCase().trim()
  const operatorScope = {
    AND: [
      { NOT: { AND: [{ sourceId: -1 }, { userId: null }] } },
      { OR: [{ userId: null }, { userId: session?.user.id }] },
    ],
  }

  if (upper.includes("/")) {
    const [icaoPart, iataPart] = upper.split("/").map((s) => s.trim())
    return prisma.operatorReference.findMany({
      where: {
        AND: [
          operatorScope,
          ...(icaoPart ? [{ icaoCode: { contains: icaoPart } }] : []),
          ...(iataPart ? [{ iataCode: { contains: iataPart } }] : []),
        ],
      },
      take: 10,
    })
  }

  const codeMatches = await prisma.operatorReference.findMany({
    where: {
      AND: [
        operatorScope,
        {
          OR: [
            { icaoCode: { contains: upper } },
            { iataCode: { contains: upper } },
          ],
        },
      ],
    },
    take: 10,
  })

  const sortedCodeMatches = codeMatches.sort(
    (a, b) => scoreCodeMatch(a, upper) - scoreCodeMatch(b, upper)
  )

  const codeMatchIds = new Set(sortedCodeMatches.map((op) => op.id))

  const nameMatches = await prisma.operatorReference.findMany({
    where: {
      AND: [
        operatorScope,
        { name: { contains: query, mode: "insensitive" } },
        { id: { notIn: [...codeMatchIds] } },
      ],
    },
    take: 10,
    orderBy: { name: "asc" },
  })

  return mergeDeduped(sortedCodeMatches, nameMatches, 10)
}

export async function getPrivateOperator() {
  return prisma.operatorReference.findUnique({
    where: { sourceId: -1 },
  })
}

export async function addCustomOperator(
  formData: FormData
): Promise<{ success: true; error?: never } | { error: ActionError; success?: never }> {
  const session = await getSession()
  if (!session)
    return { error: { field: "general", message: "Not authenticated." } }

  const name = (formData.get("name") as string)?.trim()
  const icaoCode = (formData.get("icaoCode") as string)?.trim().toUpperCase() || null
  const iataCode = (formData.get("iataCode") as string)?.trim().toUpperCase() || null
  const callsign = (formData.get("callsign") as string)?.trim().toUpperCase() || null
  const country = (formData.get("country") as string)?.trim() || null

  if (!name)
    return { error: { field: "name", message: "Please enter an operator name." } }

  try {
    await prisma.operatorReference.create({
      data: {
        userId: session.user.id,
        name,
        icaoCode,
        iataCode,
        callsign,
        country,
        sourceId: null,
      },
    })
  } catch {
    return {
      error: { field: "general", message: "Failed to add operator." },
    }
  }

  revalidatePath("/fleet")
  return { success: true }
}

export async function getCustomOperators(): Promise<CustomOperator[]> {
  const session = await getSession()
  if (!session) return []

  const operators = await prisma.operatorReference.findMany({
    where: { userId: session.user.id },
    ...customOperatorQueryArgs,
  })

  return operators.map(({ _count, ...operator }) => ({
    ...operator,
    inUse: _count.aircraft > 0,
  }))
}

export async function removeCustomOperator(
  ids: string[]
): Promise<{ result: RemoveCustomOperatorResult; error?: never } | { error: ActionError; result?: never }> {
  const session = await getSession()
  if (!session)
    return { error: { field: "general", message: "Not authenticated." } }

  const candidates = await prisma.operatorReference.findMany({
    where: { id: { in: ids }, userId: session.user.id },
    ...removableOperatorQueryArgs,
  })

  const blocked = candidates
    .filter((operator) => operator._count.aircraft > 0)
    .map(({ id, name }) => ({ id, name }))

  const removableIds = candidates
    .filter((operator) => operator._count.aircraft === 0)
    .map((operator) => operator.id)

  if (removableIds.length > 0) {
    try {
      await prisma.operatorReference.deleteMany({
        where: { id: { in: removableIds }, userId: session.user.id },
      })
    } catch {
      return {
        error: { field: "general", message: "Failed to remove operator(s)." },
      }
    }
  }

  revalidatePath("/fleet")
  return { result: { removedCount: removableIds.length, blocked } }
}