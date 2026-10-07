"use client"

import { type ReactNode, isValidElement } from "react"

import { Info, TriangleAlert } from "lucide-react"

import { AircraftHeroImage } from "@/components/ops/fleet/aircraft/aircraft-hero-image"
import {
  REGISTRATION_EXAMPLES,
  REGISTRATION_MAX_LENGTH,
  REGISTRATION_PATTERN,
} from "@/components/ops/fleet/aircraft/editing/shared"
import { type AircraftDraft, useAircraftEdit } from "@/components/ops/fleet/aircraft/editing/context"
import {
  AddRemarkRow,
  AircraftTypePicker,
  CellInput,
  DatePicker,
  DefinitionSelect,
  OperatorPicker,
  RemarkEditRow,
  SuggestingCellInput,
  definitionPart,
  newRemark,
  remarkTags,
} from "@/components/ops/fleet/aircraft/editing/fields"
import { OptionSelect } from "@/components/ops/fleet/aircraft/editing/option-select"
import {
  ARC_LETTER_DEFINITIONS,
  ARC_NUMBER_DEFINITIONS,
  APPROACH_CATEGORY_DEFINITIONS,
  RFF_DEFINITIONS,
} from "@/components/ops/fleet/aircraft/reference-definitions"
import { RemarkRow } from "@/components/ops/fleet/aircraft/remark-list"
import {
  EMPTY_VALUE,
  aircraftAccessors,
  aircraftTypeAccessors,
  formatAerodromeReferenceCode,
  formatAircraftAge,
  formatAircraftStatus,
  formatDisplayDate,
  formatTypeDescription,
} from "@/components/ops/fleet/columns/utils"
import { type RemarkEntry, parseRemarks } from "@/components/ops/fleet/flight-plan-remarks"
import type {
  Aircraft,
  AircraftFlightPlanFields,
  FlightPlanTextField,
  Operator,
  SupplementValues,
} from "@/components/ops/fleet/types"
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { AircraftStatus } from "@/lib/generated/prisma/enums"
import { cn } from "@/lib/utils"

// `hint`: label title, spells out abbreviations/accronyms.
// `control`: cell unpadded; h-px lets children fill row height.
type DetailRow = { label: string; hint?: string; value: ReactNode; control?: boolean }

// Small tag at value cell's right edge (FPL item, Deprecated).
function CellBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("shrink-0 rounded border px-1 text-[10px] leading-4 text-muted-foreground", className)}>
      {children}
    </span>
  )
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
        {/* Fills whole row: icon centred on row, not text line. */}
        <div className="flex h-full min-h-9 items-center gap-2 px-2">
          <span className="min-w-0 truncate">{primary}</span>
          <span className="ml-auto flex shrink-0 items-center gap-2">
            {badge}
            <PopoverTrigger asChild>
              <button
                aria-label="More info"
                // Flex centres icon (inline svg sits high). Round hover: circled glyph.
                className="-m-1 flex items-center justify-center rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:bg-accent focus-visible:outline-none"
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
    { label: "Operator", control: true, value: <OperatorSummary operator={aircraft.operator} /> },
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

const STATUS_OPTIONS = Object.values(AircraftStatus).map((value) => ({ value, label: formatAircraftStatus(value) }))

type DraftUpdate = (patch: Partial<AircraftDraft>) => void

function identityEditRows(draft: AircraftDraft, update: DraftUpdate, privateOperator: Operator | null): DetailRow[] {
  const text = (key: "msn" | "lineNumber") => (
    <CellInput value={draft[key]} onChange={(e) => update({ [key]: e.target.value })} />
  )
  const name = (key: "aircraftTypeName" | "engineTypeName") => (
    <SuggestingCellInput
      field={key}
      icaoCode={draft.aircraftType.icaoCode}
      value={draft[key]}
      onChange={(value) => update({ [key]: value })}
    />
  )
  const rows: DetailRow[] = [
    {
      label: "Registration",
      value: (
        <CellInput
          value={draft.registration}
          onChange={(e) => update({ registration: e.target.value.toUpperCase() })}
          pattern={REGISTRATION_PATTERN.source}
          maxLength={REGISTRATION_MAX_LENGTH}
          title={REGISTRATION_EXAMPLES}
          required
          data-field="registration"
          data-error={`Registration format error: ${REGISTRATION_EXAMPLES}`}
        />
      ),
    },
    {
      label: "Operator",
      value: (
        <OperatorPicker
          value={draft.operator}
          onChange={(operator) => update({ operator })}
          privateOperator={privateOperator}
        />
      ),
    },
    { label: "Aircraft Name", value: name("aircraftTypeName") },
    { label: "Engine Name", value: name("engineTypeName") },
    { label: "MSN", hint: "Manufacturer Serial Number", value: text("msn") },
    { label: "LN", hint: "Line Number", value: text("lineNumber") },
    {
      label: "Delivery Date",
      value: <DatePicker value={draft.deliveryDate} onChange={(deliveryDate) => update({ deliveryDate })} />,
    },
    {
      label: "Status",
      value: (
        <OptionSelect
          variant="cell"
          options={STATUS_OPTIONS}
          value={draft.status}
          onChange={(status) => status && update({ status })}
        />
      ),
    },
  ]
  return rows.map((row) => ({ ...row, control: true }))
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

function typeEditors(
  draft: AircraftDraft,
  changeAircraftType: (type: AircraftDraft["aircraftType"]) => void,
  onChange: (patch: Partial<SupplementValues>) => void
) {
  const { supplement } = draft
  return {
    designator: <AircraftTypePicker value={draft.aircraftType} onChange={changeAircraftType} />,
    arc: (
      <DefinitionSelect
        parts={[
          definitionPart({
            label: "ARC number",
            table: ARC_NUMBER_DEFINITIONS,
            value: supplement.aerodromeReferenceCodeNumber,
            onChange: (aerodromeReferenceCodeNumber) => onChange({ aerodromeReferenceCodeNumber }),
          }),
          definitionPart({
            label: "ARC letter",
            table: ARC_LETTER_DEFINITIONS,
            value: supplement.aerodromeReferenceCodeLetter,
            onChange: (aerodromeReferenceCodeLetter) => onChange({ aerodromeReferenceCodeLetter }),
          }),
        ]}
      />
    ),
    rff: (
      <DefinitionSelect
        parts={[
          definitionPart({
            label: "RFF category",
            table: RFF_DEFINITIONS,
            value: supplement.rescueFireFightingCategory,
            onChange: (rescueFireFightingCategory) => onChange({ rescueFireFightingCategory }),
          }),
        ]}
      />
    ),
  }
}

function typeRows(
  aircraft: Aircraft,
  supplement: SupplementValues | null,
  editors?: { designator: ReactNode; arc: ReactNode; rff: ReactNode }
): DetailRow[] {
  return [
    {
      label: "Type Designator",
      control: true,
      value: editors?.designator ?? <TypeDesignatorSummary aircraft={aircraft} />,
    },
    { label: "Type Description", control: true, value: <TypeDescriptionSummary aircraft={aircraft} /> },
    {
      label: "WTC",
      hint: "Wake Turbulence Category",
      value: aircraftTypeAccessors.wakeTurbulenceCategory(aircraft),
    },
    {
      label: "ARC",
      hint: "Aerodrome Reference Code",
      control: !!editors,
      value:
        editors?.arc ??
        formatAerodromeReferenceCode(
          supplement?.aerodromeReferenceCodeNumber ?? null,
          supplement?.aerodromeReferenceCodeLetter ?? null
        ),
    },
    {
      label: "RFF Category",
      hint: "Rescue and Fire Fighting Category",
      control: !!editors,
      value: editors?.rff ?? supplement?.rescueFireFightingCategory?.toString() ?? EMPTY_VALUE,
    },
  ]
}

function SectionHeader({ title, aside }: { title: string; aside?: ReactNode }) {
  return (
    <TableRow className="bg-muted/50 hover:bg-muted/50">
      <TableCell colSpan={2} className="text-xs leading-5 font-semibold uppercase tracking-wide text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="shrink-0">{title}</span>
          {aside && <span className="ml-auto min-w-0 truncate">{aside}</span>}
        </div>
      </TableCell>
    </TableRow>
  )
}

const ERROR_FIELD_ROWS: Record<string, string[]> = {
  registration: ["Registration"],
  operator: ["Operator"],
  aircraftType: ["Type Designator"],
  deliveryDate: ["Delivery Date"],
  arc: ["ARC"],
  sel: ["SEL/"],
  code: ["CODE/"],
  status: ["Status"],
  duplicate: ["Registration", "Operator", "Type Designator"],
}

// Error ring as overlay: control fills cell, hides inset shadow.
const INVALID_RING =
  "relative after:pointer-events-none after:absolute after:inset-0 after:ring-1 after:ring-destructive after:ring-inset"

function DetailRows({ rows, invalidLabels = [] }: { rows: DetailRow[]; invalidLabels?: string[] }) {
  return rows.map(({ label, hint, value, control }) => (
    <TableRow key={label}>
      <TableCell className="font-medium text-muted-foreground">
        <RowLabel label={label} hint={hint} />
      </TableCell>
      <TableCell
        className={cn(
          control && "h-px p-0",
          invalidLabels.includes(label) && INVALID_RING
        )}
      >
        {value}
      </TableCell>
    </TableRow>
  ))
}

// --- Flight plan fields: SIMOCC-owned ICAO FPL Item 10 / Item 18 data -------

type FlightPlanFields = AircraftFlightPlanFields | null
// `badge`: owning FPL item, right edge of value cell like SimBrief units.
// `render`: one value per table row; multi-entry field (remarks) spans rows, label on first only.
type FlightPlanRow = {
  key: string
  label: string
  hint?: string
  badge: string
  render: (fields: FlightPlanFields) => ReactNode[]
  edit: (draft: AircraftDraft, update: DraftUpdate) => ReactNode[]
}

const setFlightPlanField = (draft: AircraftDraft, update: DraftUpdate, key: FlightPlanTextField, value: string) =>
  update({ flightPlanFields: { ...draft.flightPlanFields, [key]: value } })

// Rigid formats only; rest awaits Zod. `example` from published source only.
type InputFormat = { pattern: string; maxLength: number; example?: string }

const text = (
  key: FlightPlanTextField,
  label: string,
  badge: string,
  hint?: string,
  format?: InputFormat
): FlightPlanRow => ({
  key,
  label,
  hint,
  badge,
  render: (fields) => [fields?.[key] ?? null],
  edit: (draft, update) => [
    <CellInput
      key={key}
      value={draft.flightPlanFields[key]}
      onChange={(e) => setFlightPlanField(draft, update, key, e.target.value.toUpperCase())}
      {...(format && {
        pattern: format.pattern,
        maxLength: format.maxLength,
        title: format.example,
        "data-field": key,
        "data-error": format.example ? `${label} format error: ${format.example}` : `${label} format error`,
      })}
    />,
  ],
})
// Item 18 indicator row. Label mirrors FPL syntax (`PBN/`).
const indicator = (key: FlightPlanTextField, label: string, hint: string, format?: InputFormat) =>
  text(key, `${label}/`, "18", hint, format)

// SELCAL: 4 letters A–S, no I/N/O (example: FAA Form 7233-4). Mode S address:
// 6 hex (example: ICAO Doc 4444 App 2, Item 18 CODE/).
const SELCAL_FORMAT: InputFormat = { pattern: "[A-HJ-MP-S]{4}", maxLength: 4, example: "ABCD" }
const MODE_S_FORMAT: InputFormat = { pattern: "[0-9A-F]{6}", maxLength: 6, example: "F00001" }

// Item 18 order per ICAO Doc 4444 / Eurocontrol.
const FLIGHT_PLAN_ROWS: FlightPlanRow[] = [
  text("item10a", "Equipment", "10A"),
  text("item10b", "Surveillance", "10B"),
  indicator("pbn", "PBN", "Performance-Based Navigation"),
  indicator("nav", "NAV", "Navigation"),
  indicator("com", "COM", "Communication"),
  indicator("dat", "DAT", "Data"),
  indicator("sur", "SUR", "Surveillance"),
  indicator("sel", "SEL", "SELCAL Code", SELCAL_FORMAT),
  indicator("code", "CODE", "Mode S Code", MODE_S_FORMAT),
  {
    ...indicator("per", "PER", "Approach Speed Category"),
    edit: (draft, update) => [
      <DefinitionSelect
        key="per"
        parts={[
          definitionPart({
            label: "Approach category",
            table: APPROACH_CATEGORY_DEFINITIONS,
            value: draft.flightPlanFields.per || null,
            onChange: (value) => setFlightPlanField(draft, update, "per", value ?? ""),
          }),
        ]}
      />,
    ],
  },
  {
    key: "rmk",
    label: "RMK/",
    hint: "Remarks",
    badge: "18",
    render: (fields) => {
      const remarks = fields ? parseRemarks(fields.rmk) : []
      return remarks.length > 0 ? remarks.map((entry) => <RemarkRow key={entry.id} entry={entry} />) : [null]
    },
    edit: (draft, update) => {
      const knownTags = remarkTags(draft.remarks)
      const setRemarks = (remarks: RemarkEntry[]) => update({ remarks })
      return [
        ...draft.remarks.map((entry) => (
          <RemarkEditRow
            key={entry.id}
            entry={entry}
            knownTags={knownTags}
            onChange={(patch) =>
              setRemarks(draft.remarks.map((e) => (e.id === entry.id ? { ...e, ...patch } : e)))
            }
            onRemove={() => setRemarks(draft.remarks.filter((e) => e.id !== entry.id))}
          />
        )),
        <AddRemarkRow key="add" onAdd={() => setRemarks([...draft.remarks, newRemark()])} />,
      ]
    },
  },
  indicator("rvr", "RVR", "Runway Visual Range"),
]

// One card per section. <colgroup> sole label column width: table-fixed takes
// widths from first row, may be colSpan header. No `title`: no header row.
function SectionCard({
  title,
  aside,
  media,
  children,
}: {
  title?: string
  aside?: ReactNode
  media?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="w-lg max-w-full overflow-hidden rounded-md border">
      {media && <div className="border-b">{media}</div>}
      <Table className="table-fixed">
        <colgroup>
          <col className="w-48" />
          <col />
        </colgroup>
        <TableBody>
          {title && <SectionHeader title={title} aside={aside} />}
          {children}
        </TableBody>
      </Table>
    </div>
  )
}

// Names ARC/RFF: else read as changing the type itself.
function SharedScopeWarning({ icaoCode }: { icaoCode: string }) {
  return (
    <span className="flex items-center gap-1.5 normal-case tracking-normal font-normal text-amber-600 dark:text-amber-500">
      <TriangleAlert className="size-3.5 shrink-0" />
      <span className="truncate">ARC / RFF changes apply to all</span>
      <span className="shrink-0 rounded border border-current px-1 font-mono text-[10px] leading-4">{icaoCode}</span>
      <span className="shrink-0">in fleet</span>
    </span>
  )
}

// Fragment of cards, not one wrapper: parent layout places each.
export function AircraftDataTable() {
  const { aircraft, supplement, flightPlanFields, privateOperator, draft, error, update, changeAircraftType } =
    useAircraftEdit()
  const invalidLabels = error ? (ERROR_FIELD_ROWS[error.field] ?? []) : []

  const typeCardRows = draft
    ? typeRows(
      { ...aircraft, aircraftType: draft.aircraftType },
      draft.supplement,
      typeEditors(draft, changeAircraftType, (patch) => update({ supplement: { ...draft.supplement, ...patch } }))
    )
    : typeRows(aircraft, supplement)

  return (
    <>
      <SectionCard
        media={
          <AircraftHeroImage
            imageUrl={aircraft.imageUrl}
            imagePageUrl={aircraft.imagePageUrl}
            imageAuthor={aircraft.imageAuthor}
            alt={aircraft.registration}
            edit={
              draft
                ? {
                  values: draft,
                  onChange: update,
                  error: error?.message,
                  invalidField: error?.field === "imageUrl" || error?.field === "imagePageUrl" ? error.field : undefined,
                }
                : undefined
            }
          />
        }
      >
        <DetailRows
          rows={draft ? identityEditRows(draft, update, privateOperator) : identityRows(aircraft)}
          invalidLabels={invalidLabels}
        />
      </SectionCard>
      <SectionCard
        title="Aircraft Type"
        aside={draft && <SharedScopeWarning icaoCode={draft.aircraftType.icaoCode} />}
      >
        <DetailRows rows={typeCardRows} invalidLabels={invalidLabels} />
      </SectionCard>
      <SectionCard title="Flight Plan Fields">
        {FLIGHT_PLAN_ROWS.map(({ key, label, hint, badge, render, edit }) => {
          const values = draft ? edit(draft, update) : render(flightPlanFields)
          return values.map((value, i) => (
            // Read-only sub-rows: one block, no border. Keyed by remark id: removal never
            // shifts row state onto next row.
            <TableRow
              key={`${key}-${isValidElement(value) && value.key !== null ? value.key : i}`}
              className={cn(!draft && i < values.length - 1 && "border-b-0")}
            >
              <TableCell className="font-medium text-muted-foreground">
                {i === 0 && <RowLabel label={label} hint={hint} />}
              </TableCell>
              <TableCell className={cn(draft && "p-0", i === 0 && invalidLabels.includes(label) && INVALID_RING)}>
                {draft ? (
                  // Badge first: control stays last child, gets end padding.
                  <div className="relative [--cell-end-pad:2.75rem]">
                    <CellBadge className="pointer-events-none absolute top-1/2 right-2 z-10 -translate-y-1/2">
                      {badge}
                    </CellBadge>
                    {value}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">{value}</div>
                    <CellBadge>{badge}</CellBadge>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))
        })}
      </SectionCard>
    </>
  )
}
