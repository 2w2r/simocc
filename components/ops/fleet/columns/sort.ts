import { Aircraft } from "@/components/ops/fleet/columns/types";

export function sortAllData(
  allData: Aircraft[],
  sorting: { id: string; desc: boolean }[]
): Aircraft[] {
  const activeSort = sorting[0]
  if (!activeSort) return allData
  return [...allData].sort((a, b) => {
    let aKey = ""
    let bKey = ""
    if (activeSort.id === "registration") {
      aKey = a.registration
      bKey = b.registration
    } else if (activeSort.id === "icaoCode") {
      aKey = a.icaoCode
      bKey = b.icaoCode
    } else if (activeSort.id === "operator") {
      aKey =
        !a.operator?.icaoCode && !a.operator?.iataCode
          ? "\uFFFF"
          : (a.operator?.icaoCode ?? a.operator?.iataCode ?? "\uFFFF")
      bKey =
        !b.operator?.icaoCode && !b.operator?.iataCode
          ? "\uFFFF"
          : (b.operator?.icaoCode ?? b.operator?.iataCode ?? "\uFFFF")
    }
    return activeSort.desc ? bKey.localeCompare(aKey) : aKey.localeCompare(bKey)
  })
}