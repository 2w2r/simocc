import { Prisma, OperatorReference } from "@/lib/generated/prisma/client"

export const aircraftQueryArgs = {} satisfies Prisma.AircraftFindManyArgs

type AircraftScalar = Prisma.AircraftGetPayload<typeof aircraftQueryArgs>

export type Operator = OperatorReference

export type Aircraft = AircraftScalar & { operator: Operator }

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