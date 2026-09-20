import { AircraftDataTable } from "@/components/ops/fleet/aircraft/aircraft-data-table"
import { AircraftSimbriefTable } from "@/components/ops/fleet/aircraft/aircraft-simbrief-table"
import type { Aircraft, AircraftTypeSupplement } from "@/components/ops/fleet/types"
import type { SimbriefAirframes } from "@/lib/simbrief-airframes"

export function AircraftContent({
  aircraft,
  supplement,
  simbrief,
}: {
  aircraft: Aircraft
  supplement: AircraftTypeSupplement | null
  simbrief: SimbriefAirframes
}) {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <AircraftDataTable aircraft={aircraft} supplement={supplement} />
      <AircraftSimbriefTable {...simbrief} />
    </div>
  )
}
