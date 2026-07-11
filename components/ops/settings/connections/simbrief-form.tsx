"use client"

import { useState } from "react"

import { Check, Plus, Unlink, X } from "lucide-react"

import {
  removeSimbriefPilotId,
  saveSimbriefPilotId,
} from "@/components/ops/settings/connections/actions"
import { SettingsDescription } from "@/components/ops/settings/settings-description"
import { StatusMessage } from "@/components/ui/status-message"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AUTH_TIMEOUT_MS, MIN_LOADING_DELAY_MS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { ensurePeriod } from "@/lib/utils/ensure-period"

interface SimbriefFormProps {
  currentPilotId: string | null
}

export function SimbriefForm({ currentPilotId }: SimbriefFormProps) {
  // Keep the saved database value pilotId separate from the controlled input draftPilotId while editing so a failed save doesn't overwrite the display
  const [pilotId, setPilotId] = useState(currentPilotId)
  const [draftPilotId, setDraftPilotId] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const [removed, setRemoved] = useState(false)

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})

    const trimmed = draftPilotId.trim()

    const validationErrors: Record<string, string> = {}
    if (!trimmed) validationErrors.draftPilotId = "Please enter a Pilot ID."
    else if (trimmed === pilotId)
      validationErrors.draftPilotId = "Pilot ID is the same."
    else if (!/^\d+$/.test(trimmed))
      validationErrors.draftPilotId = "Pilot ID must be numeric."

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)

    const minDelay = new Promise((resolve) =>
      setTimeout(resolve, MIN_LOADING_DELAY_MS)
    )

    if (!navigator.onLine) {
      minDelay.then(() => {
        setErrors({ general: "Connection error. Please try again." })
        setLoading(false)
      })
      return
    }

    const timeoutId = setTimeout(() => {
      setLoading(false)
      setErrors({ general: "Request timed out. Please try again." })
    }, AUTH_TIMEOUT_MS)

    const [{ error }] = await Promise.all([
      saveSimbriefPilotId(trimmed),
      minDelay,
    ])

    clearTimeout(timeoutId)

    if (error) {
      setErrors({
        general: ensurePeriod(
          error ?? "Something went wrong. Please try again."
        ),
      })
      setLoading(false)
      return
    }

    setPilotId(trimmed)
    setIsEditing(false)
    setDraftPilotId("")
    setErrors({})
    setSaved(true)
    setLoading(false)
  }

  const handleRemove = async () => {
    setErrors({})
    setLoading(true)

    const minDelay = new Promise((resolve) =>
      setTimeout(resolve, MIN_LOADING_DELAY_MS)
    )

    if (!navigator.onLine) {
      minDelay.then(() => {
        setErrors({ general: "Connection error. Please try again." })
        setLoading(false)
      })
      return
    }

    const timeoutId = setTimeout(() => {
      setLoading(false)
      setErrors({ general: "Request timed out. Please try again." })
    }, AUTH_TIMEOUT_MS)

    const [{ error }] = await Promise.all([removeSimbriefPilotId(), minDelay])

    clearTimeout(timeoutId)

    if (error) {
      setErrors({
        general: ensurePeriod(
          error ?? "Something went wrong. Please try again."
        ),
      })
      setLoading(false)
      return
    }

    setPilotId(null)
    setSaved(false)
    setRemoved(true)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <Field>
          <div
            className={cn(
              "flex flex-row flex-nowrap gap-2",
              isEditing || pilotId ? "@max-2xs:flex-wrap" : "@max-3xs:flex-wrap"
            )}
          >
            <FieldLabel className="text-sm h-8 min-w-fit rounded-lg text-primary">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="whitespace-nowrap cursor-help border-b border-dotted border-current">
                      SimBrief Pilot ID
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    align="start"
                    side="bottom"
                    className="max-w-85 flex flex-col items-start"
                  >
                    Your SimBrief account number — permanently assigned, no
                    re-linking needed if you change anything at SimBrief.
                    <span>
                      Find yours here: <br />
                      <a
                        href="https://dispatch.simbrief.com/account"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-blue-500 hover:text-blue-400"
                      >
                        Account Settings → Your SimBrief Data → Pilot ID
                      </a>{" "}
                    </span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </FieldLabel>
            {!isEditing && (
              <>
                <div className="flex flex-col gap-1 w-full">
                  <div className="text-sm h-8 min-w-8 px-2.5 flex items-center overflow-scroll rounded-lg border border-transparent bg-muted dark:bg-input/30">
                    <span className="w-full text-center whitespace-nowrap">
                      {pilotId ?? "Not connected"}
                    </span>
                  </div>
                  {errors.general && (
                    <StatusMessage variant="error" text={errors.general} />
                  )}
                  {saved && (
                    <StatusMessage
                      variant="success"
                      text="SimBrief Pilot ID saved."
                    />
                  )}
                  {removed && (
                    <StatusMessage
                      variant="info"
                      text="SimBrief Pilot ID removed."
                    />
                  )}
                </div>
                {!pilotId && (
                  <Button
                    className="aspect-square @max-3xs:grow hover:bg-primary/80"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(true)
                      setSaved(false)
                      setRemoved(false)
                      setErrors({})
                      setDraftPilotId("")
                    }}
                  >
                    <Plus />
                  </Button>
                )}
                {pilotId && (
                  <Button
                    className="aspect-square @max-2xs:grow hover:bg-primary/80"
                    variant="outline"
                    onClick={handleRemove}
                    disabled={loading}
                  >
                    {loading ? <Spinner className="size-5" /> : <Unlink />}
                  </Button>
                )}
              </>
            )}
            {isEditing && (
              <>
                <div className="flex flex-col gap-1 w-full">
                  <Input
                    type="text"
                    placeholder="Pilot ID"
                    autoComplete="off"
                    disabled={loading}
                    className={cn(
                      "text-sm text-center min-w-8",
                      (errors.draftPilotId || errors.general) &&
                      "border-destructive"
                    )}
                    value={draftPilotId}
                    onChange={(e) => {
                      setDraftPilotId(e.target.value)
                      setErrors((prev) => ({ ...prev, draftPilotId: "" }))
                    }}
                  />
                  {(errors.draftPilotId || errors.general) && (
                    <StatusMessage
                      variant="error"
                      text={errors.draftPilotId || errors.general}
                    />
                  )}
                </div>
                <Button
                  type={!loading ? "submit" : "button"}
                  className="aspect-square @max-2xs:grow hover:bg-primary/80"
                  variant={loading ? "ghost" : "default"}
                  disabled={loading}
                >
                  {!loading ? <Check /> : <Spinner className="size-5" />}
                </Button>
                <Button
                  type="button"
                  className="aspect-square @max-2xs:grow hover:bg-primary/80"
                  variant={loading ? "ghost" : "outline"}
                  disabled={loading}
                  onClick={() => {
                    setIsEditing(false)
                    setDraftPilotId("")
                    setErrors({})
                  }}
                >
                  <X />
                </Button>
              </>
            )}
          </div>
          {loading && <SettingsDescription loading={loading} message="" />}
        </Field>
      </FieldGroup>
    </form>
  )
}
