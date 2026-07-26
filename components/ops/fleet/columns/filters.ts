import { Aircraft } from "@/components/ops/fleet/types"

export const multiSelectFilter = (
  row: { getValue: (id: string) => unknown },
  columnId: string,
  filterValues: string[]
) => {
  if (!filterValues?.length) return true
  return filterValues.includes(row.getValue(columnId) as string)
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