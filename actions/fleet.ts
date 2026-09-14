"use server"

import { revalidatePath } from "next/cache"

import { getSession } from "@/lib/get-session"
import prisma from "@/lib/prisma"
import {
  Aircraft,
  aircraftQueryArgs,
  customAircraftTypeQueryArgs,
  CustomAircraftType,
  removableAircraftTypeQueryArgs,
  customOperatorQueryArgs,
  CustomOperator,
  removableOperatorQueryArgs,
} from "@/components/ops/fleet/types"

type AddAircraftError = {
  field: "registration" | "general"
  message: string
}

type AddAircraftResult =
  | { success: true; error?: never }
  | { error: AddAircraftError; success?: never }

type ActionError = { field: string; message: string }

type RemoveCustomAircraftTypeResult = {
  removedCount: number
  blocked: { id: string; label: string }[]
}

type RemoveCustomOperatorResult = {
  removedCount: number
  blocked: { id: string; name: string }[]
}

const AIRCRAFT_TYPE_RESULT_LIMIT = 20
const AIRCRAFT_TYPE_FETCH_LIMIT = 100

function scoreStringMatch(value: string, query: string): number {
  const lowerValue = value.toLowerCase()
  const lowerQuery = query.toLowerCase()
  if (lowerValue === lowerQuery) return 0
  if (lowerValue.startsWith(lowerQuery)) return 1
  return 2
}

function scoreTypeCodeMatch(
  type: { icaoCode: string },
  upper: string
): number {
  return scoreStringMatch(type.icaoCode, upper)
}

function scoreTypeNameMatch(
  type: { manufacturer: string; model: string },
  tokens: string[]
): number {
  const manufacturer = type.manufacturer.toLowerCase()
  const model = type.model.toLowerCase()
  return tokens.some(
    (token) => manufacturer.startsWith(token) || model.startsWith(token)
  )
    ? 0
    : 1
}

function compareTypeName(
  a: { manufacturer: string; model: string },
  b: { manufacturer: string; model: string }
): number {
  return (
    a.manufacturer.localeCompare(b.manufacturer) ||
    a.model.localeCompare(b.model)
  )
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

export async function getFleetAircraftById(aircraftId: string) {
  const session = await getSession()
  if (!session) return null

  return prisma.aircraft.findFirst({
    where: { id: aircraftId, userId: session.user.id },
    select: { id: true, registration: true },
  })
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
  const aircraftTypeId = (formData.get("aircraftTypeId") as string)?.trim() || null
  const operatorId = (formData.get("operatorId") as string)?.trim() || null

  if (!registration || !aircraftTypeId || !operatorId)
    return { error: { field: "general" as const, message: "Invalid request." } }

  if (!/^[A-Z0-9]{1,2}-?[A-Z0-9]{1,5}$/.test(registration))
    return {
      error: {
        field: "registration" as const,
        message: "Invalid registration format.",
      },
    }

  try {
    await prisma.aircraft.create({
      data: {
        userId: session.user.id,
        registration,
        aircraftTypeId,
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

// Reference types plus the current user's own custom types.
function aircraftTypeScope(userId: string | undefined) {
  return { OR: [{ userId: null }, { userId }] }
}

const AIRCRAFT_TYPE_SUGGESTION_LIMIT = 10

type AircraftTypeSuggestionField = "icaoCode" | "manufacturer" | "model"

export async function suggestAircraftTypeField(
  field: AircraftTypeSuggestionField,
  query: string,
  context?: { manufacturer?: string }
): Promise<string[]> {
  const trimmed = query?.trim()
  if (!trimmed) return []

  const session = await getSession()

  const rows = await prisma.aircraftTypeReference.findMany({
    where: {
      AND: [
        aircraftTypeScope(session?.user.id),
        { [field]: { contains: trimmed, mode: "insensitive" } },
        ...(field === "model" && context?.manufacturer
          ? [{ manufacturer: context.manufacturer }]
          : []),
      ],
    },
    distinct: [field],
    select: { icaoCode: true, manufacturer: true, model: true },
    orderBy: { [field]: "asc" },
    take: AIRCRAFT_TYPE_FETCH_LIMIT,
  })

  return rows
    .map((row) => row[field])
    .sort(
      (a, b) =>
        scoreStringMatch(a, trimmed) - scoreStringMatch(b, trimmed) ||
        a.localeCompare(b)
    )
    .slice(0, AIRCRAFT_TYPE_SUGGESTION_LIMIT)
}

export async function searchAircraftTypes(query: string) {
  if (!query || query.trim().length < 1) return []

  const session = await getSession()

  const trimmed = query.trim()
  const upper = trimmed.toUpperCase()
  const tokens = trimmed.split(/\s+/).filter(Boolean)
  const typeScope = aircraftTypeScope(session?.user.id)

  const codeMatches = await prisma.aircraftTypeReference.findMany({
    where: {
      AND: [typeScope, { icaoCode: { contains: upper } }],
    },
    take: AIRCRAFT_TYPE_FETCH_LIMIT,
    orderBy: [{ icaoCode: "asc" }, { manufacturer: "asc" }, { model: "asc" }],
  })

  const sortedCodeMatches = codeMatches.sort(
    (a, b) =>
      scoreTypeCodeMatch(a, upper) - scoreTypeCodeMatch(b, upper) ||
      a.icaoCode.localeCompare(b.icaoCode) ||
      compareTypeName(a, b)
  )

  const codeMatchIds = new Set(sortedCodeMatches.map((type) => type.id))

  const lowerTokens = tokens.map((token) => token.toLowerCase())

  const nameMatches = await prisma.aircraftTypeReference.findMany({
    where: {
      AND: [
        typeScope,
        { id: { notIn: [...codeMatchIds] } },
        ...tokens.map((token) => ({
          OR: [
            { icaoCode: { contains: token.toUpperCase() } },
            { manufacturer: { contains: token, mode: "insensitive" as const } },
            { model: { contains: token, mode: "insensitive" as const } },
          ],
        })),
      ],
    },
    take: AIRCRAFT_TYPE_FETCH_LIMIT,
    orderBy: [{ manufacturer: "asc" }, { model: "asc" }],
  })

  const sortedNameMatches = nameMatches.sort(
    (a, b) =>
      scoreTypeNameMatch(a, lowerTokens) - scoreTypeNameMatch(b, lowerTokens) ||
      compareTypeName(a, b)
  )

  return mergeDeduped(sortedCodeMatches, sortedNameMatches, AIRCRAFT_TYPE_RESULT_LIMIT)
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

export async function addCustomAircraftType(
  formData: FormData
): Promise<{ success: true; error?: never } | { error: ActionError; success?: never }> {
  const session = await getSession()
  if (!session)
    return { error: { field: "general", message: "Not authenticated." } }

  const icaoCode = (formData.get("icaoCode") as string)?.trim().toUpperCase()
  // Reference manufacturers are uppercase; normalise so customs sort and group with them.
  const manufacturer = (formData.get("manufacturer") as string)?.trim().toUpperCase()
  const model = (formData.get("model") as string)?.trim()

  if (!icaoCode || !/^[A-Z0-9]{2,4}$/.test(icaoCode))
    return {
      error: {
        field: "icaoCode",
        message: "Invalid ICAO Aircraft Type Designator format.",
      },
    }

  if (!manufacturer)
    return { error: { field: "manufacturer", message: "Please enter a manufacturer." } }

  if (!model)
    return { error: { field: "model", message: "Please enter a model." } }

  try {
    await prisma.aircraftTypeReference.create({
      data: {
        userId: session.user.id,
        icaoCode,
        manufacturer,
        model,
      },
    })
  } catch {
    return {
      error: { field: "general", message: "Aircraft type already exists." },
    }
  }

  revalidatePath("/fleet")
  return { success: true }
}

export async function getCustomAircraftTypes(): Promise<CustomAircraftType[]> {
  const session = await getSession()
  if (!session) return []

  const types = await prisma.aircraftTypeReference.findMany({
    where: { userId: session.user.id },
    orderBy: [{ manufacturer: "asc" }, { model: "asc" }],
    ...customAircraftTypeQueryArgs,
  })

  return types.map(({ _count, ...type }) => ({
    ...type,
    inUse: _count.aircraft > 0,
  }))
}

export async function removeCustomAircraftType(
  ids: string[]
): Promise<{ result: RemoveCustomAircraftTypeResult; error?: never } | { error: ActionError; result?: never }> {
  const session = await getSession()
  if (!session)
    return { error: { field: "general", message: "Not authenticated." } }

  const candidates = await prisma.aircraftTypeReference.findMany({
    where: { id: { in: ids }, userId: session.user.id },
    ...removableAircraftTypeQueryArgs,
  })

  const blocked = candidates
    .filter((type) => type._count.aircraft > 0)
    .map(({ id, icaoCode, manufacturer, model }) => ({
      id,
      label: `${icaoCode} ${manufacturer} ${model}`,
    }))

  const removableIds = candidates
    .filter((type) => type._count.aircraft === 0)
    .map((type) => type.id)

  if (removableIds.length > 0) {
    try {
      await prisma.aircraftTypeReference.deleteMany({
        where: { id: { in: removableIds }, userId: session.user.id },
      })
    } catch {
      return {
        error: { field: "general", message: "Failed to remove aircraft type(s)." },
      }
    }
  }

  revalidatePath("/fleet")
  return { result: { removedCount: removableIds.length, blocked } }
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
