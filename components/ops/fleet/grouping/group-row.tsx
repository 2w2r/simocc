"use client"

import { OnChangeFn, Row, RowSelectionState } from "@tanstack/react-table"
import { ChevronDown, ChevronRight } from "lucide-react"
import { useLayoutEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { FleetGroupCheckbox } from "@/components/ops/fleet/grouping/checkbox"
import {
  applyBudget,
  findOutermostCollapsedAncestor,
  FoldedEntry,
  getGroupedLevelSummaries,
  getGroupSelectionState,
  resolveGroupDisplayValue,
  toggleGroupSelection,
} from "@/components/ops/fleet/grouping/utils"
import { TableCell, TableRow } from "@/components/ui/table"

function FoldedLevels({ levels }: { levels: FoldedEntry[][] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const totalEntries = levels.reduce((sum, l) => sum + l.length, 0)
  const [budget, setBudget] = useState(totalEntries)

  useLayoutEffect(() => {
    setBudget(totalEntries)
  }, [levels, totalEntries])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => {
      setBudget(totalEntries)
      requestAnimationFrame(() => {
        const el = containerRef.current
        if (!el) return
        if (el.scrollWidth > el.clientWidth) {
          setBudget((b) => Math.max(0, b - 1))
        }
      })
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [totalEntries])

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    if (el.scrollWidth > el.clientWidth && budget > 0) {
      setBudget((b) => Math.max(0, b - 1))
    }
  }, [budget])

  const display = applyBudget(levels, budget)

  return (
    <div
      ref={containerRef}
      className="flex flex-1 min-w-0 max-w-[calc(100%-1rem)] items-center gap-1.5 overflow-hidden pr-10 text-muted-foreground"
    >
      {display.map(({ shown, hiddenCount }, i) => {
        if (shown.length === 0 && hiddenCount === 0) return null
        return (
          <span key={i} className="inline-flex shrink-0 items-center gap-1.5">
            <ChevronRight className="size-3.5 shrink-0 opacity-50" />
            {shown.map((entry, j) => (
              <span key={entry.value} className="inline-flex items-center gap-1">
                {j > 0 && <span className="text-muted-foreground">·</span>}
                <span>{entry.value}</span>
                {entry.count > 1 && (
                  <span className="inline-flex h-4 items-center justify-center rounded-sm bg-primary/15 px-1 text-[0.7rem]">
                    {entry.count}
                  </span>
                )}
              </span>
            ))}
            {hiddenCount > 0 && (
              <>
                {shown.length > 0 && <span className="text-muted-foreground">·</span>}
                <span className="inline-flex h-4 items-center justify-center rounded-sm border border-border px-1 text-[0.7rem] text-muted-foreground">
                  +{hiddenCount}
                </span>
              </>
            )}
          </span>
        )
      })}
    </div>
  )
}

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
      <TableCell colSpan={row.getVisibleCells().length} className="max-w-0 font-medium">
        <div className="flex w-full min-w-0 items-center gap-1.5 overflow-hidden">
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
                  <span className="inline-flex h-4 px-1 items-center justify-center rounded-sm bg-primary/15 text-[0.7rem]">
                    {levelCount}
                  </span>
                )}
              </span>
            )
          })}
          {isRepresentative && <FoldedLevels levels={foldedLevels} />}
        </div>
      </TableCell>
    </TableRow>
  )
}