"use client"

import { useState } from "react"

import { Minus } from "lucide-react"

import { removeAircraftMany } from "@/actions/fleet"
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

export function FleetContent({ data }: { data: Aircraft[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [resetKey, setResetKey] = useState(0)

  const selectedRegistrations = data
    .filter((a) => selectedIds.includes(a.id))
    .map((a) => a.registration)

  async function handleRemoveSelected() {
    await removeAircraftMany(selectedIds)
    setResetKey((k) => k + 1)
    setSelectedIds([])
  }

  return (
    <div className="flex flex-col gap-2">
      <FleetForm
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
      />
      <FleetTable
        data={data}
        onSelectionChange={setSelectedIds}
        resetKey={resetKey}
      />
    </div>
  )
}
