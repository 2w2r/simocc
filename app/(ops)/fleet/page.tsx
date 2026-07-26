import { getSession } from "@/lib/get-session"
import prisma from "@/lib/prisma"
import { FleetContent } from "@/components/ops/fleet/fleet-content"
import { getCustomOperators, getPrivateOperator } from "@/actions/fleet"

export default async function FleetPage() {
  const session = await getSession()

  const [aircraft, privateOperator, customOperators] = await Promise.all([
    prisma.aircraft.findMany({
      where: { userId: session!.user.id },
      include: {
        operator: {
          select: {
            name: true,
            icaoCode: true,
            iataCode: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    getPrivateOperator(),
    getCustomOperators(),
  ])

  return (
    <FleetContent
      data={aircraft}
      privateOperator={privateOperator}
      customOperators={customOperators}
    />
  )
}