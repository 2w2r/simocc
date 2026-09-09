"use client"

import { useEffect, useState } from "react"

import { getCustomOperators, removeAircraftMany } from "@/actions/fleet"
import { FleetForm } from "@/components/ops/fleet/fleet-form"
import { FleetTable } from "@/components/ops/fleet/fleet-table"
import type { OperatorReference } from "@/lib/generated/prisma/client"
import { FleetRemoveAircraftDialog } from "@/components/ops/fleet/fleet-remove-aircraft-dialog"
import { FleetCustomOperatorDialog } from "@/components/ops/fleet/custom-operator-dialog"
import { Aircraft, CustomOperator } from "@/components/ops/fleet/types"
import { GroupingState, Updater, VisibilityState } from "@tanstack/react-table"
import { FleetGroupSelector } from "@/components/ops/fleet/grouping/selector"
import { FleetColumnVisibilityPopover } from "@/components/ops/fleet/fleet-column-visibility-popover"
import { DateGranularity } from "@/components/ops/fleet/grouping/utils"

const GROUPING_STORAGE_KEY = "fleet-grouping"
const COLUMN_VISIBILITY_STORAGE_KEY = "fleet-column-visibility"

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

  useEffect(() => {
    localStorage.setItem(COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(columnVisibility))
  }, [columnVisibility])

  function handleColumnVisibilityChange(updaterOrValue: Updater<VisibilityState>) {
    setColumnVisibility((previous) => ({
      ...(typeof updaterOrValue === "function"
        ? updaterOrValue(previous)
        : updaterOrValue),
      ...ALWAYS_HIDDEN_COLUMNS,
    }))
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
      </div>
      <FleetTable
        key={dateGranularity}
        data={data}
        onSelectionChange={setSelectedIds}
        resetKey={resetKey}
        grouping={grouping}
        dateGranularity={dateGranularity}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={handleColumnVisibilityChange}
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