"use client"

import { ColumnDef, HeaderContext } from "@tanstack/react-table"

import { Checkbox } from "@/components/ui/checkbox"


import { Aircraft } from "@/components/ops/fleet/types"
import { sortAllData } from "@/components/ops/fleet/columns/sort"
import { uniqueOrdered } from "@/components/ops/fleet/columns/utils"
import { ColumnHeader } from "@/components/ops/fleet/columns/header"
import { multiSelectFilter, operatorFilter } from "@/components/ops/fleet/columns/filters"

function createStringColumnHeader(
    label: string,
    accessor: (row: Aircraft) => string
) {
    return ({ column, table }: HeaderContext<Aircraft, unknown>) => {
        const allData = table.options.data as Aircraft[]
        const sortedData = sortAllData(allData, table.getState().sorting)

        const displayValues = uniqueOrdered(sortedData.map(accessor), (v) => v)

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
        filterFn: operatorFilter,
        header: ({ column, table }) => {
            const allData = table.options.data as Aircraft[]
            const sortedData = sortAllData(allData, table.getState().sorting)

            const displayOperators = uniqueOrdered(
                sortedData
                    .map((row) => row.operator)
                    .filter(
                        (operator): operator is NonNullable<typeof operator> =>
                            operator !== null
                    ),
                (operator) => operator.icaoCode ?? operator.iataCode ?? operator.name
            )

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