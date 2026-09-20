import { notFound } from "next/navigation"

import { getAircraftTypeSupplement, getFleetAircraftById } from "@/actions/fleet"
import { AircraftContent } from "@/components/ops/fleet/aircraft/aircraft-content"
import { getSimbriefAirframes } from "@/lib/simbrief-airframes"

export default async function AircraftPage({ params }: { params: Promise<{ aircraftId: string }> }) {
  const { aircraftId } = await params
  const aircraft = await getFleetAircraftById(aircraftId)
  if (!aircraft) notFound()

  const { icaoCode } = aircraft.aircraftType
  const [simbrief, supplement] = await Promise.all([
    getSimbriefAirframes(icaoCode),
    getAircraftTypeSupplement(icaoCode),
  ])

  return <AircraftContent aircraft={aircraft} supplement={supplement} simbrief={simbrief} />
}
