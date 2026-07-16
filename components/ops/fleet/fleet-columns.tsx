"use client"

import { ColumnDef } from "@tanstack/react-table"

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

export type Aircraft = {
  id: string
  registration: string
  icaoCode: string
  operator: {
    name: string
    icaoCode: string | null
    iataCode: string | null
  } | null
}

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ArrowDown className="size-3.5" />
  if (sorted === "desc") return <ArrowUp className="size-3.5" />
  return <ArrowUpDown className="size-3.5 opacity-40" />
}

function ColumnHeader({
  label,
  column,
}: {
  label: string
  column: {
    toggleSorting: (asc: boolean) => void
    getIsSorted: () => false | "asc" | "desc"
    clearSorting: () => void
  }
}) {
  const sorted = column.getIsSorted()

  return (
    <div className="flex items-center gap-0.5">
      <span className="text-sm font-medium">{label}</span>
      <Button
        variant="ghost"
        size="icon"
        className={cn("size-7", sorted && "text-primary")}
        onClick={() => {
          if (!sorted) {
            column.toggleSorting(false)
          } else if (sorted === "asc") {
            column.toggleSorting(true)
          } else {
            column.clearSorting()
          }
        }}
      >
        <SortIcon sorted={sorted} />
      </Button>
    </div>
  )
}

export const columns: ColumnDef<Aircraft>[] = [
  {
    accessorKey: "registration",
    header: ({ column }) => (
      <ColumnHeader label="Registration" column={column} />
    ),
  },
  {
    accessorKey: "icaoCode",
    header: ({ column }) => <ColumnHeader label="Type" column={column} />,
  },
  {
    id: "operator",
    accessorFn: (row) => row.operator?.icaoCode ?? "zzz",
    header: ({ column }) => <ColumnHeader label="Operator" column={column} />,
    cell: ({ row }) => {
      const operator = row.original.operator
      if (!operator) return <span className="text-muted-foreground">—</span>
      const icao = operator.icaoCode ?? "—"
      const iata = operator.iataCode ?? "—"
      return (
        <span>
          {icao}/{iata}
        </span>
      )
    },
  },
  {
    id: "select",
    size: 0,
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="ml-auto mr-3"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="ml-auto mr-3"
      />
    ),
    enableSorting: false,
  },
]
