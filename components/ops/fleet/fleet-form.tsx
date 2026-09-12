"use client"

import { useState } from "react"

import { Plus } from "lucide-react"

import { addAircraft } from "@/actions/fleet"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { StatusMessage } from "@/components/ui/status-message"
import { cn } from "@/lib/utils"
import { OperatorReference } from "@/lib/generated/prisma/client"
import { FleetFormAircraftTypeCombobox } from "@/components/ops/fleet/fleet-form-aircraft-type-combobox"
import { FleetFormOperatorCombobox } from "@/components/ops/fleet/fleet-form-operator-combobox"
import { AircraftType, CustomAircraftType, CustomOperator, Operator } from "@/components/ops/fleet/types"

type Errors = {
  registration?: string
  general?: string
}

export function FleetForm({
  deleteButton,
  customAircraftTypes,
  privateOperator,
  customOperators,
  onAddCustomAircraftType,
  onRemoveCustomAircraftType,
  onAddCustomOperator,
  onRemoveCustomOperator,
}: {
  deleteButton?: React.ReactNode
  customAircraftTypes: CustomAircraftType[]
  privateOperator: OperatorReference | null
  customOperators: CustomOperator[]
  onAddCustomAircraftType: () => void
  onRemoveCustomAircraftType: () => Promise<void>
  onAddCustomOperator: () => void
  onRemoveCustomOperator: () => Promise<void>
}) {
  const [registration, setRegistration] = useState("")
  const [selectedAircraftType, setSelectedAircraftType] = useState<AircraftType | null>(null)
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = registration.trim().length > 0 && selectedAircraftType !== null

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedAircraftType) return
    setErrors({})
    setSubmitting(true)

    const formData = new FormData()
    formData.set("registration", registration)
    formData.set("aircraftTypeId", selectedAircraftType.id)
    const effectiveOperator = selectedOperator ?? privateOperator
    if (effectiveOperator)
      formData.set("operatorId", effectiveOperator.id)

    const result = await addAircraft(formData)

    if (result?.error) {
      setErrors({ [result.error.field]: result.error.message })
    } else {
      setRegistration("")
      setSelectedAircraftType(null)
      setSelectedOperator(null)
    }

    setSubmitting(false)
  }

  return (
    <FieldGroup className="pr-1">
      <Field className="flex flex-col gap-2">
        <div className="grid grid-cols-[1fr_auto]">
          <form
            className="grid grid-cols-[1fr_1fr_1fr_auto] items-start gap-2"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-col gap-1">
              <Input
                id="registration"
                value={registration}
                onChange={(e) => {
                  setRegistration(e.target.value.toUpperCase())
                  setErrors((prev) => ({ ...prev, registration: undefined }))
                }}
                placeholder="Registration"
                maxLength={8}
                className={cn(
                  "text-sm",
                  errors.registration &&
                  "border-destructive focus-visible:ring-destructive"
                )}
              />
              {errors.registration && (
                <StatusMessage variant="error" text={errors.registration} />
              )}
            </div>
            <FleetFormAircraftTypeCombobox
              customAircraftTypes={customAircraftTypes}
              selectedAircraftType={selectedAircraftType}
              onAircraftTypeChange={setSelectedAircraftType}
              onAddCustomAircraftType={onAddCustomAircraftType}
              onRemoveCustomAircraftType={onRemoveCustomAircraftType}
            />
            <FleetFormOperatorCombobox
              privateOperator={privateOperator}
              customOperators={customOperators}
              selectedOperator={selectedOperator}
              onOperatorChange={setSelectedOperator}
              onAddCustomOperator={onAddCustomOperator}
              onRemoveCustomOperator={onRemoveCustomOperator}
            />
            <Button
              type="submit"
              variant="default"
              disabled={!canSubmit || submitting}
              size="icon"
              className="hover:bg-primary/80"
            >
              {submitting ? <Spinner /> : <Plus />}
            </Button>
          </form>
          {deleteButton}
        </div>
        {errors.general && (
          <StatusMessage variant="error" text={errors.general} />
        )}
      </Field>
    </FieldGroup>
  )
}
