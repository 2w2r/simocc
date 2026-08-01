import { Table } from "@tanstack/react-table"

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

export function formatDateAdded(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  const year = String(date.getUTCFullYear())
  const month = pad(date.getUTCMonth() + 1)
  const day = pad(date.getUTCDate())
  const hours = pad(date.getUTCHours())
  const minutes = pad(date.getUTCMinutes())
  return `${year}-${month}-${day} / ${hours}:${minutes}Z`
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