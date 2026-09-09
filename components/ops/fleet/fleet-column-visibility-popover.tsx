"use client"

import { useMemo, useState } from "react"

import { Check, Columns3, Eye, EyeOff, RotateCcw } from "lucide-react"
import { VisibilityState } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { buildColumns } from "@/components/ops/fleet/columns"

type HideableColumn = {
  id: string
  label: string
}

const hideableColumns: HideableColumn[] = buildColumns("day")
  .filter((column) => column.enableHiding !== false && !column.meta?.groupingOnly)
  .map((column) => {
    const id = "id" in column ? column.id! : (column as { accessorKey: string }).accessorKey
    return { id, label: column.meta?.label ?? id }
  })

export function FleetColumnVisibilityPopover({
  value,
  onChange,
}: {
  value: VisibilityState
  onChange: (next: VisibilityState) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const hasHiddenColumns = hideableColumns.some(({ id }) => value[id] === false)

  const visibleItems = useMemo(() => {
    if (!search.trim()) return hideableColumns
    const normalizedQuery = search.toLowerCase()
    return hideableColumns.filter(({ label }) =>
      label.toLowerCase().includes(normalizedQuery)
    )
  }, [search])

  function showAllColumns() {
    const next = { ...value }
    for (const { id } of hideableColumns) delete next[id]
    onChange(next)
  }

  function toggleColumn(id: string) {
    onChange({ ...value, [id]: value[id] === false })
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
          className={cn("size-7", hasHiddenColumns && "text-primary")}
        >
          <Columns3 className={cn("size-3.5", !hasHiddenColumns && "opacity-40")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit min-w-0 p-1" align="start">
        <div className="flex items-center gap-2 px-2 pt-1 pb-0.5">
          <Eye
            className={cn(
              "size-3.5 shrink-0 cursor-pointer transition-colors",
              hasHiddenColumns
                ? "text-primary"
                : "text-muted-foreground opacity-40"
            )}
            onClick={() => {
              showAllColumns()
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
            const isVisible = value[id] !== false
            return (
              <button
                key={id}
                className={cn(
                  "flex w-full items-center gap-1 rounded py-0.5 pr-2 text-left text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                  isVisible && "font-medium"
                )}
                onClick={() => toggleColumn(id)}
              >
                <span className="flex size-7 shrink-0 items-center justify-center">
                  <Check
                    className={cn(
                      "size-3.5",
                      isVisible ? "opacity-100" : "opacity-0"
                    )}
                  />
                </span>
                <span className="shrink-0">{label}</span>
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
