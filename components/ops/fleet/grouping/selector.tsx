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
import { cn } from "@/lib/utils"
import { columns } from "@/components/ops/fleet/columns"

type GroupableColumn = {
    id: string
    label: string
}

const groupableColumns: GroupableColumn[] = columns
    .filter((col) => col.enableGrouping)
    .map((col) => {
        const id = "id" in col ? col.id! : (col as { accessorKey: string }).accessorKey
        return { id, label: col.meta?.label ?? id }
    })

export function FleetGroupSelector({
    value,
    onChange,
}: {
    value: GroupingState
    onChange: (next: GroupingState) => void
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
                    {visibleItems.map(({ id, label }) => {
                        const position = value.indexOf(id)
                        const isSelected = position !== -1
                        return (
                            <button
                                key={id}
                                className={cn(
                                    "flex w-full items-center gap-1 rounded py-0.5 pr-2 text-left text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
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
                                    <span className="ml-auto text-xs text-muted-foreground">
                                        {position + 1}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </PopoverContent>
        </Popover>
    )
}