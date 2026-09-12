import { FleetContent } from "@/components/ops/fleet/fleet-content"
import { getCustomAircraftTypes, getCustomOperators, getPrivateOperator, getFleetAircraft } from "@/actions/fleet"

export default async function FleetPage() {
  const [aircraft, customAircraftTypes, privateOperator, customOperators] = await Promise.all([
    getFleetAircraft(),
    getCustomAircraftTypes(),
    getPrivateOperator(),
    getCustomOperators(),
  ])

  return (
    <FleetContent
      data={aircraft}
      customAircraftTypes={customAircraftTypes}
      privateOperator={privateOperator}
      customOperators={customOperators}
    />
  )
}