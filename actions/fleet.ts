"use server"

import { revalidatePath } from "next/cache"

import { getSession } from "@/lib/get-session"
import prisma from "@/lib/prisma"
import { Prisma } from "@/lib/generated/prisma/client"
import {
  AircraftStatus,
  AircraftTypeDescription,
  AircraftTypeEngineCategory,
} from "@/lib/generated/prisma/enums"
import {
  APPROACH_CATEGORIES,
  ARC_LETTER_DEFINITIONS,
  ARC_NUMBER_DEFINITIONS,
  RFF_DEFINITIONS,
} from "@/components/ops/fleet/aircraft/reference-definitions"
import {
  FLIGHT_PLAN_TEXT_FIELDS,
  isHttpUrl,
  REGISTRATION_EXAMPLES,
  REGISTRATION_PATTERN,
  normalizeRegistration,
} from "@/components/ops/fleet/aircraft/editing/shared"
import { type RemarkEntry, parseRemarks } from "@/components/ops/fleet/flight-plan-remarks"
import {
  Aircraft,
  AircraftDetailsInput,
  AircraftFlightPlanFields,
  AircraftType,
  AircraftTypeSupplement,
  Operator,
  SupplementValues,
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

export async function getFleetAircraftById(aircraftId: string): Promise<Aircraft | null> {
  const session = await getSession()
  if (!session) return null

  return prisma.aircraft.findFirst({
    where: { id: aircraftId, userId: session.user.id },
    include: { aircraftType: true, operator: true },
  })
}

// User override first, else global row (userId null).
async function findEffectiveSupplement(icaoCode: string, userId: string | undefined) {
  return prisma.aircraftTypeSupplement.findFirst({
    where: { icaoCode, OR: [{ userId: null }, ...(userId ? [{ userId }] : [])] },
    orderBy: { userId: { sort: "asc", nulls: "last" } },
  })
}

export async function getAircraftTypeSupplement(icaoCode: string): Promise<AircraftTypeSupplement | null> {
  if (typeof icaoCode !== "string") return null
  const session = await getSession()
  return findEffectiveSupplement(icaoCode, session?.user.id)
}

// Owner-scoped: action callable with any id.
export async function getAircraftFlightPlanFields(aircraftId: string): Promise<AircraftFlightPlanFields | null> {
  const session = await getSession()
  if (!session || typeof aircraftId !== "string") return null
  return prisma.aircraftFlightPlanFields.findFirst({
    where: { aircraftId, aircraft: { userId: session.user.id } },
  })
}

export async function addAircraft(
  formData: FormData
): Promise<AddAircraftResult> {
  const session = await getSession()
  if (!session)
    return { error: { field: "general", message: "Not authenticated." } }

  const registration = normalizeRegistration(formData.get("registration") as string)
  const aircraftTypeId = (formData.get("aircraftTypeId") as string)?.trim() || null
  const operatorId = (formData.get("operatorId") as string)?.trim() || null

  if (!registration || !aircraftTypeId || !operatorId)
    return { error: { field: "general" as const, message: "Invalid request." } }

  if (!REGISTRATION_PATTERN.test(registration))
    return {
      error: {
        field: "registration" as const,
        message: `Registration format error: ${REGISTRATION_EXAMPLES}`,
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

export async function setAircraftFlags(
  aircraftId: string,
  flags: { favourite?: boolean; fictional?: boolean }
): Promise<{ success: true; error?: never } | { error: ActionError; success?: never }> {
  const session = await getSession()
  if (!session)
    return { error: { field: "general", message: "Not authenticated." } }
  if (typeof aircraftId !== "string")
    return { error: { field: "general", message: "Invalid request." } }

  const flag = (value: unknown) => (typeof value === "boolean" ? value : undefined)
  const { count } = await prisma.aircraft.updateMany({
    where: { id: aircraftId, userId: session.user.id },
    data: { favourite: flag(flags?.favourite), fictional: flag(flags?.fictional) },
  })
  if (count === 0)
    return { error: { field: "general", message: "Aircraft not found." } }

  revalidatePath("/fleet")
  revalidatePath(`/fleet/${aircraftId}`)
  return { success: true }
}

// Action args untrusted at runtime: non-string becomes null.
const blankToNull = (value: unknown) => (typeof value === "string" && value.trim()) || null

const oneOf = <T extends string | number>(value: unknown, allowed: readonly T[]): T | null =>
  allowed.includes(value as T) ? (value as T) : null

// Rebuilt per field: no extra JSON keys stored.
const sanitizeRemarks = (rmk: unknown): RemarkEntry[] =>
  parseRemarks(rmk as AircraftFlightPlanFields["rmk"])
    .map(({ id, text, tags }) => ({
      id,
      text: text.trim(),
      tags: [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))],
    }))
    .filter((entry) => entry.text)

const sameSupplement = (a: SupplementValues, b: SupplementValues | null) =>
  a.aerodromeReferenceCodeNumber === (b?.aerodromeReferenceCodeNumber ?? null) &&
  a.aerodromeReferenceCodeLetter === (b?.aerodromeReferenceCodeLetter ?? null) &&
  a.rescueFireFightingCategory === (b?.rescueFireFightingCategory ?? null)

export async function updateAircraftDetails(
  aircraftId: string,
  input: AircraftDetailsInput
): Promise<{ success: true; error?: never } | { error: ActionError; success?: never }> {
  const session = await getSession()
  if (!session)
    return { error: { field: "general", message: "Not authenticated." } }
  const userId = session.user.id

  const operatorId = blankToNull(input?.operatorId)
  const aircraftTypeId = blankToNull(input?.aircraftTypeId)
  if (typeof aircraftId !== "string" || !operatorId || !aircraftTypeId)
    return { error: { field: "general", message: "Invalid request." } }

  const registration = normalizeRegistration(blankToNull(input.registration))
  if (!REGISTRATION_PATTERN.test(registration))
    return { error: { field: "registration", message: `Registration format error: ${REGISTRATION_EXAMPLES}` } }

  if (!Object.values(AircraftStatus).includes(input.status))
    return { error: { field: "status", message: "Invalid status." } }

  // Rendered in <img src> / <a href>: http(s) only.
  const imageUrl = blankToNull(input.imageUrl)
  const imagePageUrl = blankToNull(input.imagePageUrl)
  if (imageUrl && !isHttpUrl(imageUrl))
    return { error: { field: "imageUrl", message: "Image URL format error" } }
  if (imagePageUrl && !isHttpUrl(imagePageUrl))
    return { error: { field: "imagePageUrl", message: "Source page URL format error" } }

  const { deliveryDate } = input
  if (deliveryDate !== null && !(deliveryDate instanceof Date && !Number.isNaN(deliveryDate.getTime())))
    return { error: { field: "deliveryDate", message: "Invalid delivery date." } }

  // Operator/type: reference rows or own customs only.
  const [aircraft, operator, aircraftType] = await Promise.all([
    prisma.aircraft.findFirst({ where: { id: aircraftId, userId }, select: { id: true } }),
    prisma.operatorReference.findFirst({
      where: { id: operatorId, OR: [{ userId: null }, { userId }] },
      select: { id: true },
    }),
    prisma.aircraftTypeReference.findFirst({
      where: { id: aircraftTypeId, ...aircraftTypeScope(userId) },
      select: { icaoCode: true },
    }),
  ])
  if (!aircraft)
    return { error: { field: "general", message: "Aircraft not found." } }
  if (!operator)
    return { error: { field: "operator", message: "Operator not found." } }
  if (!aircraftType)
    return { error: { field: "aircraftType", message: "Aircraft type not found." } }

  const supplement: SupplementValues = {
    aerodromeReferenceCodeNumber: oneOf(
      input.supplement?.aerodromeReferenceCodeNumber,
      ARC_NUMBER_DEFINITIONS.rows.map((row) => row.code)
    ),
    aerodromeReferenceCodeLetter: oneOf(
      input.supplement?.aerodromeReferenceCodeLetter,
      ARC_LETTER_DEFINITIONS.rows.map((row) => row.code)
    ),
    rescueFireFightingCategory: oneOf(
      input.supplement?.rescueFireFightingCategory,
      RFF_DEFINITIONS.rows.map((row) => row.code)
    ),
  }

  // Whitelist keys: spread payload could inject `aircraftId`.
  const fpl: Partial<AircraftDetailsInput["flightPlanFields"]> = input.flightPlanFields ?? {}
  const flightPlanFields = {
    ...Object.fromEntries(FLIGHT_PLAN_TEXT_FIELDS.map((key) => [key, blankToNull(fpl[key])])),
    per: oneOf(blankToNull(fpl.per), APPROACH_CATEGORIES),
    rmk: sanitizeRemarks(fpl.rmk),
  }
  const { rmk, ...fplText } = flightPlanFields
  const fplEmpty = rmk.length === 0 && Object.values(fplText).every((value) => value === null)

  // Only when different: else global values frozen into user copy.
  const { icaoCode } = aircraftType
  const effectiveSupplement = await findEffectiveSupplement(icaoCode, userId)
  const writeSupplement = !sameSupplement(supplement, effectiveSupplement)

  // ARC = pair: both parts or neither. Checked only when edited: existing
  // half data never blocks unrelated saves.
  const halfArc =
    (supplement.aerodromeReferenceCodeNumber === null) !== (supplement.aerodromeReferenceCodeLetter === null)
  if (writeSupplement && halfArc)
    return { error: { field: "arc", message: "ARC format error: 1A" } }

  try {
    await prisma.$transaction([
      prisma.aircraft.update({
        where: { id: aircraftId, userId },
        data: {
          registration,
          operatorId,
          aircraftTypeId,
          aircraftTypeName: blankToNull(input.aircraftTypeName),
          engineTypeName: blankToNull(input.engineTypeName),
          msn: blankToNull(input.msn),
          lineNumber: blankToNull(input.lineNumber),
          deliveryDate,
          status: input.status,
          imageUrl,
          imagePageUrl,
          imageAuthor: blankToNull(input.imageAuthor),
        },
      }),
      ...(writeSupplement
        ? [
          prisma.aircraftTypeSupplement.upsert({
            where: { userId_icaoCode: { userId, icaoCode } },
            create: { userId, icaoCode, ...supplement },
            update: supplement,
          }),
        ]
        : []),
      fplEmpty
        ? prisma.aircraftFlightPlanFields.deleteMany({ where: { aircraftId } })
        : prisma.aircraftFlightPlanFields.upsert({
          where: { aircraftId },
          create: { aircraftId, ...flightPlanFields },
          update: flightPlanFields,
        }),
    ])
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      return {
        error: {
          // Client marks registration, operator, type cells.
          field: "duplicate",
          message: "This aircraft already exists in your fleet.",
        },
      }
    return { error: { field: "general", message: "Failed to save aircraft." } }
  }

  revalidatePath("/fleet")
  revalidatePath(`/fleet/${aircraftId}`)
  return { success: true }
}

const AIRCRAFT_NAME_SUGGESTION_LIMIT = 10
const AIRCRAFT_NAME_FETCH_LIMIT = 500

export async function suggestAircraftNameField(
  field: "aircraftTypeName" | "engineTypeName",
  icaoCode: string,
  query: string
): Promise<string[]> {
  // `field` becomes column key: whitelist.
  if (field !== "aircraftTypeName" && field !== "engineTypeName") return []
  if (typeof icaoCode !== "string" || typeof query !== "string") return []
  const session = await getSession()
  if (!session) return []

  const trimmed = query.trim()
  const rows = await prisma.aircraft.findMany({
    where: {
      userId: session.user.id,
      ...(trimmed
        ? { [field]: { contains: trimmed, mode: "insensitive" } }
        : { [field]: { not: null }, aircraftType: { icaoCode } }),
    },
    select: { [field]: true, aircraftType: { select: { icaoCode: true } } },
    take: AIRCRAFT_NAME_FETCH_LIMIT,
  })

  const stats = new Map<string, { count: number; sameType: boolean }>()
  for (const row of rows as unknown as ({ aircraftType: { icaoCode: string } } & Record<typeof field, string>)[]) {
    const value = row[field]
    const entry = stats.get(value) ?? { count: 0, sameType: false }
    entry.count++
    entry.sameType ||= row.aircraftType.icaoCode === icaoCode
    stats.set(value, entry)
  }

  return [...stats.entries()]
    .sort(
      ([a, sa], [b, sb]) =>
        Number(sb.sameType) - Number(sa.sameType) || sb.count - sa.count || a.localeCompare(b)
    )
    .slice(0, AIRCRAFT_NAME_SUGGESTION_LIMIT)
    .map(([value]) => value)
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
): Promise<{ success: true; aircraftType: AircraftType; error?: never } | { error: ActionError; success?: never }> {
  const session = await getSession()
  if (!session)
    return { error: { field: "general", message: "Not authenticated." } }

  const icaoCode = (formData.get("icaoCode") as string)?.trim().toUpperCase()
  // Reference manufacturers are uppercase; normalise so customs sort and group with them.
  const manufacturer = (formData.get("manufacturer") as string)?.trim().toUpperCase()
  const model = (formData.get("model") as string)?.trim()
  const description = oneOf(
    (formData.get("description") as AircraftTypeDescription | null) || null,
    Object.values(AircraftTypeDescription)
  )
  const engineCategory = oneOf(
    (formData.get("engineCategory") as AircraftTypeEngineCategory | null) || null,
    Object.values(AircraftTypeEngineCategory)
  )
  const engineCountRaw = blankToNull(formData.get("engineCount"))?.toUpperCase() ?? null
  const engineCount = engineCountRaw && /^[0-9C]$/.test(engineCountRaw) ? engineCountRaw : null

  if (!icaoCode || !/^[A-Z0-9]{2,4}$/.test(icaoCode))
    return {
      error: {
        field: "icaoCode",
        message: "Type designator format error: A320, B737, C172",
      },
    }

  if (!manufacturer)
    return { error: { field: "manufacturer", message: "Please enter a manufacturer." } }

  if (!model)
    return { error: { field: "model", message: "Please enter a model." } }

  let aircraftType: AircraftType
  try {
    aircraftType = await prisma.aircraftTypeReference.create({
      data: {
        userId: session.user.id,
        icaoCode,
        manufacturer,
        model,
        description,
        engineCategory,
        engineCount,
      },
    })
  } catch {
    return {
      error: { field: "general", message: "Aircraft type already exists." },
    }
  }

  revalidatePath("/fleet")
  return { success: true, aircraftType }
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
): Promise<{ success: true; operator: Operator; error?: never } | { error: ActionError; success?: never }> {
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

  let operator: Operator
  try {
    operator = await prisma.operatorReference.create({
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
  return { success: true, operator }
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
