import { notFound } from "next/navigation"

import { getFleetAircraftById } from "@/actions/fleet"
import { AircraftContent } from "@/components/ops/fleet/aircraft/aircraft-content"

export default async function AircraftPage({ params }: { params: Promise<{ aircraftId: string }> }) {
  const { aircraftId } = await params
  const aircraft = await getFleetAircraftById(aircraftId)
  if (!aircraft) notFound()

  return <AircraftContent aircraft={aircraft} />
}
