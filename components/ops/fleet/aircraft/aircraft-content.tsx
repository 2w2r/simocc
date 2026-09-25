import { AircraftDataTable } from "@/components/ops/fleet/aircraft/aircraft-data-table"
import { AircraftToolbar } from "@/components/ops/fleet/aircraft/aircraft-toolbar"
import { AircraftSimbriefTable } from "@/components/ops/fleet/aircraft/aircraft-simbrief-table"
import type { Aircraft, AircraftFlightPlanFields, AircraftTypeSupplement } from "@/components/ops/fleet/types"
import type { SimbriefAirframes } from "@/lib/simbrief-airframes"

export function AircraftContent({
  aircraft,
  supplement,
  flightPlanFields,
  simbrief,
}: {
  aircraft: Aircraft
  supplement: AircraftTypeSupplement | null
  flightPlanFields: AircraftFlightPlanFields | null
  simbrief: SimbriefAirframes
}) {
  return (
    <div className="flex flex-col gap-2">
      <AircraftToolbar aircraft={aircraft} />
      {/* Cards fill column top to bottom, then next column. */}
      <div className="columns-lg gap-4 *:mb-4 *:break-inside-avoid">
        <AircraftDataTable aircraft={aircraft} supplement={supplement} flightPlanFields={flightPlanFields} />
        <AircraftSimbriefTable {...simbrief} />
      </div>
    </div>
  )
}
