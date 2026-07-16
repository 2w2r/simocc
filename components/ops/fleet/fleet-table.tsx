"use client"

import {
  OnChangeFn,
  RowSelectionState,
  SortingState,
  flexRender,
  getCoreRowModel,
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

  const handleSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
    setSorting((prev) => {
      const prevSorting = prev ?? []
      return typeof updaterOrValue === "function"
        ? updaterOrValue(prevSorting)
        : updaterOrValue
    })
  }
  useEffect(() => {
    const saved = localStorage.getItem("fleet-sorting")
    setSorting(saved ? JSON.parse(saved) : [])
  }, [])

  useEffect(() => {
    if (sorting !== null) {
      localStorage.setItem("fleet-sorting", JSON.stringify(sorting))
    }
  }, [sorting])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: handleSortingChange,
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    state: { sorting: sorting ?? [], rowSelection },
  })

  useEffect(() => {
    setRowSelection({})
  }, [resetKey])

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
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No aircraft in fleet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
