import { ColumnDef, Table } from "@tanstack/react-table"

import {
  AircraftStatus,
  AircraftTypeDescription,
  AircraftTypeEngineCategory,
  AircraftTypeWakeTurbulenceCategory,
} from "@/lib/generated/prisma/enums"
import { Aircraft } from "@/components/ops/fleet/types"

export const EMPTY_VALUE = "—"

const AIRCRAFT_CATEGORY_LABELS: Record<AircraftTypeDescription, string> = {
  LANDPLANE: "Landplane",
  SEAPLANE: "Seaplane",
  AMPHIBIAN: "Amphibian",
  HELICOPTER: "Helicopter",
  GYROCOPTER: "Gyrocopter",
  TILTROTOR: "Tiltrotor",
}

const ENGINE_CATEGORY_LABELS: Record<AircraftTypeEngineCategory, string> = {
  PISTON: "Piston",
  TURBOPROP_TURBOSHAFT: "Turboprop/Turboshaft",
  JET: "Jet",
  ELECTRIC: "Electric",
  ROCKET: "Rocket",
}

export function formatAircraftCategory(value: AircraftTypeDescription | null): string {
  return value ? AIRCRAFT_CATEGORY_LABELS[value] : EMPTY_VALUE
}

export function formatEngineCategory(value: AircraftTypeEngineCategory | null): string {
  return value ? ENGINE_CATEGORY_LABELS[value] : EMPTY_VALUE
}

const AIRCRAFT_CATEGORY_CODES: Record<AircraftTypeDescription, string> = {
  LANDPLANE: "L",
  SEAPLANE: "S",
  AMPHIBIAN: "A",
  HELICOPTER: "H",
  GYROCOPTER: "G",
  TILTROTOR: "T",
}

const ENGINE_CATEGORY_CODES: Record<AircraftTypeEngineCategory, string> = {
  PISTON: "P",
  TURBOPROP_TURBOSHAFT: "T",
  JET: "J",
  ELECTRIC: "E",
  ROCKET: "R",
}

export function formatTypeCode(
  description: AircraftTypeDescription | null,
  engineCount: string | null,
  engineCategory: AircraftTypeEngineCategory | null
): string {
  if (!description || !engineCount || !engineCategory) return EMPTY_VALUE
  return `${AIRCRAFT_CATEGORY_CODES[description]}${engineCount}${ENGINE_CATEGORY_CODES[engineCategory]}`
}

export function formatAerodromeReferenceCode(number: number | null, letter: string | null): string {
  return number !== null && letter ? `${number}${letter}` : EMPTY_VALUE
}

export function formatWakeTurbulenceCategory(values: AircraftTypeWakeTurbulenceCategory[]): string {
  return values.length ? values.join("/") : EMPTY_VALUE
}

const WTC_RANK: Record<AircraftTypeWakeTurbulenceCategory, number> = { L: 0, M: 1, H: 2, J: 3 }
const WTC_EMPTY_RANK = Object.keys(WTC_RANK).length

// Compound values rank between their parts (L/M = 0.5, between L and M).
export function wakeTurbulenceRank(values: AircraftTypeWakeTurbulenceCategory[]): number {
  if (!values.length) return WTC_EMPTY_RANK
  return values.reduce((sum, v) => sum + WTC_RANK[v], 0) / values.length
}

// Inverse of formatWakeTurbulenceCategory, for ordering display strings (filter options).
export function wakeTurbulenceDisplayRank(display: string): number {
  if (display === EMPTY_VALUE) return WTC_EMPTY_RANK
  return wakeTurbulenceRank(display.split("/") as AircraftTypeWakeTurbulenceCategory[])
}

const STATUS_LABELS: Record<AircraftStatus, string> = {
  ACTIVE: "Active",
  STORED: "Stored",
  RETIRED: "Retired",
  SCRAPPED: "Scrapped",
  SUPERSEDED: "Superseded",
}

export function formatAircraftStatus(value: AircraftStatus): string {
  return STATUS_LABELS[value]
}

// Serial-style strings: numeric-aware, missing values last.
export function compareSerials(a: string, b: string): number {
  if (a === EMPTY_VALUE) return b === EMPTY_VALUE ? 0 : 1
  if (b === EMPTY_VALUE) return -1
  return a.localeCompare(b, undefined, { numeric: true })
}

export const aircraftAccessors = {
  msn: (row: Aircraft) => row.msn ?? EMPTY_VALUE,
  lineNumber: (row: Aircraft) => row.lineNumber ?? EMPTY_VALUE,
  status: (row: Aircraft) => formatAircraftStatus(row.status),
}

export const aircraftTypeAccessors = {
  manufacturer: (row: Aircraft) => row.aircraftType.manufacturer,
  model: (row: Aircraft) => row.aircraftType.model,
  aircraftCategory: (row: Aircraft) => formatAircraftCategory(row.aircraftType.description),
  engineCategory: (row: Aircraft) => formatEngineCategory(row.aircraftType.engineCategory),
  engineCount: (row: Aircraft) => row.aircraftType.engineCount ?? EMPTY_VALUE,
  wakeTurbulenceCategory: (row: Aircraft) =>
    formatWakeTurbulenceCategory(row.aircraftType.wakeTurbulenceCategory),
}

export function uniqueOrdered<T>(
  items: T[],
  keyOf: (item: T) => string
): T[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = keyOf(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function getColumnId<T>(column: ColumnDef<T>): string {
  return "id" in column && column.id
    ? column.id
    : (column as { accessorKey: string }).accessorKey
}

export function getRegPrefix(registration: string): string {
  const trimmed = registration.trim().toUpperCase()

  const delimiterIndex = trimmed.search(/[-+]/)
  if (delimiterIndex > 0) {
    const delimiter = trimmed[delimiterIndex]
    return trimmed.slice(0, delimiterIndex) + delimiter
  }

  const match = trimmed.match(/^[A-Z]+/)
  return match ? match[0] : trimmed
}

const pad2 = (n: number) => String(n).padStart(2, "0")

export function formatUTCDate(date: Date): string {
  const year = String(date.getUTCFullYear())
  const month = pad2(date.getUTCMonth() + 1)
  const day = pad2(date.getUTCDate())
  return `${year}-${month}-${day}`
}

export function formatDateAdded(date: Date): string {
  const hours = pad2(date.getUTCHours())
  const minutes = pad2(date.getUTCMinutes())
  return `${formatUTCDate(date)} / ${hours}:${minutes}Z`
}

export function getSortMeta<T>(columnId: string, table: Table<T>) {
  const rawSorting = table.options.meta?.rawSorting ?? []
  const ownSort = rawSorting.find((s) => s.id === columnId)
  const isSorted: false | "asc" | "desc" = ownSort
    ? ownSort.desc
      ? "desc"
      : "asc"
    : false
  const sortIndex = rawSorting.findIndex((s) => s.id === columnId)
  return { isSorted, sortIndex, sortCount: rawSorting.length }
}

export function sameUTCDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  )
}

export function toUTCMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

export function parseDateInput(raw: string): Date | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  }

  const parsed = new Date(trimmed)
  return isNaN(parsed.getTime()) ? null : parsed
}