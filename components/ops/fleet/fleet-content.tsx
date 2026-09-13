"use client"

import { useEffect, useMemo, useState } from "react"

import { getCustomAircraftTypes, getCustomOperators, removeAircraftMany } from "@/actions/fleet"
import { FleetForm } from "@/components/ops/fleet/fleet-form"
import { FleetTable } from "@/components/ops/fleet/fleet-table"
import type { OperatorReference } from "@/lib/generated/prisma/client"
import { FleetRemoveAircraftDialog } from "@/components/ops/fleet/fleet-remove-aircraft-dialog"
import { FleetCustomAircraftTypeDialog } from "@/components/ops/fleet/custom-aircraft-type-dialog"
import { FleetCustomOperatorDialog } from "@/components/ops/fleet/custom-operator-dialog"
import { Aircraft, CustomAircraftType, CustomOperator } from "@/components/ops/fleet/types"
import { GroupingState, SortingState, Updater, VisibilityState } from "@tanstack/react-table"
import { FleetGroupSelector } from "@/components/ops/fleet/grouping/selector"
import { FleetColumnVisibilityPopover } from "@/components/ops/fleet/fleet-column-visibility-popover"
import { FleetDefaultSortPopover } from "@/components/ops/fleet/fleet-default-sort-popover"
import { DateGranularities, DateGranularity } from "@/components/ops/fleet/grouping/utils"
import { ALWAYS_HIDDEN_COLUMNS, DEFAULT_COLUMN_VISIBILITY } from "@/components/ops/fleet/columns/visibility"
import {
  applyRowFilters,
  DEFAULT_ROW_FILTERS,
  FleetRowFilters,
  hasActiveRowFilters,
  RowFilters,
} from "@/components/ops/fleet/fleet-row-filters"

const GROUPING_STORAGE_KEY = "fleet-grouping"
const COLUMN_VISIBILITY_STORAGE_KEY = "fleet-column-visibility"
const SORTING_STORAGE_KEY = "fleet-sorting"
const DEFAULT_SORT_STORAGE_KEY = "fleet-default-sort"
const ROW_FILTERS_STORAGE_KEY = "fleet-row-filters"

type PersistedGroupingState = {
  grouping: GroupingState
  dateGranularities: DateGranularities
}

const DEFAULT_GROUPING_STATE: PersistedGroupingState = { grouping: [], dateGranularities: {} }

function parsePersistedGrouping(saved: string | null): PersistedGroupingState {
  if (!saved) return DEFAULT_GROUPING_STATE
  const parsed = JSON.parse(saved)
  const dateGranularities: DateGranularities =
    typeof parsed.dateGranularity === "string"
      ? { createdAt: parsed.dateGranularity }
      : (parsed.dateGranularities ?? {})
  return { grouping: parsed.grouping ?? [], dateGranularities }
}

export function FleetContent({
  data,
  customAircraftTypes: initialCustomAircraftTypes,
  privateOperator,
  customOperators: initialCustomOperators,
}: {
  data: Aircraft[]
  customAircraftTypes: CustomAircraftType[]
  privateOperator: OperatorReference | null
  customOperators: CustomOperator[]
}) {
  const [customAircraftTypes, setCustomAircraftTypes] = useState(initialCustomAircraftTypes)
  const [customOperators, setCustomOperators] = useState(initialCustomOperators)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [resetKey, setResetKey] = useState(0)
  const [isCustomAircraftTypeDialogOpen, setIsCustomAircraftTypeDialogOpen] = useState(false)
  const [customAircraftTypeMode, setCustomAircraftTypeMode] = useState<"add" | "remove">("add")
  const [isCustomOperatorDialogOpen, setIsCustomOperatorDialogOpen] = useState(false)
  const [customOperatorMode, setCustomOperatorMode] = useState<"add" | "remove">("add")
  const [rowFilters, setRowFilters] = useState<RowFilters>(DEFAULT_ROW_FILTERS)
  const [{ grouping, dateGranularities }, setPersistedGrouping] =
    useState<PersistedGroupingState>(DEFAULT_GROUPING_STATE)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(DEFAULT_COLUMN_VISIBILITY)
  const [defaultSorting, setDefaultSorting] = useState<SortingState>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const savedRowFilters = localStorage.getItem(ROW_FILTERS_STORAGE_KEY)
    const savedVisibility = localStorage.getItem(COLUMN_VISIBILITY_STORAGE_KEY)
    const savedDefaultSort = localStorage.getItem(DEFAULT_SORT_STORAGE_KEY)
    const savedSort = localStorage.getItem(SORTING_STORAGE_KEY) ?? savedDefaultSort

    setRowFilters(
      savedRowFilters ? { ...DEFAULT_ROW_FILTERS, ...JSON.parse(savedRowFilters) } : DEFAULT_ROW_FILTERS
    )
    setPersistedGrouping(parsePersistedGrouping(localStorage.getItem(GROUPING_STORAGE_KEY)))
    setColumnVisibility(
      savedVisibility
        ? { ...DEFAULT_COLUMN_VISIBILITY, ...JSON.parse(savedVisibility), ...ALWAYS_HIDDEN_COLUMNS }
        : DEFAULT_COLUMN_VISIBILITY
    )
    setDefaultSorting(savedDefaultSort ? JSON.parse(savedDefaultSort) : [])
    setSorting(savedSort ? JSON.parse(savedSort) : [])
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(GROUPING_STORAGE_KEY, JSON.stringify({ grouping, dateGranularities }))
  }, [hydrated, grouping, dateGranularities])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(ROW_FILTERS_STORAGE_KEY, JSON.stringify(rowFilters))
  }, [hydrated, rowFilters])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(columnVisibility))
  }, [hydrated, columnVisibility])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(SORTING_STORAGE_KEY, JSON.stringify(sorting))
  }, [hydrated, sorting])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(DEFAULT_SORT_STORAGE_KEY, JSON.stringify(defaultSorting))
  }, [hydrated, defaultSorting])

  const visibleData = useMemo(() => applyRowFilters(data, rowFilters), [data, rowFilters])

  function handleSortingChange(updaterOrValue: Updater<SortingState>) {
    setSorting((previousSorting) => {
      const next =
        typeof updaterOrValue === "function"
          ? updaterOrValue(previousSorting)
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
    setSorting((previousSorting) => previousSorting.filter(isStillVisible))
    setDefaultSorting((previousDefaultSorting) =>
      previousDefaultSorting.filter(isStillVisible)
    )
  }

  function handleRowFiltersChange(next: RowFilters) {
    setRowFilters(next)
    setSelectedIds([])
    setResetKey((k) => k + 1)
  }

  function setGrouping(next: GroupingState) {
    setPersistedGrouping((prev) => ({ ...prev, grouping: next }))
  }

  function setDateGranularity(columnId: string, next: DateGranularity) {
    setPersistedGrouping((prev) => ({
      ...prev,
      dateGranularities: { ...prev.dateGranularities, [columnId]: next },
    }))
  }

  const selectedRegistrations = data
    .filter((a) => selectedIds.includes(a.id))
    .map((a) => a.registration)

  async function handleRemoveSelected() {
    await removeAircraftMany(selectedIds)
    setResetKey((k) => k + 1)
    setSelectedIds([])
  }

  async function refreshCustomAircraftTypes() {
    const types = await getCustomAircraftTypes()
    setCustomAircraftTypes(types)
  }

  async function refreshCustomOperators() {
    const operators = await getCustomOperators()
    setCustomOperators(operators)
  }

  return (
    <div className="flex flex-col gap-2">
      <FleetForm
        customAircraftTypes={customAircraftTypes}
        privateOperator={privateOperator}
        customOperators={customOperators}
        deleteButton={
          <FleetRemoveAircraftDialog
            selectedRegistrations={selectedRegistrations}
            onConfirm={handleRemoveSelected}
          />
        }
        onAddCustomAircraftType={() => {
          setCustomAircraftTypeMode("add")
          setIsCustomAircraftTypeDialogOpen(true)
        }}
        onRemoveCustomAircraftType={async () => {
          await refreshCustomAircraftTypes()
          setCustomAircraftTypeMode("remove")
          setIsCustomAircraftTypeDialogOpen(true)
        }}
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
      {hydrated && (
        <>
          <div className="flex items-center gap-1">
            <FleetGroupSelector
              value={grouping}
              onChange={setGrouping}
              dateGranularities={dateGranularities}
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
            <FleetRowFilters value={rowFilters} onChange={handleRowFiltersChange} />
          </div>
          <FleetTable
            key={JSON.stringify(dateGranularities)}
            data={visibleData}
            hasExternalFilters={hasActiveRowFilters(rowFilters)}
            onSelectionChange={setSelectedIds}
            resetKey={resetKey}
            grouping={grouping}
            dateGranularities={dateGranularities}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={handleColumnVisibilityChange}
            sorting={sorting}
            onSortingChange={handleSortingChange}
          />
        </>
      )}
      <FleetCustomAircraftTypeDialog
        open={isCustomAircraftTypeDialogOpen}
        onOpenChange={setIsCustomAircraftTypeDialogOpen}
        mode={customAircraftTypeMode}
        customAircraftTypes={customAircraftTypes}
        onSuccess={refreshCustomAircraftTypes}
      />
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