import { notFound } from "next/navigation"

import {
  getAircraftFlightPlanFields,
  getAircraftTypeSupplement,
  getFleetAircraftById,
  getPrivateOperator,
} from "@/actions/fleet"
import { AircraftContent } from "@/components/ops/fleet/aircraft/aircraft-content"
import { getSimbriefAirframes } from "@/lib/simbrief-airframes"

export default async function AircraftPage({ params }: { params: Promise<{ aircraftId: string }> }) {
  const { aircraftId } = await params
  const aircraft = await getFleetAircraftById(aircraftId)
  if (!aircraft) notFound()

  const { icaoCode } = aircraft.aircraftType
  const [simbrief, supplement, flightPlanFields, privateOperator] = await Promise.all([
    getSimbriefAirframes(icaoCode),
    getAircraftTypeSupplement(icaoCode),
    getAircraftFlightPlanFields(aircraft.id),
    getPrivateOperator(),
  ])

  return (
    <AircraftContent
      aircraft={aircraft}
      supplement={supplement}
      flightPlanFields={flightPlanFields}
      privateOperator={privateOperator}
      simbrief={simbrief}
    />
  )
}
