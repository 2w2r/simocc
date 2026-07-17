"use client"

import { ColumnDef, HeaderContext } from "@tanstack/react-table"

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"

import { FleetColumnFilterPopover } from "@/components/ops/fleet/fleet-column-filter-popover"
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
  options,
  sortedOptions,
  maxLength,
  operatorOptions,
}: {
  label: string
  column: {
    toggleSorting: (asc: boolean) => void
    getIsSorted: () => false | "asc" | "desc"
    clearSorting: () => void
    getFilterValue: () => unknown
    setFilterValue: (value: unknown) => void
  }
  options?: string[]
  sortedOptions?: string[]
  maxLength?: number
  operatorOptions?: {
    icaoCode: string | null
    iataCode: string | null
    name: string
  }[]
}) {
  const isSorted = column.getIsSorted()

  return (
    <div className="flex items-center gap-1">
      <span className="text-sm font-medium">{label}</span>
      <Button
        variant="ghost"
        size="icon"
        className={cn("size-7 -mr-2", isSorted && "text-primary")}
        onClick={() => {
          if (!isSorted) {
            column.toggleSorting(false)
          } else if (isSorted === "asc") {
            column.toggleSorting(true)
          } else {
            column.clearSorting()
          }
        }}
      >
        <SortIcon sorted={isSorted} />
      </Button>
      <FleetColumnFilterPopover
        column={column}
        options={options}
        sortedOptions={sortedOptions}
        maxLength={maxLength}
        operatorOptions={operatorOptions}
      />
    </div>
  )
}

const multiSelectFilter = (
  row: { getValue: (id: string) => unknown },
  columnId: string,
  filterValues: string[]
) => {
  if (!filterValues?.length) return true
  return filterValues.includes(row.getValue(columnId) as string)
}

function sortAllData(
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
      aKey = a.operator?.icaoCode ?? a.operator?.iataCode ?? "\uFFFF"
      bKey = b.operator?.icaoCode ?? b.operator?.iataCode ?? "\uFFFF"
    }
    return activeSort.desc ? bKey.localeCompare(aKey) : aKey.localeCompare(bKey)
  })
}

function createStringColumnHeader(
  label: string,
  accessor: (row: Aircraft) => string
) {
  return ({ column, table }: HeaderContext<Aircraft, unknown>) => {
    const allData = table.options.data as Aircraft[]
    const sortedData = sortAllData(allData, table.getState().sorting)

    const seen = new Set<string>()
    const displayValues = sortedData.map(accessor).filter((value) => {
      if (seen.has(value)) return false
      seen.add(value)
      return true
    })

    const allValues = [...new Set(allData.map(accessor))].sort()
    const maxLength =
      allValues.length > 0
        ? Math.max(...allValues.map((value) => value.length))
        : undefined

    return (
      <ColumnHeader
        label={label}
        column={column}
        options={allValues}
        sortedOptions={displayValues}
        maxLength={maxLength}
      />
    )
  }
}

export const columns: ColumnDef<Aircraft>[] = [
  {
    accessorKey: "registration",
    filterFn: multiSelectFilter,
    header: createStringColumnHeader("Registration", (row) => row.registration),
  },
  {
    accessorKey: "icaoCode",
    filterFn: multiSelectFilter,
    header: createStringColumnHeader("Type", (row) => row.icaoCode),
  },
  {
    id: "operator",
    accessorFn: (row) =>
      row.operator?.icaoCode ?? row.operator?.iataCode ?? "\uFFFF",
    filterFn: multiSelectFilter,
    header: ({ column, table }) => {
      const allData = table.options.data as Aircraft[]
      const sortedData = sortAllData(allData, table.getState().sorting)

      const seen = new Set<string>()
      const displayOperators = sortedData
        .map((row) => row.operator)
        .filter(
          (operator): operator is NonNullable<typeof operator> =>
            operator !== null
        )
        .filter((operator) => {
          const key = operator.icaoCode ?? operator.iataCode ?? operator.name
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })

      const allValues = displayOperators.map(
        (operator) => operator.icaoCode ?? operator.iataCode ?? operator.name
      )

      const maxLength =
        displayOperators.length > 0
          ? Math.max(
              ...displayOperators.map(
                (operator) =>
                  `${operator.icaoCode ?? "—"}/${operator.iataCode ?? "—"}`
                    .length
              )
            )
          : undefined

      return (
        <ColumnHeader
          label="Operator"
          column={column}
          options={allValues}
          sortedOptions={allValues}
          operatorOptions={displayOperators}
          maxLength={maxLength}
        />
      )
    },
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
