import { FleetContent } from "@/components/ops/fleet/fleet-content"
import { getCustomOperators, getPrivateOperator, getFleetAircraft } from "@/actions/fleet"

export default async function FleetPage() {
  const [aircraft, privateOperator, customOperators] = await Promise.all([
    getFleetAircraft(),
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