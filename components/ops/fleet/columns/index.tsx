"use client"

import { ColumnDef, HeaderContext } from "@tanstack/react-table"

import { Checkbox } from "@/components/ui/checkbox"


import { Aircraft } from "@/components/ops/fleet/types"
import { sortAllData } from "@/components/ops/fleet/columns/sort"
import { uniqueOrdered, getRegPrefix } from "@/components/ops/fleet/columns/utils"
import { ColumnHeader } from "@/components/ops/fleet/columns/header"
import { multiSelectFilter, operatorFilter, regPrefixFilter } from "@/components/ops/fleet/columns/filters"

function createStringColumnHeader(
    label: string,
    accessor: (row: Aircraft) => string,
    options?: {
        operatorAccessor?: (row: Aircraft) => Aircraft["operator"]
    }
) {
    return ({ column, table }: HeaderContext<Aircraft, unknown>) => {
        const allData = table.options.data as Aircraft[]
        const sortedData = sortAllData(allData, table.getState().sorting)

        const operatorAccessor = options?.operatorAccessor

        const operatorDisplayKey = (operator: Aircraft["operator"]) =>
            operator.icaoCode ?? operator.iataCode ?? operator.name

        const displayOperators = operatorAccessor
            ? uniqueOrdered(sortedData.map(operatorAccessor), operatorDisplayKey)
            : undefined

        const displayValues = operatorAccessor
            ? displayOperators!.map(operatorDisplayKey)
            : uniqueOrdered(sortedData.map(accessor), (v) => v)

        const allValues = operatorAccessor
            ? [...new Set(allData.map((row) => operatorDisplayKey(operatorAccessor(row))))].sort()
            : [...new Set(allData.map(accessor))].sort()

        const maxLength =
            allValues.length > 0
                ? Math.max(...allValues.map((value) => value.length))
                : undefined

        const rawSorting = table.options.meta?.rawSorting ?? []
        const ownSort = rawSorting.find((s) => s.id === column.id)
        const isSorted: false | "asc" | "desc" = ownSort
            ? ownSort.desc
                ? "desc"
                : "asc"
            : false
        const sortIndex = rawSorting.findIndex((s) => s.id === column.id)

        return (
            <ColumnHeader
                label={label}
                column={column}
                options={allValues}
                sortedOptions={displayValues}
                operatorOptions={displayOperators}
                maxLength={maxLength}
                isSorted={isSorted}
                sortIndex={sortIndex}
                sortCount={rawSorting.length}
            />
        )
    }
}

const regPrefixAccessor = (row: Aircraft) => getRegPrefix(row.registration)

export const columns: ColumnDef<Aircraft>[] = [
    {
        accessorKey: "registration",
        filterFn: regPrefixFilter,
        sortingFn: "text",
        meta: { label: "Registration" },
        header: createStringColumnHeader("Registration", (row) => getRegPrefix(row.registration)),
    },
    {
        id: "regPrefix",
        accessorFn: regPrefixAccessor,
        enableGrouping: true,
        sortingFn: "text",
        meta: { groupingOnly: true, label: "Registration Prefix" },
    },
    {
        accessorKey: "icaoCode",
        filterFn: multiSelectFilter,
        enableGrouping: true,
        sortingFn: "text",
        meta: { label: "Type" },
        header: createStringColumnHeader("Type", (row) => row.icaoCode),
    },
    {
        id: "operator",
        accessorFn: (row) =>
            row.operator.icaoCode ?? row.operator.iataCode ?? "\uFFFF",
        getGroupingValue: (row) => row.operator.id,
        filterFn: operatorFilter,
        enableGrouping: true,
        sortingFn: "text",
        meta: { label: "Operator" },
        header: createStringColumnHeader(
            "Operator",
            (row) => row.operator.icaoCode ?? row.operator.iataCode ?? "\uFFFF",
            { operatorAccessor: (row) => row.operator }
        ),
        cell: ({ row }) => {
            const operator = row.original.operator
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
        id: "createdAt",
        accessorFn: (row) => new Date(row.createdAt).toLocaleDateString(),
        filterFn: multiSelectFilter,
        sortingFn: (rowA, rowB) => {
            return new Date(rowA.original.createdAt).getTime() - new Date(rowB.original.createdAt).getTime()
        },
        meta: { label: "Date Added" },
        header: createStringColumnHeader("Date Added", (row) =>
            new Date(row.createdAt).toLocaleDateString()
        ),
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
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