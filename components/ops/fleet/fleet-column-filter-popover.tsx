"use client"

import { useMemo, useState } from "react"

import { Check, Funnel, FunnelX } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type OperatorEntry = {
  icaoCode: string | null
  iataCode: string | null
  name: string
}

type FilterItem = {
  value: string
  label: React.ReactNode
  searchTerms: string[]
}

function formatItems(entries: string[] | OperatorEntry[]): FilterItem[] {
  if (entries.length === 0) return []
  if (typeof entries[0] === "string") {
    return (entries as string[]).map((entry) => ({
      value: entry,
      label: <span className="shrink-0">{entry}</span>,
      searchTerms: [entry],
    }))
  }
  return (entries as OperatorEntry[]).map((entry) => ({
    value: entry.icaoCode ?? entry.iataCode ?? entry.name,
    label: (
      <span className="shrink-0">
        {`${entry.icaoCode ?? "—"}/${entry.iataCode ?? "—"}`}
      </span>
    ),
    searchTerms: [
      entry.icaoCode,
      entry.iataCode,
      entry.icaoCode && entry.iataCode
        ? `${entry.icaoCode}/${entry.iataCode}`
        : null,
    ].filter(Boolean) as string[],
  }))
}

export function FleetColumnFilterPopover({
  column,
  options,
  sortedOptions,
  maxLength,
  operatorOptions,
}: {
  column: {
    getFilterValue: () => unknown
    setFilterValue: (value: unknown) => void
  }
  options?: string[]
  sortedOptions?: string[]
  maxLength?: number
  operatorOptions?: OperatorEntry[]
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const selectedValues = (column.getFilterValue() as string[] | undefined) ?? []
  const isFiltered = selectedValues.length > 0

  const baseOptions: string[] | OperatorEntry[] =
    operatorOptions ?? sortedOptions ?? options ?? []

  const formattedItems = useMemo(() => formatItems(baseOptions), [baseOptions])

  const visibleItems = useMemo(() => {
    if (!search.trim()) return formattedItems
    const normalizedQuery = search.toLowerCase()
    return formattedItems.filter(({ searchTerms }) =>
      searchTerms.some((term) => term.toLowerCase().includes(normalizedQuery))
    )
  }, [formattedItems, search])

  function clearFilter() {
    column.setFilterValue(undefined)
  }

  function toggleOption(value: string) {
    const next = selectedValues.includes(value)
      ? selectedValues.filter((selected) => selected !== value)
      : [...selectedValues, value]
    column.setFilterValue(next.length > 0 ? next : undefined)
    if (baseOptions.length === 1) setOpen(false)
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
          className={cn("size-7", isFiltered && "text-primary")}
        >
          <Funnel className={cn("size-3.5", !isFiltered && "opacity-40")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit min-w-0 p-1" align="start">
        <div className="flex items-center gap-2 px-2 pt-1 pb-0.5">
          <FunnelX
            className={cn(
              "size-3.5 shrink-0 cursor-pointer transition-colors",
              isFiltered
                ? "text-destructive"
                : "text-muted-foreground opacity-40"
            )}
            onClick={() => {
              clearFilter()
              setOpen(false)
            }}
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={maxLength}
            style={
              maxLength ? { width: `calc(${maxLength}ch + 1.5rem)` } : undefined
            }
            className="h-7 min-w-0 text-xs"
            autoFocus
          />
        </div>
        <div className="max-h-40 overflow-y-auto">
          {visibleItems.map(({ value, label }) => {
            const isSelected = selectedValues.includes(value)
            return (
              <button
                key={value}
                className={cn(
                  "flex w-full items-center gap-1 rounded py-0.5 pr-2 text-left text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                  isSelected && "font-medium"
                )}
                onClick={() => toggleOption(value)}
              >
                <span className="flex size-7 shrink-0 items-center justify-center">
                  <Check
                    className={cn(
                      "size-3.5",
                      isSelected ? "opacity-100" : "opacity-0"
                    )}
                  />
                </span>
                {label}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
