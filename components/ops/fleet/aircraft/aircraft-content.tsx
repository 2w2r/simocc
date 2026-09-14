import { AircraftDataTable } from "@/components/ops/fleet/aircraft/aircraft-data-table"
import type { Aircraft } from "@/components/ops/fleet/types"

export function AircraftContent({ aircraft }: { aircraft: Aircraft }) {
  return (
      <AircraftDataTable aircraft={aircraft} />
  )
}
