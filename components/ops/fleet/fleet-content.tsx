"use client"

import { useState } from "react"

import { getCustomOperators, removeAircraftMany } from "@/actions/fleet"
import { FleetForm } from "@/components/ops/fleet/fleet-form"
import { FleetTable } from "@/components/ops/fleet/fleet-table"
import type { OperatorReference } from "@/lib/generated/prisma/client"
import { FleetRemoveAircraftDialog } from "@/components/ops/fleet/fleet-remove-aircraft-dialog"
import { FleetCustomOperatorDialog } from "@/components/ops/fleet/custom-operator-dialog"
import { Aircraft, CustomOperator } from "@/components/ops/fleet/types"

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
      <FleetTable
        data={data}
        onSelectionChange={setSelectedIds}
        resetKey={resetKey}
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