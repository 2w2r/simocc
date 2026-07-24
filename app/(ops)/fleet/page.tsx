import { FleetContent } from "@/components/ops/fleet/fleet-content"
import { getSession } from "@/lib/get-session"
import prisma from "@/lib/prisma"

export default async function FleetPage() {
  const session = await getSession()

  const aircraft = await prisma.aircraft.findMany({
    where: { userId: session!.user.id },
    include: {
      operator: {
        select: {
          id: true,
          name: true,
          icaoCode: true,
          iataCode: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return <FleetContent data={aircraft} />
}
