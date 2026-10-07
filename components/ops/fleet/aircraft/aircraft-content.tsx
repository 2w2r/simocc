import { AircraftDataTable } from "@/components/ops/fleet/aircraft/aircraft-data-table"
import { AircraftEditProvider } from "@/components/ops/fleet/aircraft/editing/context"
import { AircraftToolbar } from "@/components/ops/fleet/aircraft/aircraft-toolbar"
import { AircraftSimbriefTable } from "@/components/ops/fleet/aircraft/aircraft-simbrief-table"
import type {
  Aircraft,
  AircraftFlightPlanFields,
  AircraftTypeSupplement,
  Operator,
} from "@/components/ops/fleet/types"
import type { SimbriefAirframes } from "@/lib/simbrief-airframes"

export function AircraftContent({
  aircraft,
  supplement,
  flightPlanFields,
  privateOperator,
  simbrief,
}: {
  aircraft: Aircraft
  supplement: AircraftTypeSupplement | null
  flightPlanFields: AircraftFlightPlanFields | null
  privateOperator: Operator | null
  simbrief: SimbriefAirframes
}) {
  return (
    <AircraftEditProvider
      aircraft={aircraft}
      supplement={supplement}
      flightPlanFields={flightPlanFields}
      privateOperator={privateOperator}
    >
      <div className="flex flex-col gap-2">
        <AircraftToolbar />
        {/* Cards fill column top to bottom, then next column. */}
        <div className="columns-lg gap-4 *:mb-4 *:break-inside-avoid">
          <AircraftDataTable />
          <AircraftSimbriefTable {...simbrief} />
        </div>
      </div>
    </AircraftEditProvider>
  )
}
