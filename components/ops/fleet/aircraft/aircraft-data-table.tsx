import type { ReactNode } from "react"

import { AircraftHeroImage } from "@/components/ops/fleet/aircraft/aircraft-hero-image"
import { RemarkRow } from "@/components/ops/fleet/aircraft/remark-list"
import {
  EMPTY_VALUE,
  aircraftAccessors,
  aircraftTypeAccessors,
  formatAerodromeReferenceCode,
  formatDateAdded,
  formatTypeCode,
  formatUTCDate,
} from "@/components/ops/fleet/columns/utils"
import { parseRemarks } from "@/components/ops/fleet/flight-plan-remarks"
import type { Aircraft, AircraftFlightPlanFields, AircraftTypeSupplement } from "@/components/ops/fleet/types"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

const yesNo = (value: boolean) => (value ? "Yes" : "No")

function buildRows(aircraft: Aircraft, supplement: AircraftTypeSupplement | null): [string, string][] {
  const { aircraftType, operator } = aircraft
  return [
    // Aircraft
    ["Registration", aircraft.registration],
    ["Aircraft Name", aircraft.aircraftTypeName ?? EMPTY_VALUE],
    ["Engine Name", aircraft.engineTypeName ?? EMPTY_VALUE],
    ["Favourite", yesNo(aircraft.favourite)],
    ["Fictional", yesNo(aircraft.fictional)],
    ["MSN", aircraftAccessors.msn(aircraft)],
    ["Line Number", aircraftAccessors.lineNumber(aircraft)],
    ["Delivery Date", aircraft.deliveryDate ? formatUTCDate(aircraft.deliveryDate) : EMPTY_VALUE],
    ["Status", aircraftAccessors.status(aircraft)],
    ["Created", formatDateAdded(aircraft.createdAt)],
    ["Updated", formatDateAdded(aircraft.updatedAt)],
    // AircraftTypeReference
    ["ICAO Type", aircraftType.icaoCode],
    ["Manufacturer", aircraftTypeAccessors.manufacturer(aircraft)],
    ["Model", aircraftTypeAccessors.model(aircraft)],
    ["Category", aircraftTypeAccessors.aircraftCategory(aircraft)],
    ["Engine Type", aircraftTypeAccessors.engineCategory(aircraft)],
    ["Engine Count", aircraftTypeAccessors.engineCount(aircraft)],
    ["WTC", aircraftTypeAccessors.wakeTurbulenceCategory(aircraft)],
    ["Type Deprecated", yesNo(aircraftType.deprecated)],
    [
      "Type Code",
      formatTypeCode(aircraftType.description, aircraftType.engineCount, aircraftType.engineCategory),
    ],
    // AircraftTypeSupplement
    [
      "Aerodrome Reference Code",
      formatAerodromeReferenceCode(
        supplement?.aerodromeReferenceCodeNumber ?? null,
        supplement?.aerodromeReferenceCodeLetter ?? null
      ),
    ],
    ["RFF Category", supplement?.rescueFireFightingCategory?.toString() ?? EMPTY_VALUE],
    // OperatorReference
    ["Operator ICAO", operator.icaoCode ?? EMPTY_VALUE],
    ["Operator IATA", operator.iataCode ?? EMPTY_VALUE],
    ["Operator Name", operator.name],
    ["Callsign", operator.callsign ?? EMPTY_VALUE],
    ["Country", operator.country ?? EMPTY_VALUE],
  ]
}

// --- Flight plan fields: SIMOCC-owned ICAO FPL Item 10 / Item 18 data -------

type FlightPlanFields = AircraftFlightPlanFields | null
type FlightPlanTextField = Exclude<keyof AircraftFlightPlanFields, "aircraftId" | "rmk" | "updatedAt">
// `badge`: owning FPL item, right edge of value cell like SimBrief units.
// `render`: one value per table row; multi-entry field (remarks) spans rows, label on first only.
type FlightPlanRow = { key: string; label: string; badge: string; render: (fields: FlightPlanFields) => ReactNode[] }

const text = (key: FlightPlanTextField, label: string, badge: string): FlightPlanRow => ({
  key,
  label,
  badge,
  render: (fields) => [fields?.[key] ?? null],
})
// Item 18 indicator row. Label mirrors FPL syntax (`PBN/`).
const indicator = (key: FlightPlanTextField, label: string) => text(key, `${label}/`, "18")

// Item 18 order per ICAO Doc 4444 / Eurocontrol.
const FLIGHT_PLAN_ROWS: FlightPlanRow[] = [
  text("item10a", "Equipment", "10A"),
  text("item10b", "Surveillance", "10B"),
  indicator("pbn", "PBN"),
  indicator("nav", "NAV"),
  indicator("com", "COM"),
  indicator("dat", "DAT"),
  indicator("sur", "SUR"),
  indicator("sel", "SEL"),
  indicator("code", "CODE"),
  indicator("per", "PER"),
  {
    key: "rmk",
    label: "RMK/",
    badge: "18",
    render: (fields) => {
      const remarks = fields ? parseRemarks(fields.rmk) : []
      return remarks.length > 0 ? remarks.map((entry) => <RemarkRow key={entry.id} entry={entry} />) : [null]
    },
  },
  indicator("rvr", "RVR"),
]

export function AircraftDataTable({
  aircraft,
  supplement,
  flightPlanFields,
}: {
  aircraft: Aircraft
  supplement: AircraftTypeSupplement | null
  flightPlanFields: AircraftFlightPlanFields | null
}) {
  return (
    <div className="w-lg max-w-full overflow-hidden rounded-md border">
      <div className="border-b">
        <AircraftHeroImage imageUrl={aircraft.imageUrl} alt={aircraft.registration} />
      </div>
      <Table className="table-fixed">
        <TableBody>
          {buildRows(aircraft, supplement).map(([label, value]) => (
            <TableRow key={label}>
              <TableCell className="w-48 font-medium text-muted-foreground">{label}</TableCell>
              <TableCell>{value}</TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableCell colSpan={2} className="text-xs leading-5 font-semibold uppercase tracking-wide text-muted-foreground">
              Flight Plan Fields
            </TableCell>
          </TableRow>
          {FLIGHT_PLAN_ROWS.map(({ key, label, badge, render }) => {
            const values = render(flightPlanFields)
            return values.map((value, i) => (
              // Sub-rows of one field = one block. No border between.
              <TableRow key={`${key}-${i}`} className={cn(i < values.length - 1 && "border-b-0")}>
                <TableCell className="w-48 font-medium text-muted-foreground">{i === 0 && label}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div className="min-w-0 flex-1">{value}</div>
                    <span className="ml-2 shrink-0 rounded border px-1 text-[10px] leading-4 text-muted-foreground">
                      {badge}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))
          })}
        </TableBody>
      </Table>
    </div>
  )
}
