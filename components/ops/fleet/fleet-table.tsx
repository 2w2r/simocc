"use client"

import {
  ColumnFiltersState,
  GroupingState,
  OnChangeFn,
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
import { FunnelX } from "lucide-react"
import { columns } from "@/components/ops/fleet/columns"
import { Aircraft } from "@/components/ops/fleet/types"
import { FleetGroupRow } from "@/components/ops/fleet/grouping/group-row"
import { findOutermostCollapsedAncestor } from "@/components/ops/fleet/grouping/utils"

const SORTING_STORAGE_KEY = "fleet-sorting"
const FILTERS_STORAGE_KEY = "fleet-filters"

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
    meta: {
      rawSorting: sorting ?? [],
    },
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

  const dataColumnCount = table.getVisibleLeafColumns().length - 1
  const selectColumnWidth = 48
  const minTableWidth = dataColumnCount * 120 + selectColumnWidth

  return (
    <div className="overflow-hidden rounded-md border">
      <Table className="table-fixed" style={{ minWidth: `${minTableWidth}px` }}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const isSelectColumn = header.column.id === "select"
                const dataColumnWidth = `${100 / dataColumnCount}%`

                return (
                  <TableHead
                    key={header.id}
                    style={
                      isSelectColumn
                        ? { width: "48px" }
                        : { width: dataColumnWidth }
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              if (row.getIsGrouped()) {
                return (
                  <FleetGroupRow
                    key={row.id}
                    row={row}
                    collapsedGroupIds={collapsedGroupIds}
                    onToggleCollapse={toggleGroupCollapse}
                    rowSelection={rowSelection}
                    setRowSelection={setRowSelection}
                  />
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