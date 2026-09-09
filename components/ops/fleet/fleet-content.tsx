"use client"

import { useEffect, useState } from "react"

import { getCustomOperators, removeAircraftMany } from "@/actions/fleet"
import { FleetForm } from "@/components/ops/fleet/fleet-form"
import { FleetTable } from "@/components/ops/fleet/fleet-table"
import type { OperatorReference } from "@/lib/generated/prisma/client"
import { FleetRemoveAircraftDialog } from "@/components/ops/fleet/fleet-remove-aircraft-dialog"
import { FleetCustomOperatorDialog } from "@/components/ops/fleet/custom-operator-dialog"
import { Aircraft, CustomOperator } from "@/components/ops/fleet/types"
import { GroupingState, SortingState, Updater, VisibilityState } from "@tanstack/react-table"
import { FleetGroupSelector } from "@/components/ops/fleet/grouping/selector"
import { FleetColumnVisibilityPopover } from "@/components/ops/fleet/fleet-column-visibility-popover"
import { FleetDefaultSortPopover } from "@/components/ops/fleet/fleet-default-sort-popover"
import { DateGranularity } from "@/components/ops/fleet/grouping/utils"

const GROUPING_STORAGE_KEY = "fleet-grouping"
const COLUMN_VISIBILITY_STORAGE_KEY = "fleet-column-visibility"
const SORTING_STORAGE_KEY = "fleet-sorting"
const DEFAULT_SORT_STORAGE_KEY = "fleet-default-sort"

// regPrefix backs registration-prefix grouping and sorting only and is never rendered.
const ALWAYS_HIDDEN_COLUMNS: VisibilityState = { regPrefix: false }

type PersistedGroupingState = {
  grouping: GroupingState
  dateGranularity: DateGranularity
}

export function FleetContent({
  data,
  privateOperator,
  customOperators: initialCustomOperators,
}: {
  data: Aircraft[]
  customOperators: CustomOperator[]
  privateOperator: OperatorReference | null
}) {
  const [customOperators, setCustomOperators] = useState(initialCustomOperators)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [resetKey, setResetKey] = useState(0)
  const [isCustomOperatorDialogOpen, setIsCustomOperatorDialogOpen] = useState(false)
  const [customOperatorMode, setCustomOperatorMode] = useState<"add" | "remove">("add")
  const [{ grouping, dateGranularity }, setPersistedGrouping] = useState<PersistedGroupingState>(() => {
    if (typeof window === "undefined") return { grouping: [], dateGranularity: "day" }
    const saved = localStorage.getItem(GROUPING_STORAGE_KEY)
    return saved ? JSON.parse(saved) : { grouping: [], dateGranularity: "day" }
  })

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    if (typeof window === "undefined") return ALWAYS_HIDDEN_COLUMNS
    const saved = localStorage.getItem(COLUMN_VISIBILITY_STORAGE_KEY)
    return saved
      ? { ...JSON.parse(saved), ...ALWAYS_HIDDEN_COLUMNS }
      : ALWAYS_HIDDEN_COLUMNS
  })

  useEffect(() => {
    localStorage.setItem(GROUPING_STORAGE_KEY, JSON.stringify({ grouping, dateGranularity }))
  }, [grouping, dateGranularity])

  const [defaultSorting, setDefaultSorting] = useState<SortingState>(() => {
    if (typeof window === "undefined") return []
    const saved = localStorage.getItem(DEFAULT_SORT_STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  })

  const [sorting, setSorting] = useState<SortingState | null>(null)

  useEffect(() => {
    localStorage.setItem(COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(columnVisibility))
  }, [columnVisibility])

  useEffect(() => {
    const saved =
      localStorage.getItem(SORTING_STORAGE_KEY) ??
      localStorage.getItem(DEFAULT_SORT_STORAGE_KEY)
    setSorting(saved ? JSON.parse(saved) : [])
  }, [])

  useEffect(() => {
    if (sorting !== null) {
      localStorage.setItem(SORTING_STORAGE_KEY, JSON.stringify(sorting))
    }
  }, [sorting])

  useEffect(() => {
    localStorage.setItem(DEFAULT_SORT_STORAGE_KEY, JSON.stringify(defaultSorting))
  }, [defaultSorting])

  function handleSortingChange(updaterOrValue: Updater<SortingState>) {
    setSorting((previousSorting) => {
      const current = previousSorting ?? []
      const next =
        typeof updaterOrValue === "function"
          ? updaterOrValue(current)
          : updaterOrValue
      return next.length === 0 ? defaultSorting : next
    })
  }

  function handleDefaultSortingChange(next: SortingState) {
    setDefaultSorting(next)
    setSorting(next)
  }

  function handleColumnVisibilityChange(updaterOrValue: Updater<VisibilityState>) {
    const next: VisibilityState = {
      ...(typeof updaterOrValue === "function"
        ? updaterOrValue(columnVisibility)
        : updaterOrValue),
      ...ALWAYS_HIDDEN_COLUMNS,
    }
    setColumnVisibility(next)

    const isStillVisible = ({ id }: { id: string }) => next[id] !== false
    setSorting((previousSorting) => previousSorting?.filter(isStillVisible) ?? null)
    setDefaultSorting((previousDefaultSorting) =>
      previousDefaultSorting.filter(isStillVisible)
    )
  }

  function setGrouping(next: GroupingState) {
    setPersistedGrouping((prev) => ({ ...prev, grouping: next }))
  }

  function setDateGranularity(next: DateGranularity) {
    setPersistedGrouping((prev) => ({ ...prev, dateGranularity: next }))
  }

  const selectedRegistrations = data
    .filter((a) => selectedIds.includes(a.id))
    .map((a) => a.registration)

  async function handleRemoveSelected() {
    await removeAircraftMany(selectedIds)
    setResetKey((k) => k + 1)
    setSelectedIds([])
  }

  async function refreshCustomOperators() {
    const operators = await getCustomOperators()
    setCustomOperators(operators)
  }

  return (
    <div className="flex flex-col gap-2">
      <FleetForm
        privateOperator={privateOperator}
        customOperators={customOperators}
        deleteButton={
          <FleetRemoveAircraftDialog
            selectedRegistrations={selectedRegistrations}
            onConfirm={handleRemoveSelected}
          />
        }
        onAddCustomOperator={() => {
          setCustomOperatorMode("add")
          setIsCustomOperatorDialogOpen(true)
        }}
        onRemoveCustomOperator={async () => {
          const operators = await getCustomOperators()
          setCustomOperators(operators)
          setCustomOperatorMode("remove")
          setIsCustomOperatorDialogOpen(true)
        }}
      />
      <div className="flex items-center gap-1">
        <FleetGroupSelector
          value={grouping}
          onChange={setGrouping}
          dateGranularity={dateGranularity}
          onDateGranularityChange={setDateGranularity}
        />
        <FleetColumnVisibilityPopover
          value={columnVisibility}
          onChange={handleColumnVisibilityChange}
        />
        <FleetDefaultSortPopover
          value={defaultSorting}
          onChange={handleDefaultSortingChange}
          columnVisibility={columnVisibility}
        />
      </div>
      {sorting !== null && (
        <FleetTable
          key={dateGranularity}
          data={data}
          onSelectionChange={setSelectedIds}
          resetKey={resetKey}
          grouping={grouping}
          dateGranularity={dateGranularity}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={handleColumnVisibilityChange}
          sorting={sorting}
          onSortingChange={handleSortingChange}
        />
      )}
      <FleetCustomOperatorDialog
        open={isCustomOperatorDialogOpen}
        onOpenChange={setIsCustomOperatorDialogOpen}
        mode={customOperatorMode}
        customOperators={customOperators}
        onSuccess={refreshCustomOperators}
      />
    </div>
  )
}