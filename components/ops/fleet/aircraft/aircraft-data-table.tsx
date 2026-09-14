import {
  EMPTY_VALUE,
  aircraftAccessors,
  aircraftTypeAccessors,
  formatDateAdded,
  formatUTCDate,
} from "@/components/ops/fleet/columns/utils"
import type { Aircraft } from "@/components/ops/fleet/types"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"

const yesNo = (value: boolean) => (value ? "Yes" : "No")

function buildRows(aircraft: Aircraft): [string, string][] {
  const { aircraftType, operator } = aircraft
  return [
    // Aircraft
    ["Registration", aircraft.registration],
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
    // OperatorReference
    ["Operator ICAO", operator.icaoCode ?? EMPTY_VALUE],
    ["Operator IATA", operator.iataCode ?? EMPTY_VALUE],
    ["Operator Name", operator.name],
    ["Callsign", operator.callsign ?? EMPTY_VALUE],
    ["Country", operator.country ?? EMPTY_VALUE],
  ]
}

export function AircraftDataTable({ aircraft }: { aircraft: Aircraft }) {
  return (
    <div className="w-lg max-w-full overflow-hidden rounded-md border">
      <Table>
        <TableBody>
          {buildRows(aircraft).map(([label, value]) => (
            <TableRow key={label}>
              <TableCell className="w-48 font-medium text-muted-foreground">{label}</TableCell>
              <TableCell>{value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
