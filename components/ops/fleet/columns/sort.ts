import { ColumnDef, GroupingState, SortingState } from "@tanstack/react-table"

import { Aircraft } from "@/components/ops/fleet/types"
import { getColumnId, aircraftTypeAccessors, wakeTurbulenceRank } from "@/components/ops/fleet/columns/utils"

type SortKey = (row: Aircraft) => string | number

const SORT_KEY_EXTRACTORS: Record<string, SortKey> = {
  registration: (row) => row.registration,
  aircraftTypeIcaoCode: (row) => row.aircraftType.icaoCode,
  ...aircraftTypeAccessors,
  operator: (row) =>
    row.operator?.icaoCode || row.operator?.iataCode
      ? (row.operator.icaoCode ?? row.operator.iataCode ?? "\uFFFF")
      : "\uFFFF",
  wakeTurbulenceCategory: (row) => wakeTurbulenceRank(row.aircraftType.wakeTurbulenceCategory),
}

function compareKeys(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") return a - b
  return String(a).localeCompare(String(b))
}

export function sortAllData(
  allData: Aircraft[],
  sorting: { id: string; desc: boolean }[]
): Aircraft[] {
  const activeSort = sorting[0]
  if (!activeSort) return allData

  const getKey = SORT_KEY_EXTRACTORS[activeSort.id]
  if (!getKey) return allData

  return [...allData].sort((a, b) => {
    const comparison = compareKeys(getKey(a), getKey(b))
    return activeSort.desc ? -comparison : comparison
  })
}

export function resolveEffectiveSorting(
  sorting: SortingState,
  grouping: GroupingState,
  columns: ColumnDef<Aircraft>[]
): SortingState {
  const derivedIdBySourceId = new Map(
    columns
      .filter(
        (column) =>
          column.meta?.derivedFrom && grouping.includes(getColumnId(column))
      )
      .map((column) => [column.meta!.derivedFrom!, getColumnId(column)])
  )

  return sorting.flatMap((entry) => {
    const derivedId = derivedIdBySourceId.get(entry.id)
    if (!derivedId || sorting.some((other) => other.id === derivedId)) {
      return [entry]
    }
    return [{ id: derivedId, desc: entry.desc }, entry]
  })
}
