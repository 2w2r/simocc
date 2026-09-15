"use client"

import { Fragment, useState } from "react"

import { Check, ChevronsUpDown, Info } from "lucide-react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import type {
  SimbriefAircraftType,
  SimbriefAirframe,
  SimbriefAirframes,
  SimbriefOptionKey,
} from "@/lib/simbrief-airframes"
import { cn } from "@/lib/utils"

type Options = SimbriefAirframe["options"]
type AircraftType = SimbriefAircraftType | null
// Blank-form hint: static (same across types) or from type-level defaults.
type Placeholder = string | ((type: AircraftType, o: Options) => string | null)

// One SimBrief form control (value, unit or mode). A row's value cell splits
// into equal parts so each stays independently overrideable later.
// `disabled`: SimBrief greys the control out for this type (no type figure).
type Part = {
  kind: "select" | "input"
  get: (o: Options) => string | null
  placeholder?: Placeholder
  disabled?: (type: AircraftType) => boolean
}
// `unit`: badge (NM, FT, Weight Units) at the value cell's right edge; not a
// control. Labels are unique and serve as React keys.
type Row = {
  label: string | ((type: AircraftType) => string)
  unit?: (o: Options) => string | null
  parts: Part[]
}

// --- row builders -----------------------------------------------------------

const resolve = (placeholder: Placeholder | undefined, type: AircraftType, o: Options) =>
  (typeof placeholder === "function" ? placeholder(type, o) : placeholder) ?? null
const rowLabel = (label: Row["label"], type: AircraftType) => (typeof label === "function" ? label(type) : label)

const select = (key: SimbriefOptionKey, placeholder?: Placeholder): Part => ({
  kind: "select",
  get: (o) => o[key],
  placeholder,
})
const input = (key: SimbriefOptionKey, placeholder?: Placeholder): Part => ({
  kind: "input",
  get: (o) => o[key],
  placeholder,
})

const row = (label: Row["label"], ...parts: Part[]): Row => ({ label, parts })
const unitRow = (label: string, unit: Row["unit"], ...parts: Part[]): Row => ({ label, unit, parts })

// Weight fields are in the airframe's Weight Units; badge follows that selector.
const weightUnit = (o: Options) => o.wgtunits
const weight = (key: SimbriefOptionKey, label: string, placeholder?: Placeholder): Row =>
  unitRow(label, weightUnit, input(key, placeholder))

// Fuel policy: amount input | unit select (mass in Weight Units, or minutes).
const fuelParts = (key: SimbriefOptionKey, unitKey: SimbriefOptionKey, placeholder?: Placeholder): Part[] => [
  input(key, placeholder),
  {
    kind: "select",
    get: (o) => (o[unitKey] === "WGT" ? weightUnit(o) : o[unitKey]),
    placeholder: (_type, o) => weightUnit(o),
  },
]
const fuel = (key: SimbriefOptionKey, unitKey: SimbriefOptionKey, label: string, placeholder?: Placeholder): Row =>
  row(label, ...fuelParts(key, unitKey, placeholder))

// Single-option dropdown is effectively filled with it.
const only = (values: string[]) => (values.length === 1 ? values[0] : null)
const noThrust = (t: AircraftType) => !t?.thrust

// --- layout: mirrors SimBrief's Airframe Options form ----------------------
// Sections top-to-bottom then left-to-right; fields left-to-right then
// top-to-bottom. Labels and placeholders as SimBrief shows them.

const SECTIONS: { title: string; rows: Row[] }[] = [
  {
    title: "Airframe Info",
    rows: [
      row("Base Type", input("basetype")),
      row("ICAO Code", input("icao", "ZZZZ")),
      row("Civil Registration", input("reg", "N999SB")),
      row("Fin Number", input("fin", "999")),
      row("SELCAL Code", input("selcal", "NONE")),
      row("Mode-S Code", input("hexcode", "ZZZZZZ")),
      row("OFP Layout", select("planformat", "Default")),
      row("Flight Rules", select("flightrules", "Default")),
      row("Type of Flight", select("flighttype", "Default")),
      row("Plan Units", select("planunits", "Default")),
      unitRow("Max Diversion", () => "NM", input("altnsadv_radius", "400")),
      row("Min Runway", input("altnsadv_rwy", "7000"), select("altnsadv_units_rwy", "FT")),
      row("Aircraft Name", input("name", "Max 20 Characters")),
      row("Engine Type", input("engines", "Max 20 Characters")),
      row("Comments", input("comments", "Airline, configuration, notes, etc.")),
    ],
  },
  {
    title: "Airframe Equipment",
    rows: [
      row("Performance Code", select("per")),
      row("Weight Category", select("cat")),
      row("ETOPS Threshold", select("etopsthreshold")),
      row("ETOPS Certification", select("etopsrange", "Auto")),
      row("ICAO Equipment", input("equip", "SDFGHRWY")),
      row("Transponder", input("transponder", "LB1")),
      row("PBN Capability", input("pbn", "A1B1C1D1L1O1S1")),
      row("Extra FPL Info (Item 18)", input("extrarmk", "DAT/V RMK/SIMBRIEF")),
    ],
  },
  {
    title: "Airframe Text Entries",
    rows: [row("Dispatcher Remarks", input("manualrmk", "Custom dispatch remarks"))],
  },
  {
    title: "Airframe Weights",
    rows: [
      row("Weight Units", select("wgtunits")),
      row("Max Passengers", input("maxpax", "999")),
      // SimBrief always hints the LBS Pax/Bag values; show the KG one when KG selected.
      weight("paxwgt", "Passenger Weight", (_t, o) => (o.wgtunits === "KG" ? "79" : "175")),
      weight("bagwgt", "Baggage Weight", (_t, o) => (o.wgtunits === "KG" ? "25" : "55")),
      weight("oew", "Empty Weight", "OEW"),
      weight("mzfw", "Max Zero Fuel Weight", "MZFW"),
      weight("mtow", "Max Takeoff Weight", "MTOW"),
      weight("mlw", "Max Landing Weight", "MLW"),
      weight("maxfuel", "Max Fuel Capacity", "Fuel"),
      weight("maxcargo", "Max Cargo Weight", "None"),
      row("Default Freight Mode", select("cargomode", "Default (None)")),
    ],
  },
  {
    title: "Airframe Fuel Planning",
    rows: [
      row("Contingency Fuel", select("contpct", "Default")),
      row("Reserve Fuel", select("resvrule", "Default")),
      weight("taxifuel", "Taxi Fuel", "AUTO"),
      fuel("minfob", "minfob_units", "Block Fuel", "AUTO"),
      fuel("minfod", "minfod_units", "Arrival Fuel", "AUTO"),
      fuel("melfuel", "melfuel_units", "MEL Fuel", "0"),
      fuel("atcfuel", "atcfuel_units", "ATC Fuel", "0"),
      fuel("wxxfuel", "wxxfuel_units", "WXX Fuel", "0"),
      row(
        "Extra Fuel",
        select("addedfuel_label", "EXTRA"),
        ...fuelParts("addedfuel", "addedfuel_units", "0")
      ),
      fuel("tankering", "tankering_units", "Tankering", "0"),
    ],
  },
  {
    title: "Airframe Performance",
    rows: [
      row("Fuel Factor", select("fuelfactor", "P00")),
      row("Cruise Level Offset", select("cruiseoffset", "P0000")),
      unitRow("Service Ceiling", () => "FT", input("ceiling", (t) => t?.ceiling ?? null)),
      row(
        "Default Cruise Profile",
        select("defaultcruise", (t) => t?.defaultCruise ?? only(t?.cruiseProfiles ?? [])),
        input("defaultci", "AUTO")
      ),
      row("Default Climb Profile", select("defaultclimb", (t) => only(t?.climbProfiles ?? []))),
      row("Default Descent Profile", select("defaultdescent", (t) => only(t?.descentProfiles ?? []))),
      row(
        (t) => (t?.thrustUnits === "HP" || t?.thrustUnits === "KW" ? "Takeoff Power" : "Takeoff Thrust"),
        { ...input("thrust", (t) => t?.thrust ?? "N/A"), disabled: noThrust },
        { ...select("thrust_units", (t) => t?.thrustUnits ?? null), disabled: noThrust }
      ),
      row("Takeoff Thrust Flat Rating", {
        ...select("flatrating", (t) => (t?.flatRating ? `Default (${t.flatRating}°C)` : "Default")),
        disabled: (t) => !t?.flatRating,
      }),
    ],
  },
]

// --- rendering --------------------------------------------------------------

// What a part shows right now. Styling keys off this, not the control kind.
//   value       — stored airframe value
//   placeholder — input hint (muted)
//   empty       — nothing stored, nothing known
//   selection   — dropdown, stored or defaulted
//   disabled    — greyed out for this type
type PartState = "value" | "placeholder" | "empty" | "selection" | "disabled"

const PART_STYLE: Record<PartState, string> = {
  value: "",
  placeholder: "text-muted-foreground",
  empty: "",
  selection: "bg-accent/40",
  disabled: "text-muted-foreground opacity-50",
}

function renderPart(part: Part, type: AircraftType, o: Options): { text: string; state: PartState } {
  if (part.disabled?.(type)) return { text: resolve(part.placeholder, type, o) ?? "", state: "disabled" }
  const value = part.get(o)
  if (value !== null) return { text: value, state: part.kind === "select" ? "selection" : "value" }
  const placeholder = resolve(part.placeholder, type, o)
  if (placeholder === null) return { text: "", state: "empty" }
  return { text: placeholder, state: part.kind === "select" ? "selection" : "placeholder" }
}

const profileLabel = (airframe: SimbriefAirframe) => (airframe.isDefault ? "Default" : airframe.label)

// Profile cell text when nothing to pick.
const STATUS_NOTICE: Record<Exclude<SimbriefAirframes["status"], "ok">, string> = {
  unsupported: "SimBrief Incompatible Aircraft Type",
  unavailable: "SimBrief Data Unavailable",
}

export function AircraftSimbriefTable({ status, airframes, aircraftType }: SimbriefAirframes) {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(
    () => airframes.find((a) => a.isDefault)?.id ?? airframes[0]?.id ?? null
  )

  const selected = airframes.find((a) => a.id === selectedId) ?? null
  const canPick = airframes.length > 1
  const notice = status === "ok" ? null : STATUS_NOTICE[status]
  const profile = selected ? profileLabel(selected) : (notice ?? "")

  return (
    <div className="w-lg max-w-full overflow-hidden rounded-md border">
      <Table className="table-fixed">
        <TableBody>
          <TableRow>
            <TableCell className="w-48 font-medium text-muted-foreground">Profile</TableCell>
            <TableCell className="p-0">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <button
                    disabled={!canPick}
                    title={profile}
                    className={cn(
                      "flex h-full w-full items-center gap-1 px-2 py-2 text-left enabled:hover:bg-accent enabled:focus-visible:bg-accent focus-visible:outline-none",
                      canPick && PART_STYLE.selection,
                      notice && "text-muted-foreground"
                    )}
                  >
                    {notice && <Info className="size-3.5 shrink-0" />}
                    <span className="min-w-0 flex-1 truncate">{profile}</span>
                    {canPick && <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-(--radix-popover-trigger-width) min-w-0 p-1" align="start">
                  <div className="max-h-60 overflow-y-auto">
                    {airframes.map((airframe) => {
                      const isSelected = airframe.id === selectedId
                      return (
                        <button
                          key={airframe.id}
                          className={cn(
                            "flex w-full items-center gap-1 rounded py-0.5 pr-2 text-left text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                            isSelected && "font-medium"
                          )}
                          onClick={() => {
                            setSelectedId(airframe.id)
                            setOpen(false)
                          }}
                        >
                          <span className="flex size-7 shrink-0 items-center justify-center">
                            {isSelected && <Check className="size-3.5" />}
                          </span>
                          <span title={profileLabel(airframe)} className="min-w-0 flex-1 truncate">
                            {profileLabel(airframe)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </TableCell>
          </TableRow>
          {SECTIONS.map(({ title, rows }) => (
            <Fragment key={title}>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableCell colSpan={2} className="text-xs leading-5 font-semibold uppercase tracking-wide text-muted-foreground">
                  {title}
                </TableCell>
              </TableRow>
              {rows.map(({ label: rawLabel, unit, parts }) => {
                const label = rowLabel(rawLabel, aircraftType)
                const badge = selected && unit?.(selected.options)
                return (
                  <TableRow key={label}>
                    <TableCell className="w-48 font-medium text-muted-foreground">{label}</TableCell>
                    <TableCell className="p-0">
                      <div className="flex items-center">
                        <div className="flex min-w-0 flex-1">
                          {parts.map((part, i) => {
                            // No airframe: whole column blank.
                            const { text, state } = selected
                              ? renderPart(part, aircraftType, selected.options)
                              : { text: "", state: "empty" as const }
                            return (
                              <div
                                key={i}
                                title={text}
                                className={cn("min-w-0 flex-1 truncate px-2 py-2", PART_STYLE[state])}
                              >
                                {text}
                              </div>
                            )
                          })}
                        </div>
                        {badge && (
                          <span className="mx-2 shrink-0 rounded border px-1 text-[10px] leading-4 text-muted-foreground">
                            {badge}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
