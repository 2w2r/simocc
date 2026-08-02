import { OnChangeFn, Row, RowSelectionState } from "@tanstack/react-table"

export type DateGranularity = "day" | "month" | "year"
export type FoldedEntry = { value: string; count: number }

export function getLeafRows<T>(row: Row<T>): Row<T>[] {
  if (!row.subRows || row.subRows.length === 0) return [row]
  return row.subRows.flatMap(getLeafRows)
}

export function getGroupSelectionState<T>(
  row: Row<T>,
  rowSelection: RowSelectionState
): boolean | "indeterminate" {
  const leaves = getLeafRows(row)
  const selectedCount = leaves.filter((leaf) => rowSelection[leaf.id]).length
  if (selectedCount === 0) return false
  if (selectedCount === leaves.length) return true
  return "indeterminate"
}

export function toggleGroupSelection<T>(
  row: Row<T>,
  rowSelection: RowSelectionState,
  setRowSelection: OnChangeFn<RowSelectionState>
) {
  const leaves = getLeafRows(row)
  const allSelected = leaves.every((leaf) => rowSelection[leaf.id])
  setRowSelection((prev) => {
    const next = { ...prev }
    leaves.forEach((leaf) => {
      if (allSelected) {
        delete next[leaf.id]
      } else {
        next[leaf.id] = true
      }
    })
    return next
  })
}

export function findOutermostCollapsedAncestor<T>(
  row: Row<T>,
  collapsedGroupIds: Set<string>
): Row<T> | null {
  let result: Row<T> | null = null
  let current: Row<T> | undefined = row
  while (current) {
    if (collapsedGroupIds.has(current.id)) result = current
    current = current.getParentRow()
  }
  return result
}

export function getGroupedLevelSummaries<T>(
  row: Row<T>,
  resolveDisplayValue: (r: Row<T>) => string
): FoldedEntry[][] {
  const levels: Map<string, number>[] = []

  function walk(node: Row<T>, depth: number) {
    const childGroups = node.subRows.filter((r) => r.getIsGrouped())
    if (childGroups.length === 0) return

    if (!levels[depth]) levels[depth] = new Map()

    for (const child of childGroups) {
      const value = resolveDisplayValue(child)
      const leafCount = getLeafRows(child).length
      levels[depth].set(value, (levels[depth].get(value) ?? 0) + leafCount)
      walk(child, depth + 1)
    }
  }

  walk(row, 0)

  return levels.map((levelMap) => {
    const entries = [...levelMap.entries()]
    const allSameCount = entries.every(([, count]) => count === entries[0][1])
    return entries.map(([value, count]) => ({
      value,
      count: allSameCount ? 0 : count,
    }))
  })
}

export function resolveGroupDisplayValue<T extends { operator: { icaoCode: string | null; iataCode: string | null; name: string } }>(
  row: Row<T>
): string {
  if (row.groupingColumnId === "operator") {
    const operator = row.subRows[0]?.original.operator
    if (!operator) return String(row.groupingValue)
    return `${operator.icaoCode ?? "—"}/${operator.iataCode ?? "—"}`
  }
  return String(row.groupingValue)
}

export function getDateGroupingValue(row: { createdAt: Date | string }, granularity: DateGranularity): string {
  const d = new Date(row.createdAt)
  const year = String(d.getUTCFullYear())
  const month = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")

  if (granularity === "year") return year
  if (granularity === "month") return `${year}-${month}`
  return `${year}-${month}-${day}`
}

export function applyBudget(levels: FoldedEntry[][], budget: number) {
  let remaining = budget
  return levels.map((entries) => {
    if (remaining <= 0) return { shown: [] as FoldedEntry[], hiddenCount: entries.length }
    if (remaining >= entries.length) {
      remaining -= entries.length
      return { shown: entries, hiddenCount: 0 }
    }
    const shown = entries.slice(0, remaining)
    const hiddenCount = entries.length - shown.length
    remaining = 0
    return { shown, hiddenCount }
  })
}
