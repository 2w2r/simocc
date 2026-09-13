"use client"

import { useMemo, useState } from "react"

import { ListX } from "lucide-react"
import { SortingState, VisibilityState } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { buildColumns } from "@/components/ops/fleet/columns"
import { SortIcon } from "@/components/ops/fleet/columns/header"

type SortableColumn = {
  id: string
  label: string
}

const sortableColumns: SortableColumn[] = buildColumns()
  .filter((column) => column.enableSorting !== false && !column.meta?.groupingOnly)
  .map((column) => {
    const id = "id" in column ? column.id! : (column as { accessorKey: string }).accessorKey
    return { id, label: column.meta?.label ?? id }
  })

export function FleetDefaultSortPopover({
  value,
  onChange,
  columnVisibility,
}: {
  value: SortingState
  onChange: (next: SortingState) => void
  columnVisibility: VisibilityState
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const defaultSort = value[0]
  const hasDefaultSort = defaultSort !== undefined

  const visibleItems = useMemo(() => {
    // A default sort on a hidden column would have no header to change it from.
    const availableColumns = sortableColumns.filter(
      ({ id }) => columnVisibility[id] !== false
    )
    if (!search.trim()) return availableColumns
    const normalizedQuery = search.toLowerCase()
    return availableColumns.filter(({ label }) =>
      label.toLowerCase().includes(normalizedQuery)
    )
  }, [search, columnVisibility])

  function clearDefaultSort() {
    onChange([])
  }

  function toggleColumn(id: string) {
    if (defaultSort?.id === id) {
      onChange([{ id, desc: !defaultSort.desc }])
      return
    }
    onChange([{ id, desc: false }])
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
          className={cn("size-7", hasDefaultSort && "text-primary")}
        >
          <SortIcon sorted={hasDefaultSort ? (defaultSort.desc ? "desc" : "asc") : false} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit min-w-0 p-1" align="start">
        <div className="flex items-center gap-2 px-2 pt-1 pb-0.5">
          <ListX
            className={cn(
              "size-3.5 shrink-0 cursor-pointer transition-colors",
              hasDefaultSort
                ? "text-destructive"
                : "text-muted-foreground opacity-40"
            )}
            onClick={() => {
              clearDefaultSort()
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
            const isSelected = defaultSort?.id === id
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
                  <SortIcon
                    sorted={isSelected ? (defaultSort.desc ? "desc" : "asc") : false}
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
