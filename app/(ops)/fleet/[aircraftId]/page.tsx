import { notFound } from "next/navigation"

import { getFleetAircraftById } from "@/actions/fleet"
import { AircraftContent } from "@/components/ops/fleet/aircraft/aircraft-content"
import { getSimbriefAirframes } from "@/lib/simbrief-airframes"

export default async function AircraftPage({ params }: { params: Promise<{ aircraftId: string }> }) {
  const { aircraftId } = await params
  const aircraft = await getFleetAircraftById(aircraftId)
  if (!aircraft) notFound()

  const simbrief = await getSimbriefAirframes(aircraft.aircraftType.icaoCode)

  return <AircraftContent aircraft={aircraft} simbrief={simbrief} />
}
