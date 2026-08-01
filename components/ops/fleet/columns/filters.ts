import { getRegPrefix } from "@/components/ops/fleet/columns/utils"
import { Aircraft } from "@/components/ops/fleet/types"
import { Row } from "@tanstack/react-table"

export const multiSelectFilter = (
  row: { getValue: (id: string) => unknown },
  columnId: string,
  filterValues: string[]
) => {
  if (!filterValues?.length) return true
  return filterValues.includes(row.getValue(columnId) as string)
}

export function regPrefixFilter(
  row: Row<Aircraft>,
  _columnId: string,
  filterValue: string[]
): boolean {
  const prefix = getRegPrefix(row.original.registration)
  return filterValue.includes(prefix)
}

export const operatorFilter = (
  row: { original: Aircraft },
  _columnId: string,
  filterValues: string[]
) => {
  if (!filterValues?.length) return true
  const operator = row.original.operator
  const value =
    operator?.icaoCode ?? operator?.iataCode ?? operator?.name ?? ""
  return filterValues.includes(value)
}

export function dateRangeFilter(
  row: Row<Aircraft>,
  columnId: string,
  filterValue?: { from?: Date; to?: Date }
): boolean {
  if (!filterValue?.from && !filterValue?.to) return true
  const cellDate = new Date(row.getValue(columnId) as Date)
  if (filterValue.from && cellDate < filterValue.from) return false
  if (filterValue.to) {
    const endOfDay = new Date(filterValue.to)
    endOfDay.setHours(23, 59, 59, 999)
    if (cellDate > endOfDay) return false
  }
  return true
}