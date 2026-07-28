"use client"

import { ArrowBigUp, ArrowDown, ArrowUp, ArrowUpDown, MouseLeft } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { FleetColumnFilterPopover } from "@/components/ops/fleet/fleet-column-filter-popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Kbd, KbdGroup } from "@/components/ui/kbd"

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
    isSorted,
    sortIndex,
    sortCount,
}: {
    label: string
    column: {
        toggleSorting: (asc: boolean, isMulti?: boolean) => void
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
    isSorted: false | "asc" | "desc"
    sortIndex?: number
    sortCount?: number
}) {
    const showSortBadge =
        isSorted &&
        sortCount !== undefined &&
        sortCount > 1 &&
        sortIndex !== undefined &&
        sortIndex !== -1

    return (
        <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium">{label}</span>
            {!!options?.length && (
                <>
                    <TooltipProvider delayDuration={1000}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn("size-7 -mr-1.5 relative", isSorted && "text-primary")}
                                    onClick={(e) => {
                                        const isMulti = e.shiftKey
                                        if (!isSorted) {
                                            column.toggleSorting(false, isMulti)
                                        } else if (isSorted === "asc") {
                                            column.toggleSorting(true, isMulti)
                                        } else {
                                            column.clearSorting()
                                        }
                                    }}
                                >
                                    <SortIcon sorted={isSorted} />
                                    {showSortBadge && (
                                        <span className="absolute -top-0.5 -right-0.5 flex size-3 items-center justify-center rounded-full bg-primary text-[9px] font-medium text-primary-foreground">
                                            {sortIndex + 1}
                                        </span>
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent
                                className="flex items-center gap-1.5"
                                side="bottom"
                                align="start"
                            >
                                <span className="-ml-1">Multi-sort</span>
                                <KbdGroup>
                                    <Kbd><ArrowBigUp /> + <MouseLeft /></Kbd>
                                </KbdGroup>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
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