import {
  Prisma,
  AircraftFlightPlanFields as PrismaAircraftFlightPlanFields,
  AircraftTypeReference,
  AircraftTypeSupplement as PrismaAircraftTypeSupplement,
  OperatorReference,
} from "@/lib/generated/prisma/client"

export const aircraftQueryArgs = {
  include: { aircraftType: true },
} satisfies Prisma.AircraftFindManyArgs

type AircraftWithType = Prisma.AircraftGetPayload<typeof aircraftQueryArgs>

export type AircraftType = AircraftTypeReference

export type AircraftTypeSupplement = PrismaAircraftTypeSupplement

export type Operator = OperatorReference

export type Aircraft = AircraftWithType & { operator: Operator }

export type AircraftFlightPlanFields = PrismaAircraftFlightPlanFields

export const customAircraftTypeQueryArgs = {
  select: {
    id: true,
    icaoCode: true,
    manufacturer: true,
    model: true,
    _count: { select: { aircraft: true } },
  },
} satisfies Prisma.AircraftTypeReferenceFindManyArgs

type CustomAircraftTypeRaw = Prisma.AircraftTypeReferenceGetPayload<typeof customAircraftTypeQueryArgs>

export type CustomAircraftType = Omit<CustomAircraftTypeRaw, "_count"> & { inUse: boolean }

export const removableAircraftTypeQueryArgs = {
  select: {
    id: true,
    icaoCode: true,
    manufacturer: true,
    model: true,
    _count: { select: { aircraft: true } },
  },
} satisfies Prisma.AircraftTypeReferenceFindManyArgs

export const customOperatorQueryArgs = {
  select: {
    id: true,
    name: true,
    icaoCode: true,
    iataCode: true,
    _count: { select: { aircraft: true } },
  },
} satisfies Prisma.OperatorReferenceFindManyArgs

type CustomOperatorRaw = Prisma.OperatorReferenceGetPayload<typeof customOperatorQueryArgs>

export type CustomOperator = Omit<CustomOperatorRaw, "_count"> & { inUse: boolean }

export const removableOperatorQueryArgs = {
  select: {
    id: true,
    name: true,
    _count: { select: { aircraft: true } },
  },
} satisfies Prisma.OperatorReferenceFindManyArgs

export type RemovableOperator = Prisma.OperatorReferenceGetPayload<typeof removableOperatorQueryArgs>
