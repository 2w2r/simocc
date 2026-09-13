"use client"

import { Globe, GlobeCheck, GlobeX, LucideIcon, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Aircraft } from "@/components/ops/fleet/types"

export type FictionalFilter = "all" | "fictional" | "real"

export type RowFilters = {
  favouritesOnly: boolean
  fictional: FictionalFilter
}

export const DEFAULT_ROW_FILTERS: RowFilters = {
  favouritesOnly: false,
  fictional: "all",
}

const FICTIONAL_CYCLE: Record<FictionalFilter, FictionalFilter> = {
  all: "real",
  real: "fictional",
  fictional: "all",
}

const FICTIONAL_ICONS: Record<FictionalFilter, LucideIcon> = {
  all: Globe,
  real: GlobeCheck,
  fictional: GlobeX,
}

export function applyRowFilters(data: Aircraft[], filters: RowFilters): Aircraft[] {
  return data.filter(
    (aircraft) =>
      (!filters.favouritesOnly || aircraft.favourite) &&
      (filters.fictional === "all" || aircraft.fictional === (filters.fictional === "fictional"))
  )
}

export function hasActiveRowFilters(filters: RowFilters): boolean {
  return filters.favouritesOnly || filters.fictional !== "all"
}

export function FleetRowFilters({
  value,
  onChange,
}: {
  value: RowFilters
  onChange: (next: RowFilters) => void
}) {
  const FictionalIcon = FICTIONAL_ICONS[value.fictional]
  const fictionalActive = value.fictional !== "all"

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={cn("size-7", value.favouritesOnly && "text-primary")}
        onClick={() => onChange({ ...value, favouritesOnly: !value.favouritesOnly })}
      >
        <Star
          className={cn("size-3.5", value.favouritesOnly ? "fill-current" : "opacity-40")}
        />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn("size-7", fictionalActive && "text-primary")}
        onClick={() => onChange({ ...value, fictional: FICTIONAL_CYCLE[value.fictional] })}
      >
        <FictionalIcon className={cn("size-3.5", !fictionalActive && "opacity-40")} />
      </Button>
    </>
  )
}
