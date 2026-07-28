"use client"

import { OnChangeFn, Row, RowSelectionState } from "@tanstack/react-table"
import { ChevronDown, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FleetGroupCheckbox } from "@/components/ops/fleet/grouping/checkbox"
import {
  findOutermostCollapsedAncestor,
  getGroupedLevelSummaries,
  getGroupSelectionState,
  resolveGroupDisplayValue,
  toggleGroupSelection,
} from "@/components/ops/fleet/grouping/utils"
import { TableCell, TableRow } from "@/components/ui/table"

export function FleetGroupRow<T extends { operator: { icaoCode: string | null; iataCode: string | null; name: string } }>({
  row,
  collapsedGroupIds,
  onToggleCollapse,
  rowSelection,
  setRowSelection,
}: {
  row: Row<T>
  collapsedGroupIds: Set<string>
  onToggleCollapse: (rowId: string) => void
  rowSelection: RowSelectionState
  setRowSelection: OnChangeFn<RowSelectionState>
}) {
  const nearestCollapsed = findOutermostCollapsedAncestor(row, collapsedGroupIds)

  if (nearestCollapsed && nearestCollapsed.id !== row.id) return null

  const isRepresentative = !!nearestCollapsed
  if (!isRepresentative) {
    const isInnermostGroup = !row.subRows[0]?.getIsGrouped()
    if (!isInnermostGroup) return null
  }

  const breadcrumbLevels: Row<T>[] = []
  let current: Row<T> | undefined = row
  while (current && current.getIsGrouped()) {
    breadcrumbLevels.unshift(current)
    current = current.getParentRow()
  }

  const foldedLevels = isRepresentative
    ? getGroupedLevelSummaries(row, resolveGroupDisplayValue)
    : []

  return (
    <TableRow className="bg-muted/50">
      <TableCell colSpan={row.getVisibleCells().length} className="font-medium">
        <div className="inline-flex items-center gap-1.5">
          {breadcrumbLevels.map((levelRow, index) => {
            const isLastSegment = index === breadcrumbLevels.length - 1
            const isLevelCollapsed = collapsedGroupIds.has(levelRow.id)
            const levelCount = levelRow.subRows.length

            return (
              <span key={levelRow.id} className="inline-flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  title={isLastSegment && isLevelCollapsed ? "Expand" : "Collapse"}
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleCollapse(levelRow.id)
                  }}
                >
                  {isLastSegment && isLevelCollapsed ? (
                    <ChevronRight className="size-3.5" />
                  ) : (
                    <ChevronDown className="size-3.5" />
                  )}
                </Button>
                <FleetGroupCheckbox
                  checked={getGroupSelectionState(levelRow, rowSelection)}
                  onCheckedChange={() => toggleGroupSelection(levelRow, rowSelection, setRowSelection)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Select ${resolveGroupDisplayValue(levelRow)}`}
                  className="size-3.5"
                />
                <span className="cursor-default">{resolveGroupDisplayValue(levelRow)}</span>
                {levelCount > 1 && (
                  <span className="inline-flex size-4 items-center justify-center rounded-sm bg-primary/15 text-[0.7rem]">
                    {levelCount}
                  </span>
                )}
              </span>
            )
          })}
          {foldedLevels.map((levelEntries, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 text-muted-foreground">
              <ChevronRight className="size-3.5 opacity-50" />
              {levelEntries.map((entry, j) => (
                <span key={entry.value} className="inline-flex items-center gap-1">
                  {j > 0 && <span className="text-muted-foreground">·</span>}
                  {entry.value}
                  {entry.count > 1 && (
                    <span className="inline-flex size-4 items-center justify-center rounded-sm bg-primary/15 text-[0.7rem]">
                      {entry.count}
                    </span>
                  )}
                </span>
              ))}
            </span>
          ))}
        </div>
      </TableCell>
    </TableRow>
  )
}