import { Aircraft } from "@/components/ops/fleet/types"

type SortKey = (row: Aircraft) => string

const SORT_KEY_EXTRACTORS: Record<string, SortKey> = {
  registration: (row) => row.registration,
  icaoCode: (row) => row.icaoCode,
  operator: (row) =>
    row.operator?.icaoCode || row.operator?.iataCode
      ? (row.operator.icaoCode ?? row.operator.iataCode ?? "\uFFFF")
      : "\uFFFF",
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
    const comparison = getKey(a).localeCompare(getKey(b))
    return activeSort.desc ? -comparison : comparison
  })
}