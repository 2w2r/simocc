import type { ReactNode } from "react"

import { Info } from "lucide-react"

import { AircraftHeroImage } from "@/components/ops/fleet/aircraft/aircraft-hero-image"
import { RemarkRow } from "@/components/ops/fleet/aircraft/remark-list"
import {
  EMPTY_VALUE,
  aircraftAccessors,
  aircraftTypeAccessors,
  formatAerodromeReferenceCode,
  formatAircraftAge,
  formatDisplayDate,
  formatTypeDescription,
} from "@/components/ops/fleet/columns/utils"
import { parseRemarks } from "@/components/ops/fleet/flight-plan-remarks"
import type { Aircraft, AircraftFlightPlanFields, AircraftTypeSupplement } from "@/components/ops/fleet/types"
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

// `hint`: label title, spells out abbreviations/accronyms.
type DetailRow = { label: string; hint?: string; value: ReactNode }

// Small tag at value cell's right edge (FPL item, Deprecated).
function CellBadge({ children }: { children: ReactNode }) {
  return <span className="shrink-0 rounded border px-1 text-[10px] leading-4 text-muted-foreground">{children}</span>
}

// Dotted underline marks label with hover hint.
function RowLabel({ label, hint }: { label: string; hint?: string }) {
  if (!hint) return label
  return (
    <span title={hint} className="cursor-help underline decoration-muted-foreground/40 decoration-dotted underline-offset-4">
      {label}
    </span>
  )
}

// --- Identity: this airframe + its operator ---------------------------------

// Popover for additional reference data
function InfoPopover({
  primary,
  badge,
  children,
}: {
  primary: string
  badge?: ReactNode
  children: ReactNode
}) {
  return (
    <Popover>
      <PopoverAnchor asChild>
        <div className="-m-2 flex items-center gap-2 p-2">
          <span className="min-w-0 truncate">{primary}</span>
          <span className="ml-auto flex shrink-0 items-center gap-2">
            {badge}
            <PopoverTrigger asChild>
              <button
                aria-label="More info"
                className="-m-1 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:bg-accent focus-visible:outline-none"
              >
                <Info className="size-3.5" />
              </button>
            </PopoverTrigger>
          </span>
        </div>
      </PopoverAnchor>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-0">
        {children}
      </PopoverContent>
    </Popover>
  )
}

// Popover body: label/value grid.
function InfoList({ fields }: { fields: [string, string | null][] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
      {fields.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd>{value ?? EMPTY_VALUE}</dd>
        </div>
      ))}
    </dl>
  )
}

function OperatorSummary({ operator }: { operator: Aircraft["operator"] }) {
  const codes = [operator.icaoCode, operator.iataCode].filter(Boolean).join("/")
  return (
    <InfoPopover primary={codes || operator.name}>
      <InfoList
        fields={[
          ["ICAO", operator.icaoCode],
          ["IATA", operator.iataCode],
          ["Name", operator.name],
          ["Callsign", operator.callsign],
          ["Country", operator.country],
        ]}
      />
    </InfoPopover>
  )
}

// Date + muted note: age once delivered ("(18.5 yrs)"), else "(expected)".
function DeliveryDate({ date }: { date: Date }) {
  const age = formatAircraftAge(date)
  return (
    <>
      {formatDisplayDate(date)}
      <span className="ml-3 text-muted-foreground">{age ? `(${age})` : "(expected)"}</span>
    </>
  )
}

function identityRows(aircraft: Aircraft): DetailRow[] {
  return [
    { label: "Registration", value: aircraft.registration },
    { label: "Operator", value: <OperatorSummary operator={aircraft.operator} /> },
    { label: "Aircraft Name", value: aircraft.aircraftTypeName ?? EMPTY_VALUE },
    { label: "Engine Name", value: aircraft.engineTypeName ?? EMPTY_VALUE },
    { label: "MSN", hint: "Manufacturer Serial Number", value: aircraftAccessors.msn(aircraft) },
    { label: "LN", hint: "Line Number", value: aircraftAccessors.lineNumber(aircraft) },
    {
      label: "Delivery Date",
      value: aircraft.deliveryDate ? <DeliveryDate date={aircraft.deliveryDate} /> : EMPTY_VALUE,
    },
    { label: "Status", value: aircraftAccessors.status(aircraft) },
  ]
}

// --- Aircraft type: AircraftTypeReference + AircraftTypeSupplement ----------

// ICAO type designator ("B738"). Manufacturer/model in popover.
function TypeDesignatorSummary({ aircraft }: { aircraft: Aircraft }) {
  const { aircraftType } = aircraft
  return (
    <InfoPopover
      primary={aircraftType.icaoCode}
      badge={aircraftType.deprecated && <CellBadge>Deprecated</CellBadge>}
    >
      <InfoList
        fields={[
          ["ICAO", aircraftType.icaoCode],
          ["Manufacturer", aircraftTypeAccessors.manufacturer(aircraft)],
          ["Model", aircraftTypeAccessors.model(aircraft)],
        ]}
      />
    </InfoPopover>
  )
}

// ICAO type description ("L2J"). Popover decodes: category, engine count, engine type.
function TypeDescriptionSummary({ aircraft }: { aircraft: Aircraft }) {
  const { aircraftType } = aircraft
  return (
    <InfoPopover
      primary={formatTypeDescription(aircraftType.description, aircraftType.engineCount, aircraftType.engineCategory)}
    >
      <InfoList
        fields={[
          ["Category", aircraftTypeAccessors.aircraftCategory(aircraft)],
          ["Engine Count", aircraftTypeAccessors.engineCount(aircraft)],
          ["Engine Type", aircraftTypeAccessors.engineCategory(aircraft)],
        ]}
      />
    </InfoPopover>
  )
}

function typeRows(aircraft: Aircraft, supplement: AircraftTypeSupplement | null): DetailRow[] {
  return [
    { label: "Type Designator", value: <TypeDesignatorSummary aircraft={aircraft} /> },
    { label: "Type Description", value: <TypeDescriptionSummary aircraft={aircraft} /> },
    {
      label: "WTC",
      hint: "Wake Turbulence Category",
      value: aircraftTypeAccessors.wakeTurbulenceCategory(aircraft),
    },
    {
      label: "ARC",
      hint: "Aerodrome Reference Code",
      value: formatAerodromeReferenceCode(
        supplement?.aerodromeReferenceCodeNumber ?? null,
        supplement?.aerodromeReferenceCodeLetter ?? null
      ),
    },
    {
      label: "RFF Category",
      hint: "Rescue and Fire Fighting Category",
      value: supplement?.rescueFireFightingCategory?.toString() ?? EMPTY_VALUE,
    },
  ]
}

function SectionHeader({ title }: { title: string }) {
  return (
    <TableRow className="bg-muted/50 hover:bg-muted/50">
      <TableCell colSpan={2} className="text-xs leading-5 font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </TableCell>
    </TableRow>
  )
}

function DetailRows({ rows }: { rows: DetailRow[] }) {
  return rows.map(({ label, hint, value }) => (
    <TableRow key={label}>
      <TableCell className="font-medium text-muted-foreground">
        <RowLabel label={label} hint={hint} />
      </TableCell>
      <TableCell>{value}</TableCell>
    </TableRow>
  ))
}

// --- Flight plan fields: SIMOCC-owned ICAO FPL Item 10 / Item 18 data -------

type FlightPlanFields = AircraftFlightPlanFields | null
type FlightPlanTextField = Exclude<keyof AircraftFlightPlanFields, "aircraftId" | "rmk" | "updatedAt">
// `badge`: owning FPL item, right edge of value cell like SimBrief units.
// `render`: one value per table row; multi-entry field (remarks) spans rows, label on first only.
type FlightPlanRow = {
  key: string
  label: string
  hint?: string
  badge: string
  render: (fields: FlightPlanFields) => ReactNode[]
}

const text = (key: FlightPlanTextField, label: string, badge: string, hint?: string): FlightPlanRow => ({
  key,
  label,
  hint,
  badge,
  render: (fields) => [fields?.[key] ?? null],
})
// Item 18 indicator row. Label mirrors FPL syntax (`PBN/`).
const indicator = (key: FlightPlanTextField, label: string, hint: string) => text(key, `${label}/`, "18", hint)

// Item 18 order per ICAO Doc 4444 / Eurocontrol.
const FLIGHT_PLAN_ROWS: FlightPlanRow[] = [
  text("item10a", "Equipment", "10A"),
  text("item10b", "Surveillance", "10B"),
  indicator("pbn", "PBN", "Performance-Based Navigation"),
  indicator("nav", "NAV", "Navigation"),
  indicator("com", "COM", "Communication"),
  indicator("dat", "DAT", "Data"),
  indicator("sur", "SUR", "Surveillance"),
  indicator("sel", "SEL", "SELCAL Code"),
  indicator("code", "CODE", "Mode S Code"),
  indicator("per", "PER", "Approach Speed Category"),
  {
    key: "rmk",
    label: "RMK/",
    hint: "Remarks",
    badge: "18",
    render: (fields) => {
      const remarks = fields ? parseRemarks(fields.rmk) : []
      return remarks.length > 0 ? remarks.map((entry) => <RemarkRow key={entry.id} entry={entry} />) : [null]
    },
  },
  indicator("rvr", "RVR", "Runway Visual Range"),
]

// One card per section. <colgroup> sole label column width: table-fixed takes
// widths from first row, may be colSpan header. No `title`: no header row.
function SectionCard({ title, media, children }: { title?: string; media?: ReactNode; children: ReactNode }) {
  return (
    <div className="w-lg max-w-full overflow-hidden rounded-md border">
      {media && <div className="border-b">{media}</div>}
      <Table className="table-fixed">
        <colgroup>
          <col className="w-48" />
          <col />
        </colgroup>
        <TableBody>
          {title && <SectionHeader title={title} />}
          {children}
        </TableBody>
      </Table>
    </div>
  )
}

// Fragment of cards, not one wrapper: parent layout places each.
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
    <>
      <SectionCard media={<AircraftHeroImage imageUrl={aircraft.imageUrl} alt={aircraft.registration} />}>
        <DetailRows rows={identityRows(aircraft)} />
      </SectionCard>
      <SectionCard title="Aircraft Type">
        <DetailRows rows={typeRows(aircraft, supplement)} />
      </SectionCard>
      <SectionCard title="Flight Plan Fields">
        {FLIGHT_PLAN_ROWS.map(({ key, label, hint, badge, render }) => {
          const values = render(flightPlanFields)
          return values.map((value, i) => (
            // Sub-rows of one field = one block. No border between.
            <TableRow key={`${key}-${i}`} className={cn(i < values.length - 1 && "border-b-0")}>
              <TableCell className="font-medium text-muted-foreground">
                {i === 0 && <RowLabel label={label} hint={hint} />}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">{value}</div>
                  <CellBadge>{badge}</CellBadge>
                </div>
              </TableCell>
            </TableRow>
          ))
        })}
      </SectionCard>
    </>
  )
}
