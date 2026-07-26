"use client"

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"

import { FleetColumnFilterPopover } from "@/components/ops/fleet/fleet-column-filter-popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
    if (sorted === "asc") return <ArrowDown className="size-3.5" />
    if (sorted === "desc") return <ArrowUp className="size-3.5" />
    return <ArrowUpDown className="size-3.5 opacity-40" />
}

export function ColumnHeader({
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
            {!!options?.length && (
                <>
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
                </>
            )}
        </div>
    )
}