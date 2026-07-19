"use client"

import {
  ColumnFiltersState,
  OnChangeFn,
  RowSelectionState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { useEffect, useState } from "react"

import { Aircraft, columns } from "@/components/ops/fleet/fleet-columns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FunnelX } from "lucide-react"

const SORTING_STORAGE_KEY = "fleet-sorting"
const FILTERS_STORAGE_KEY = "fleet-filters"

export function FleetTable({
  data,
  onSelectionChange,
  resetKey,
}: {
  data: Aircraft[]
  onSelectionChange: (ids: string[]) => void
  resetKey?: number
}) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [sorting, setSorting] = useState<SortingState | null>(null)
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() => {
    if (typeof window === "undefined") return []
    const saved = localStorage.getItem(FILTERS_STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  })

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
    onSortingChange: handleSortingChange,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    state: { sorting: sorting ?? [], rowSelection, columnFilters },
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
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center text-sm text-muted-foreground">
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
