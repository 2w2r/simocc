"use client"

import { useState } from "react"

import { Minus } from "lucide-react"

import { CustomOperator, getCustomOperators, removeAircraftMany } from "@/actions/fleet"
import { FleetForm } from "@/components/ops/fleet/fleet-form"
import { Aircraft } from "@/components/ops/fleet/fleet-columns"
import { FleetTable } from "@/components/ops/fleet/fleet-table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { FleetCustomOperatorDialog } from "@/components/ops/fleet/fleet-custom-operator-dialog"
import type { OperatorReference } from "@/lib/generated/prisma/client"

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
          selectedIds.length > 0 ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="default" size="icon" className="ml-2">
                  <Minus />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Remove {selectedIds.length} aircraft from fleet?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    <span className="flex flex-col gap-0.5">
                      {selectedRegistrations.map((reg) => (
                        <span key={reg} className="text-primary font-light">
                          {reg}
                        </span>
                      ))}
                    </span>
                    <span className="mt-2 block">
                      This action cannot be undone.
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel variant="secondary">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRemoveSelected}
                    variant="destructive"
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null
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