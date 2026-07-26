"use client"

import { useState } from "react"

import { Plus, TextSearch } from "lucide-react"

import {
  addAircraft,
  CustomOperator,
} from "@/actions/fleet"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { StatusMessage } from "@/components/ui/status-message"
import { cn } from "@/lib/utils"
import { OperatorReference } from "@/lib/generated/prisma/client"
import { FleetFormOperatorCombobox } from "@/components/ops/fleet/fleet-form-operator-combobox"

type Operator = {
  id: string
  name: string
  icaoCode: string | null
  iataCode: string | null
  callsign: string | null
  country: string | null
}

type Errors = {
  registration?: string
  icaoCode?: string
  general?: string
}

export function FleetForm({
  deleteButton,
  privateOperator,
  customOperators,
  onAddCustomOperator,
  onRemoveCustomOperator,
}: {
  deleteButton?: React.ReactNode
  privateOperator: OperatorReference | null
  customOperators: CustomOperator[]
  onAddCustomOperator: () => void
  onRemoveCustomOperator: () => Promise<void>
}) {
  const [registration, setRegistration] = useState("")
  const [icaoCode, setIcaoCode] = useState("")
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = registration.trim().length > 0 && icaoCode.trim().length > 0

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({})
    setSubmitting(true)

    const formData = new FormData()
    formData.set("registration", registration)
    formData.set("icaoCode", icaoCode)
    const effectiveOperator = selectedOperator ?? privateOperator
    if (effectiveOperator)
      formData.set("operatorId", effectiveOperator.id)

    const result = await addAircraft(formData)

    if (result?.error) {
      setErrors({ [result.error.field]: result.error.message })
    } else {
      setRegistration("")
      setIcaoCode("")
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
            <div className="flex flex-col gap-1">
              <div className="relative">
                <Input
                  id="icaoCode"
                  value={icaoCode}
                  onChange={(e) => {
                    setIcaoCode(e.target.value.toUpperCase())
                    setErrors((prev) => ({ ...prev, icaoCode: undefined }))
                  }}
                  placeholder="Type"
                  maxLength={4}
                  className={cn(
                    "pr-8 text-sm",
                    errors.icaoCode && "border-destructive"
                  )}
                />
                <a
                  href="https://www.icao.int/operational-safety/doc-8643-aircraft-type-designators/search"
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={-1}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                >
                  <TextSearch className="size-4 text-muted-foreground hover:text-foreground" />
                </a>
              </div>
              {errors.icaoCode && (
                <StatusMessage variant="error" text={errors.icaoCode} />
              )}
            </div>
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