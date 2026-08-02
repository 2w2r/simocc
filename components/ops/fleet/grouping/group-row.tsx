"use client"

import { OnChangeFn, Row, RowSelectionState } from "@tanstack/react-table"
import { ChevronDown, ChevronRight } from "lucide-react"
import { useLayoutEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { FleetGroupCheckbox } from "@/components/ops/fleet/grouping/checkbox"
import {
  applyBudget,
  findOutermostCollapsedAncestor,
  FoldedEntry,
  getGroupedLevelSummaries,
  getGroupSelectionState,
  getLeafRows,
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
      {display.map(({ shown, hidden }, i) => {
        if (shown.length === 0 && hidden.length === 0) return null
        return (
          <span key={i} className="inline-flex shrink-0 items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-3.5 shrink-0 opacity-50" />}
            {shown.map((entry, j) => (
              <span key={entry.value} className="inline-flex items-center gap-1">
                {j > 0 && <span className="text-muted-foreground">·</span>}
                <span>{entry.value}</span>
                {entry.count > 1 && (
                  <TooltipProvider delayDuration={1000}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex h-4 items-center justify-center rounded-sm bg-primary/15 px-1 text-[0.7rem] text-muted-foreground">
                          {entry.count}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        {entry.count} aircraft
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </span>
            ))}
            {hidden.length > 0 && (
              <>
                {shown.length > 0 && <span className="text-muted-foreground">·</span>}
                <TooltipProvider delayDuration={1000}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex h-4 cursor-default items-center justify-center rounded-sm border border-border px-1 text-[0.7rem] text-muted-foreground">
                        +{hidden.length}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <div className="flex flex-col gap-0.5">
                        {hidden.map((e) => (
                          <span key={e.value}>{e.value}</span>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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

  const firstCollapsedIndex = breadcrumbLevels.findIndex((l) => collapsedGroupIds.has(l.id))

  return (
    <TableRow className="bg-muted/50">
      <TableCell colSpan={row.getVisibleCells().length} className="max-w-0 font-medium">
        <div className="flex w-full min-w-0 items-center gap-1.5 overflow-hidden">
          {breadcrumbLevels.map((levelRow, index) => {
            const isLastSegment = index === breadcrumbLevels.length - 1
            const isLevelCollapsed = collapsedGroupIds.has(levelRow.id)
            const immediateChildren = levelRow.subRows
            const isGroupOfGroups = immediateChildren.length > 0 && immediateChildren[0].getIsGrouped()
            const childCount = immediateChildren.length
            const leafCount = getLeafRows(levelRow).length

            const isOutermost = index === 0
            const isPastCollapsePoint = firstCollapsedIndex !== -1 && index >= firstCollapsedIndex
            const showCounts = (isOutermost && isLevelCollapsed) || (!isOutermost && (isPastCollapsePoint || isLastSegment)) //Show the count on outermost group if this is collapsed or whichever lower collapsed level

            return (
              <span key={levelRow.id} className="inline-flex items-center gap-1.5">
                <FleetGroupCheckbox
                  checked={getGroupSelectionState(levelRow, rowSelection)}
                  onCheckedChange={() => toggleGroupSelection(levelRow, rowSelection, setRowSelection)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Select ${resolveGroupDisplayValue(levelRow)}`}
                  className="size-3.5"
                />
                <span className="cursor-default">{resolveGroupDisplayValue(levelRow)}</span>
                {showCounts && childCount > 1 && (
                  <TooltipProvider delayDuration={1000}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex h-4 cursor-default items-center justify-center rounded-sm border border-input px-1 text-[0.7rem] text-foreground">
                          {childCount}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        {isGroupOfGroups
                          ? `${childCount} sub-groups`
                          : `${childCount} aircraft`}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {showCounts && isGroupOfGroups && leafCount !== childCount && (
                  <TooltipProvider delayDuration={1000}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex h-4 cursor-default items-center justify-center rounded-sm bg-primary/15 px-1 text-[0.7rem] text-secondary-foreground">
                          {leafCount}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">{leafCount} aircraft total</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
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
              </span>
            )
          })}
          <FoldedLevels levels={foldedLevels} />
        </div>
      </TableCell>
    </TableRow>
  )
}