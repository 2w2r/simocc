import "@tanstack/react-table"
import type { SortingState } from "@tanstack/react-table"

declare module "@tanstack/react-table" {
    interface ColumnMeta<TData, TValue> {
        groupingOnly?: boolean
        derivedFrom?: string
        label?: string
    }
    interface TableMeta<TData> {
        rawSorting?: SortingState
    }
}