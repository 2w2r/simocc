"use client"

import Link from "next/link"
import { ColumnDef, HeaderContext } from "@tanstack/react-table"

import { Checkbox } from "@/components/ui/checkbox"


import { Aircraft } from "@/components/ops/fleet/types"
import { sortAllData } from "@/components/ops/fleet/columns/sort"
import {
    uniqueOrdered,
    getRegPrefix,
    formatDateAdded,
    formatUTCDate,
    getSortMeta,
    aircraftAccessors,
    aircraftTypeAccessors,
    compareSerials,
    wakeTurbulenceRank,
    wakeTurbulenceDisplayRank,
    EMPTY_VALUE,
} from "@/components/ops/fleet/columns/utils"
import { ColumnHeader } from "@/components/ops/fleet/columns/header"
import { dateRangeFilter, multiSelectFilter, operatorFilter, regPrefixFilter } from "@/components/ops/fleet/columns/filters"
import { DateGranularities, DateGranularity, DEFAULT_DATE_GRANULARITY, getDateGroupingValue } from "@/components/ops/fleet/grouping/utils"

function createStringColumnHeader(
    label: string,
    accessor: (row: Aircraft) => string,
    options?: {
        operatorAccessor?: (row: Aircraft) => Aircraft["operator"]
        compareValues?: (a: string, b: string) => number
        filterable?: boolean
    }
) {
    const filterable = options?.filterable ?? true
    return ({ column, table }: HeaderContext<Aircraft, unknown>) => {
        if (!filterable) {
            return <ColumnHeader label={label} column={column} {...getSortMeta(column.id, table)} />
        }

        const allData = table.options.data as Aircraft[]
        const sortedData = sortAllData(allData, table.options.meta?.rawSorting ?? [])

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
            : [...new Set(allData.map(accessor))].sort(options?.compareValues)

        const maxLength =
            allValues.length > 0
                ? Math.max(...allValues.map((value) => value.length))
                : undefined

        const { isSorted, sortIndex, sortCount } = getSortMeta(column.id, table)

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
                sortCount={sortCount}
            />
        )
    }
}

function createDateColumnHeader(label: string, accessor: (row: Aircraft) => Date | null) {
    return ({ column, table }: HeaderContext<Aircraft, unknown>) => {
        const allData = table.options.data as Aircraft[]
        const presentDates = allData.map(accessor).filter((date): date is Date => date !== null)
        const { isSorted, sortIndex, sortCount } = getSortMeta(column.id, table)

        return (
            <ColumnHeader
                label={label}
                column={column}
                isSorted={isSorted}
                sortIndex={sortIndex}
                sortCount={sortCount}
                isDateFilter
                presentDates={presentDates}
            />
        )
    }
}

const regPrefixAccessor = (row: Aircraft) => getRegPrefix(row.registration)

function createDateColumn(
    id: string,
    label: string,
    accessor: (row: Aircraft) => Date | null,
    dateGranularity: DateGranularity,
    options: { format: (date: Date) => string; defaultHidden?: boolean }
): ColumnDef<Aircraft> {
    // Missing dates sort after every real date.
    const sortKey = (row: Aircraft) => accessor(row)?.getTime() ?? Number.POSITIVE_INFINITY
    return {
        id,
        accessorFn: accessor,
        getGroupingValue: (row) => getDateGroupingValue(accessor(row), dateGranularity),
        filterFn: dateRangeFilter,
        enableGrouping: true,
        sortingFn: (rowA, rowB) => sortKey(rowA.original) - sortKey(rowB.original),
        meta: { label, isDate: true, defaultHidden: options.defaultHidden },
        header: createDateColumnHeader(label, accessor),
        cell: ({ row }) => {
            const date = accessor(row.original)
            return date ? options.format(date) : EMPTY_VALUE
        },
    }
}

const createdAtAccessor = (row: Aircraft) => new Date(row.createdAt)
const deliveryDateAccessor = (row: Aircraft) => (row.deliveryDate ? new Date(row.deliveryDate) : null)

export function buildColumns(dateGranularities: DateGranularities = {}): ColumnDef<Aircraft>[] {
    const granularityOf = (id: string) => dateGranularities[id] ?? DEFAULT_DATE_GRANULARITY
    return [
        {
            accessorKey: "registration",
            filterFn: regPrefixFilter,
            sortingFn: "text",
            enableHiding: false,
            meta: { label: "Registration" },
            header: createStringColumnHeader("Registration", (row) => getRegPrefix(row.registration)),
            cell: ({ row }) => (
                <Link href={`/fleet/${row.original.id}`} className="hover:underline underline-offset-4">
                    {row.original.registration}
                </Link>
            ),
        },
        {
            id: "regPrefix",
            accessorFn: regPrefixAccessor,
            enableGrouping: true,
            sortingFn: "text",
            meta: { groupingOnly: true, derivedFrom: "registration", label: "Registration Prefix" },
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
            id: "aircraftTypeIcaoCode",
            accessorFn: (row) => row.aircraftType.icaoCode,
            filterFn: multiSelectFilter,
            enableGrouping: true,
            sortingFn: "text",
            meta: { label: "ICAO Type" },
            header: createStringColumnHeader("ICAO Type", (row) => row.aircraftType.icaoCode),
        },
        {
            id: "manufacturer",
            accessorFn: aircraftTypeAccessors.manufacturer,
            filterFn: multiSelectFilter,
            enableGrouping: true,
            sortingFn: "text",
            meta: { defaultHidden: true, label: "Manufacturer" },
            header: createStringColumnHeader("Manufacturer", aircraftTypeAccessors.manufacturer),
        },
        //Aircraft model column omitted due unfriendly naming e.g. A-350-900 XWB instead of common A350-900
        //Consider as hidden column on implementation of aircraft type name e.g. A350-941 if required for e.g. grouping
        {
            id: "aircraftCategory",
            accessorFn: aircraftTypeAccessors.aircraftCategory,
            filterFn: multiSelectFilter,
            enableGrouping: true,
            sortingFn: "text",
            meta: { defaultHidden: true, label: "Aircraft Category" },
            header: createStringColumnHeader("Aircraft Category", aircraftTypeAccessors.aircraftCategory),
        },
        {
            id: "engineCategory",
            accessorFn: aircraftTypeAccessors.engineCategory,
            filterFn: multiSelectFilter,
            enableGrouping: true,
            sortingFn: "text",
            meta: { defaultHidden: true, label: "Engine Category" },
            header: createStringColumnHeader("Engine Category", aircraftTypeAccessors.engineCategory),
        },
        {
            id: "engineCount",
            accessorFn: aircraftTypeAccessors.engineCount,
            filterFn: multiSelectFilter,
            enableGrouping: true,
            sortingFn: "text",
            meta: { defaultHidden: true, label: "Engine Count" },
            header: createStringColumnHeader("Engine Count", aircraftTypeAccessors.engineCount),
        },
        {
            id: "wakeTurbulenceCategory",
            accessorFn: aircraftTypeAccessors.wakeTurbulenceCategory,
            filterFn: multiSelectFilter,
            enableGrouping: true,
            sortingFn: (rowA, rowB) =>
                wakeTurbulenceRank(rowA.original.aircraftType.wakeTurbulenceCategory) -
                wakeTurbulenceRank(rowB.original.aircraftType.wakeTurbulenceCategory),
            meta: { defaultHidden: true, label: "WTC" },
            header: createStringColumnHeader("WTC", aircraftTypeAccessors.wakeTurbulenceCategory, {
                compareValues: (a, b) => wakeTurbulenceDisplayRank(a) - wakeTurbulenceDisplayRank(b),
            }),
        },
        {
            id: "msn",
            accessorFn: aircraftAccessors.msn,
            sortingFn: (rowA, rowB) =>
                compareSerials(aircraftAccessors.msn(rowA.original), aircraftAccessors.msn(rowB.original)),
            meta: { defaultHidden: true, label: "MSN" },
            header: createStringColumnHeader("MSN", aircraftAccessors.msn, { filterable: false }),
        },
        {
            id: "lineNumber",
            accessorFn: aircraftAccessors.lineNumber,
            sortingFn: (rowA, rowB) =>
                compareSerials(aircraftAccessors.lineNumber(rowA.original), aircraftAccessors.lineNumber(rowB.original)),
            meta: { defaultHidden: true, label: "Line Number" },
            header: createStringColumnHeader("Line Number", aircraftAccessors.lineNumber, { filterable: false }),
        },
        createDateColumn("deliveryDate", "Delivery Date", deliveryDateAccessor, granularityOf("deliveryDate"), {
            format: formatUTCDate,
            defaultHidden: true,
        }),
        {
            id: "status",
            accessorFn: aircraftAccessors.status,
            filterFn: multiSelectFilter,
            enableGrouping: true,
            sortingFn: "text",
            meta: { defaultHidden: true, label: "Status" },
            header: createStringColumnHeader("Status", aircraftAccessors.status),
        },
        createDateColumn("createdAt", "Added", createdAtAccessor, granularityOf("createdAt"), {
            format: formatDateAdded,
        }),
        {
            id: "select",
            size: 0,
            enableHiding: false,
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
}