"use client"

import {
  ColumnFiltersState,
  GroupingState,
  OnChangeFn,
  Row,
  RowSelectionState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { useEffect, useState } from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronDown, ChevronRight, FunnelX } from "lucide-react"
import { columns } from "@/components/ops/fleet/columns"
import { Aircraft } from "@/components/ops/fleet/types"
import { FleetGroupCheckbox } from "@/components/ops/fleet/grouping/checkbox"
import { Button } from "@/components/ui/button"

const SORTING_STORAGE_KEY = "fleet-sorting"
const FILTERS_STORAGE_KEY = "fleet-filters"

function getLeafRows<T>(row: Row<T>): Row<T>[] {
  if (!row.subRows || row.subRows.length === 0) return [row]
  return row.subRows.flatMap(getLeafRows)
}

function getGroupSelectionState<T>(
  row: Row<T>,
  rowSelection: RowSelectionState
): boolean | "indeterminate" {
  const leaves = getLeafRows(row)
  const selectedCount = leaves.filter((leaf) => rowSelection[leaf.id]).length
  if (selectedCount === 0) return false
  if (selectedCount === leaves.length) return true
  return "indeterminate"
}

function toggleGroupSelection<T>(
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

function findOutermostCollapsedAncestor<T>(
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

function getGroupedLevelSummaries<T>(
  row: Row<T>,
  resolveDisplayValue: (r: Row<T>) => string
): { value: string; count: number }[][] {
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

function resolveGroupDisplayValue<T extends { operator: { icaoCode: string | null; iataCode: string | null; name: string } }>(
  row: Row<T>
): string {
  if (row.groupingColumnId === "operator") {
    const operator = row.subRows[0]?.original.operator
    if (!operator) return String(row.groupingValue)
    return `${operator.icaoCode ?? "—"}/${operator.iataCode ?? "—"}`
  }
  return String(row.groupingValue)
}

export function FleetTable({
  data,
  onSelectionChange,
  resetKey,
  grouping,
}: {
  data: Aircraft[]
  onSelectionChange: (ids: string[]) => void
  resetKey?: number
  grouping: GroupingState
}) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [sorting, setSorting] = useState<SortingState | null>(null)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() => {
    if (typeof window === "undefined") return []
    const saved = localStorage.getItem(FILTERS_STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  })
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<string>>(new Set())

  function toggleGroupCollapse(rowId: string) {
    setCollapsedGroupIds((prev) => {
      const next = new Set(prev)
      if (next.has(rowId)) next.delete(rowId)
      else next.add(rowId)
      return next
    })
  }

  useEffect(() => {
    const saved = localStorage.getItem(SORTING_STORAGE_KEY)
    setSorting(saved ? JSON.parse(saved) : [])
  }, [])

  useEffect(() => {
    if (sorting !== null) {
      localStorage.setItem(SORTING_STORAGE_KEY, JSON.stringify(sorting))
    }
  }, [sorting])

  useEffect(() => {
    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(columnFilters))
  }, [columnFilters])

  useEffect(() => {
    setRowSelection({})
  }, [resetKey])

  const handleSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
    setSorting((previousSorting) => {
      const current = previousSorting ?? []
      return typeof updaterOrValue === "function"
        ? updaterOrValue(current)
        : updaterOrValue
    })
  }

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    groupedColumnMode: false,
    onSortingChange: handleSortingChange,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting: sorting ?? [],
      rowSelection,
      columnFilters,
      grouping,
      expanded: true,
    },
    initialState: {
      columnVisibility: {
        regPrefix: false,
      },
    },
  })

  useEffect(() => {
    const ids = table.getSelectedRowModel().rows.map((row) => row.original.id)
    onSelectionChange(ids)
  }, [rowSelection])

  if (sorting === null) return null

  return (
    <div className="overflow-hidden rounded-md border">
      <Table className="table-fixed">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={{ width: `${header.getSize()}px` }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              if (row.getIsGrouped()) {
                const nearestCollapsed = findOutermostCollapsedAncestor(row, collapsedGroupIds)

                if (nearestCollapsed && nearestCollapsed.id !== row.id) return null

                const isRepresentative = !!nearestCollapsed
                if (!isRepresentative) {
                  const isInnermostGroup = !row.subRows[0]?.getIsGrouped()
                  if (!isInnermostGroup) return null
                }

                const breadcrumbLevels: (typeof row)[] = []
                let current: typeof row | undefined = row
                while (current && current.getIsGrouped()) {
                  breadcrumbLevels.unshift(current)
                  current = current.getParentRow()
                }

                const foldedLevels = isRepresentative
                  ? getGroupedLevelSummaries(row, resolveGroupDisplayValue)
                  : []

                return (
                  <TableRow key={row.id} className="bg-muted/50">
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
                                  toggleGroupCollapse(levelRow.id)
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

              if (findOutermostCollapsedAncestor(row, collapsedGroupIds)) return null

              return (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => {
                    if (cell.getIsGrouped() || cell.getIsAggregated()) {
                      return <TableCell key={cell.id} />
                    }
                    return (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell colSpan={table.getVisibleLeafColumns().length} className="text-center text-sm text-muted-foreground">
                {columnFilters.length > 0 ? (
                  <span className="inline-flex items-center gap-2">
                    No aircraft match the active filters.
                    <button
                      className="inline-flex items-center gap-1 text-destructive hover:opacity-80"
                      onClick={() => setColumnFilters([])}
                    >
                      <FunnelX className="size-3.5" />
                      Clear filters
                    </button>
                  </span>
                ) : (
                  "No aircraft in fleet."
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}