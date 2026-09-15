const SIMBRIEF_AIRFRAMES_URL = "https://www.simbrief.com/api/inputs.airframes.json"
const SIMBRIEF_INPUTS_URL = "https://www.simbrief.com/api/inputs.list.json"
const SIMBRIEF_AIRFRAMES_REVALIDATE_S = 3600

// SimBrief uses false and "" interchangeably as "not provided".
type SimbriefValue = string | number | boolean | null | undefined

// --- feed shape -------------------------------------------------------------

// Every airframe_options key observed in the feed, feed order.
const SIMBRIEF_OPTION_KEYS = [
  "basetype",
  "icao",
  "reg",
  "fin",
  "selcal",
  "hexcode",
  "name",
  "engines",
  "comments",
  "cat",
  "per",
  "equip",
  "transponder",
  "pbn",
  "extrarmk",
  "wgtunits",
  "maxpax",
  "paxwgt",
  "bagwgt",
  "oew",
  "mzfw",
  "mtow",
  "mlw",
  "maxfuel",
  "maxcargo",
  "defaultcruise",
  "defaultci",
  "defaultclimb",
  "defaultdescent",
  "fuelfactor",
  "ceiling",
  "thrust",
  "thrust_units",
  "flatrating",
  "cruiseoffset",
  "etopsthreshold",
  "etopsrange",
  "planunits",
  "cargomode",
  "planformat",
  "flightrules",
  "flighttype",
  "altnsadv_radius",
  "altnsadv_rwy",
  "altnsadv_units_rwy",
  "manualrmk",
  "contpct",
  "resvrule",
  "taxifuel",
  "minfob",
  "minfod",
  "melfuel",
  "atcfuel",
  "wxxfuel",
  "addedfuel",
  "tankering",
  "minfob_units",
  "minfod_units",
  "melfuel_units",
  "atcfuel_units",
  "wxxfuel_units",
  "addedfuel_units",
  "tankering_units",
  "addedfuel_label",
] as const

export type SimbriefOptionKey = (typeof SIMBRIEF_OPTION_KEYS)[number]

type SimbriefAirframeEntry = {
  airframe_id: number | false
  airframe_comments: SimbriefValue
  airframe_name: SimbriefValue
  airframe_options: Partial<Record<SimbriefOptionKey, SimbriefValue>>
}

type SimbriefTypeEntry = {
  aircraft_profiles_climb?: SimbriefValue | SimbriefValue[]
  aircraft_profiles_cruise?: SimbriefValue | SimbriefValue[]
  aircraft_profiles_descent?: SimbriefValue | SimbriefValue[]
  aircraft_default_cruise?: SimbriefValue
  aircraft_ceiling?: SimbriefValue
  aircraft_thrust_lbf?: SimbriefValue
  aircraft_thrust_shp?: SimbriefValue
  aircraft_thrust_flat_rating?: SimbriefValue
  airframes?: SimbriefAirframeEntry[]
}

type SimbriefAirframesResponse = Record<string, SimbriefTypeEntry>

// --- public shape -----------------------------------------------------------

export type SimbriefAirframe = {
  id: string
  isDefault: boolean
  label: string
  // Display strings: units and select codes decoded to form labels.
  options: Record<SimbriefOptionKey, string | null>
  // Feed values as stored (false/"" → null); for building share URLs.
  raw: Record<SimbriefOptionKey, string | null>
}

// Type-level defaults applied when an airframe leaves a field unset.
export type SimbriefAircraftType = {
  climbProfiles: string[]
  cruiseProfiles: string[]
  descentProfiles: string[]
  defaultCruise: string | null
  ceiling: string | null
  thrust: string | null
  // Jets: thrust (LBF/N). Props: power (HP/KW); form titles the row accordingly.
  thrustUnits: "LBF" | "N" | "HP" | "KW" | null
  flatRating: string | null
}

export type SimbriefAirframes = {
  // unsupported: no SimBrief base type for this ICAO code. unavailable: feed unreadable.
  status: "ok" | "unsupported" | "unavailable"
  aircraftType: SimbriefAircraftType | null
  airframes: SimbriefAirframe[]
}

// --- helpers ----------------------------------------------------------------

const empty = (status: Exclude<SimbriefAirframes["status"], "ok">): SimbriefAirframes => ({
  status,
  aircraftType: null,
  airframes: [],
})

function optional(value: SimbriefValue): string | null {
  if (value === false || value === "" || value === null || value === undefined) return null
  return String(value)
}

function list(value: SimbriefValue | SimbriefValue[] | undefined): string[] {
  const values = Array.isArray(value) ? value : [value]
  return values.map(optional).filter((v): v is string => v !== null)
}

function toType(entry: SimbriefTypeEntry): SimbriefAircraftType {
  const thrustLbf = optional(entry.aircraft_thrust_lbf)
  const thrustShp = optional(entry.aircraft_thrust_shp)
  return {
    climbProfiles: list(entry.aircraft_profiles_climb),
    cruiseProfiles: list(entry.aircraft_profiles_cruise),
    descentProfiles: list(entry.aircraft_profiles_descent),
    defaultCruise: optional(entry.aircraft_default_cruise),
    ceiling: optional(entry.aircraft_ceiling),
    thrust: thrustLbf ?? thrustShp,
    thrustUnits: thrustLbf ? "LBF" : thrustShp ? "HP" : null,
    flatRating: optional(entry.aircraft_thrust_flat_rating),
  }
}

// --- decode: feed codes → SimBrief form labels ------------------------------

// Unit / mode selectors stored lowercase (ft, lbf, min, wgt, extra); form shows caps.
const UPPERCASE_KEYS: readonly SimbriefOptionKey[] = [
  "wgtunits",
  "thrust_units",
  "altnsadv_units_rwy",
  "minfob_units",
  "minfod_units",
  "melfuel_units",
  "atcfuel_units",
  "wxxfuel_units",
  "addedfuel_units",
  "tankering_units",
  "addedfuel_label",
]

// Feed spellings vs form labels.
const UNIT_LABELS: Record<string, string> = { KGS: "KG", SHP: "HP" }
const unitLabel = (value: string | null) => (value === null ? null : (UNIT_LABELS[value] ?? value))

// Select codes → form labels. Unknown codes pass through.
const lookup =
  (map: Record<string, string>) =>
  (code: string): string =>
    map[code] ?? code
const minutes = (code: string) => (/^\d+$/.test(code) ? `${code} Minutes` : code)
const DECODE: Partial<Record<SimbriefOptionKey, (code: string, layouts: Record<string, string>) => string>> = {
  planformat: (code, layouts) => layouts[code] ?? code.toUpperCase(),
  flightrules: lookup({ i: "IFR", v: "VFR", y: "IFR to VFR", z: "VFR to IFR" }),
  flighttype: lookup({ s: "Scheduled", n: "Non-scheduled", g: "General Aviation", m: "Military", x: "Training" }),
  planunits: lookup({ "0": "Kilograms", "1": "Pounds" }),
  per: lookup({
    A: "A (Vref < 91 kts)",
    B: "B (Vref 91-120 kts)",
    C: "C (Vref 121-140 kts)",
    D: "D (Vref 141-165 kts)",
    E: "E (Vref 166-210 kts)",
  }),
  cat: lookup({ L: "L (Light)", M: "M (Medium)", H: "H (Heavy)", J: "J (Super)" }),
  etopsthreshold: minutes,
  etopsrange: minutes,
  cargomode: lookup({ NONE: "None", AUTO: "Auto" }),
  // Contingency: "auto" | "none" | "easa" | fraction ("0.05" → 5%) |
  // fraction/minutes ("0.03/15" → 3% or 15 Minutes) | minutes ("43").
  contpct: (code) => {
    const named: Record<string, string> = { auto: "Auto", none: "None", easa: "EASA" }
    if (named[code]) return named[code]
    const [pct, mins] = code.split("/")
    const pctLabel = /^0?\.\d+$/.test(pct) ? `${Math.round(Number(pct) * 100)}%` : null
    if (pctLabel && mins) return `${pctLabel} or ${mins} Minutes`
    if (pctLabel) return pctLabel
    return minutes(code)
  },
  // Reserve: "auto" | "none" | FAA rules | minutes ("30").
  resvrule: (code) => {
    const named: Record<string, string> = {
      auto: "Auto",
      none: "None",
      faa: "FAA (Auto)",
      "45/0": "FAA (Domestic)",
      "30/0.10": "FAA (Flag)",
      b043: "FAA (B043)",
      b343: "FAA (B343)",
    }
    return named[code] ?? minutes(code)
  },
  flatrating: (code) => (/^\d+$/.test(code) ? `${code}°C` : code),
}

function decode(key: SimbriefOptionKey, value: string | null, layouts: Record<string, string>): string | null {
  if (value === null) return null
  if (UPPERCASE_KEYS.includes(key)) return unitLabel(value.toUpperCase())
  return DECODE[key]?.(value, layouts) ?? value
}

function toAirframe(entry: SimbriefAirframeEntry, layouts: Record<string, string>): SimbriefAirframe {
  const isDefault = entry.airframe_id === false
  const source = entry.airframe_options ?? {}

  // Numbers as stored; weights are in `wgtunits`.
  const raw = Object.fromEntries(
    SIMBRIEF_OPTION_KEYS.map((key) => [key, optional(source[key])])
  ) as SimbriefAirframe["raw"]
  const options = Object.fromEntries(
    SIMBRIEF_OPTION_KEYS.map((key) => [key, decode(key, raw[key], layouts)])
  ) as SimbriefAirframe["options"]

  return {
    id: isDefault ? "default" : String(entry.airframe_id),
    isDefault,
    label: optional(entry.airframe_comments) ?? optional(entry.airframe_name) ?? "Unnamed",
    options,
    raw,
  }
}

// --- fetch ------------------------------------------------------------------

// OFP layout ids → short names (LIDO, DLH, ...).
async function getLayouts(): Promise<Record<string, string>> {
  try {
    const res = await fetch(SIMBRIEF_INPUTS_URL, { next: { revalidate: SIMBRIEF_AIRFRAMES_REVALIDATE_S } })
    if (!res.ok) return {}
    const json = (await res.json()) as { layouts?: Record<string, { name_short?: SimbriefValue }> }
    return Object.fromEntries(
      Object.entries(json.layouts ?? {}).flatMap(([id, layout]) => {
        const name = optional(layout.name_short)
        return name ? [[id, name]] : []
      })
    )
  } catch {
    return {}
  }
}

export async function getSimbriefAirframes(icaoCode: string): Promise<SimbriefAirframes> {
  try {
    const [res, layouts] = await Promise.all([
      fetch(SIMBRIEF_AIRFRAMES_URL, { next: { revalidate: SIMBRIEF_AIRFRAMES_REVALIDATE_S } }),
      getLayouts(),
    ])
    if (!res.ok) return empty("unavailable")

    const json = (await res.json()) as SimbriefAirframesResponse
    const entry = json[icaoCode]
    if (!entry) return empty("unsupported")

    const airframes = (entry.airframes ?? []).map((e) => toAirframe(e, layouts)).sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1
      return a.label.localeCompare(b.label)
    })

    return { status: "ok", aircraftType: toType(entry), airframes }
  } catch {
    return empty("unavailable")
  }
}
