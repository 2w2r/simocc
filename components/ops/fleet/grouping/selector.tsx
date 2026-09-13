"use client"

import { useMemo, useState } from "react"

import { Check, Folders, FolderX } from "lucide-react"
import { GroupingState } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { buildColumns } from "@/components/ops/fleet/columns"
import { DateGranularities, DateGranularity, DEFAULT_DATE_GRANULARITY } from "@/components/ops/fleet/grouping/utils"

type GroupableColumn = {
    id: string
    label: string
    isDate: boolean
}

const groupableColumns: GroupableColumn[] = buildColumns()
    .filter((col) => col.enableGrouping)
    .map((col) => {
        const id = "id" in col ? col.id! : (col as { accessorKey: string }).accessorKey
        return { id, label: col.meta?.label ?? id, isDate: !!col.meta?.isDate }
    })

export function FleetGroupSelector({
    value,
    onChange,
    dateGranularities,
    onDateGranularityChange,
}: {
    value: GroupingState
    onChange: (next: GroupingState) => void
    dateGranularities: DateGranularities
    onDateGranularityChange: (columnId: string, next: DateGranularity) => void
}) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")

    const isGrouped = value.length > 0

    const visibleItems = useMemo(() => {
        if (!search.trim()) return groupableColumns
        const normalizedQuery = search.toLowerCase()
        return groupableColumns.filter(({ label }) =>
            label.toLowerCase().includes(normalizedQuery)
        )
    }, [search])

    function clearGrouping() {
        onChange([])
    }

    function toggleColumn(id: string) {
        const next = value.includes(id)
            ? value.filter((grouped) => grouped !== id)
            : [...value, id]
        onChange(next)
    }

    function handleGranularityChange(next: DateGranularity, columnId: string) {
        onDateGranularityChange(columnId, next)
        if (!value.includes(columnId)) {
            onChange([...value, columnId])
        }
    }
    return (
        <Popover
            open={open}
            onOpenChange={(open) => {
                setOpen(open)
                if (!open) setSearch("")
            }}
        >
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("size-7", isGrouped && "text-primary")}
                >
                    <Folders className={cn("size-3.5", !isGrouped && "opacity-40")} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-fit min-w-0 p-1" align="start">
                <div className="flex items-center gap-2 px-2 pt-1 pb-0.5">
                    <FolderX
                        className={cn(
                            "size-3.5 shrink-0 cursor-pointer transition-colors",
                            isGrouped
                                ? "text-destructive"
                                : "text-muted-foreground opacity-40"
                        )}
                        onClick={() => {
                            clearGrouping()
                            setOpen(false)
                        }}
                    />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-7 min-w-0 text-xs"
                        autoFocus
                    />
                </div>
                <div className="max-h-40 overflow-y-auto">
                    {visibleItems.map(({ id, label, isDate }) => {
                        const position = value.indexOf(id)
                        const isSelected = position !== -1
                        return (
                            <div
                                key={id}
                                className="flex w-full items-center gap-1 rounded py-0.5 pr-2 hover:bg-accent"
                            >
                                <button
                                    className={cn(
                                        "flex flex-1 items-center gap-1 text-left text-sm focus-visible:outline-none",
                                        isSelected && "font-medium"
                                    )}
                                    onClick={() => toggleColumn(id)}
                                >
                                    <span className="flex size-7 shrink-0 items-center justify-center">
                                        <Check
                                            className={cn(
                                                "size-3.5",
                                                isSelected ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                    </span>
                                    <span className="shrink-0">{label}</span>
                                    {isSelected && value.length > 1 && (
                                        <span className="text-xs text-muted-foreground">
                                            {position + 1}
                                        </span>
                                    )}
                                </button>
                                {isDate && (
                                    <ToggleGroup
                                        type="single"
                                        value={dateGranularities[id] ?? DEFAULT_DATE_GRANULARITY}
                                        onValueChange={(next) => {
                                            if (next) handleGranularityChange(next as DateGranularity, id)
                                        }}
                                        className="ml-auto h-5 gap-0 rounded-full border border-border bg-muted p-0.5"
                                    >
                                        {(["year", "month", "day"] as const).map((g) => (
                                            <ToggleGroupItem
                                                key={g}
                                                value={g}
                                                className="h-4 w-4 rounded-full p-0 text-[9px] data-[state=on]:!bg-primary data-[state=on]:!text-primary-foreground"
                                            >
                                                {g[0].toUpperCase()}
                                            </ToggleGroupItem>
                                        ))}
                                    </ToggleGroup>
                                )}
                            </div>
                        )
                    })}
                </div>
            </PopoverContent>
        </Popover>
    )
}