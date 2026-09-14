import { notFound } from "next/navigation"

import { getFleetAircraftById } from "@/actions/fleet"

export default async function AircraftPage({ params }: { params: Promise<{ aircraftId: string }> }) {
  const { aircraftId } = await params
  const aircraft = await getFleetAircraftById(aircraftId)
  if (!aircraft) notFound()

  return <div>{aircraft.registration}</div>
}
