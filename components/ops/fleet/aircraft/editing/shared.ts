
import type { FlightPlanTextField } from "@/components/ops/fleet/types"

// Toolbar form; inputs join via `form` attr, constraints checked on save.
export const AIRCRAFT_EDIT_FORM_ID = "aircraft-edit"

// Server validation + input `pattern`. EXAMPLES: tooltip + errors, ICAO
// Doc 4444 App 2, Item 7 (EIAKO, 4XBCD, N2567GA; display hyphens).
export const REGISTRATION_PATTERN = /^[A-Z0-9]{1,2}-?[A-Z0-9]{1,5}$/
export const REGISTRATION_MAX_LENGTH = 8
export const REGISTRATION_EXAMPLES = "EI-AKO, 4X-BCD, N2567GA"

export function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value)
    return protocol === "http:" || protocol === "https:"
  } catch {
    return false
  }
}

export function normalizeRegistration(raw: string | null | undefined): string {
  return raw?.trim().toUpperCase() ?? ""
}

// FPL text columns. Server whitelist: payload keys never reach Prisma unchecked.
export const FLIGHT_PLAN_TEXT_FIELDS = [
  "item10a", "item10b", "pbn", "nav", "com", "dat", "sur", "sel", "code", "per", "rvr",
] as const satisfies readonly FlightPlanTextField[]

// Compile error if a FPL column is missing above: unlisted column silently dropped on save.
true satisfies FlightPlanTextField extends (typeof FLIGHT_PLAN_TEXT_FIELDS)[number] ? true : false

// Last control pads end by `--cell-end-pad`: room for FPL badge.
export const CELL_CONTROL =
  "flex h-9 w-full min-w-0 items-center gap-1 bg-accent/40 px-2 text-left text-sm outline-none transition-colors hover:bg-accent focus-visible:bg-accent disabled:pointer-events-none disabled:opacity-50 last:pr-[var(--cell-end-pad,0.5rem)]"

export const CELL_TYPABLE =
  "cursor-text placeholder:text-muted-foreground focus:bg-accent has-[input:focus]:bg-accent"

export const CELL_ICON = "size-3.5 shrink-0 text-muted-foreground"
