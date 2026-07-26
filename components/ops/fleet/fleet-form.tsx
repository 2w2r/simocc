"use client"

import { useEffect, useState } from "react"

import { Minus, Plus, TextSearch } from "lucide-react"

import {
  addAircraft,
  CustomOperator,
  searchOperators,
} from "@/actions/fleet"
import { Button } from "@/components/ui/button"
import {
  ButtonGroup,
  ButtonGroupText,
} from "@/components/ui/button-group"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { StatusMessage } from "@/components/ui/status-message"
import { cn } from "@/lib/utils"
import { OperatorReference } from "@/lib/generated/prisma/client"

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

function formatOperatorCode(operator: Operator): string {
  return `${operator.icaoCode ?? "———"}/${operator.iataCode ?? "——"}`
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
  const [operatorQuery, setOperatorQuery] = useState("")
  const [operators, setOperators] = useState<Operator[]>([])
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(
    null
  )
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = registration.trim().length > 0 && icaoCode.trim().length > 0
  const operatorsWithPrivate = [
    ...operators,
    ...(privateOperator ? [privateOperator] : []),
  ]

  useEffect(() => {
    if (operatorQuery.length < 1) {
      setOperators([])
      return
    }
    const timeout = setTimeout(async () => {
      const results = await searchOperators(operatorQuery)
      setOperators(results)
    }, 200)
    return () => clearTimeout(timeout)
  }, [operatorQuery])

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
      setOperatorQuery("")
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
            <Combobox
              items={operatorsWithPrivate}
              itemToStringLabel={(op) =>
                op.id === "none"
                  ? "—/—  ·  No Operator"
                  : `${op.icaoCode ?? "—"}/${op.iataCode ?? "—"}  ·  ${op.name}`
              }
              value={selectedOperator}
              onValueChange={(op) => {
                setSelectedOperator((op as Operator) ?? null)
                setOperatorQuery("")
              }}
            >
              <ComboboxInput
                placeholder="Operator"
                className="text-sm"
                showClear
                onChange={(e) => setOperatorQuery(e.target.value)}
                onBlur={() => setTimeout(() => setOperatorQuery(""), 200)}
              />
              <ComboboxContent>
                <ComboboxList>
                  {(operator) => (
                    <ComboboxItem key={operator.id} value={operator}>
                      <span className="w-16 shrink-0 font-mono text-sm">
                        {formatOperatorCode(operator)}
                      </span>
                      <span
                        className="truncate text-muted-foreground"
                        title={operator.name}
                      >
                        {operator.name}
                      </span>
                    </ComboboxItem>
                  )}
                </ComboboxList>
                {operatorQuery.length === 0 ? (
                  <ButtonGroup className="mx-1 mb-1 w-[calc(100%-0.5rem)]">
                    <Button variant="outline" size="icon" onClick={onAddCustomOperator}>
                      <Plus className="size-3.5" />
                    </Button>
                    <ButtonGroupText className="flex-1 justify-center text-sm">
                      Custom Operator
                    </ButtonGroupText>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={customOperators.length === 0}
                      onClick={onRemoveCustomOperator}
                    >
                      <Minus className="size-3.5" />
                    </Button>
                  </ButtonGroup>
                ) : (
                  <ComboboxEmpty>No operators found.</ComboboxEmpty>
                )}
              </ComboboxContent>
            </Combobox>
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
