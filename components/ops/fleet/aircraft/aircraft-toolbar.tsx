"use client"

import { useOptimistic, useTransition } from "react"

import type { LucideIcon } from "lucide-react"
import { FilePen, FilePlus, GlobeCheck, GlobeX, Lock, LockOpen, Star } from "lucide-react"

import { setAircraftFlags } from "@/actions/fleet"
import { AIRCRAFT_EDIT_FORM_ID } from "@/components/ops/fleet/aircraft/editing/shared"
import { useAircraftEdit } from "@/components/ops/fleet/aircraft/editing/context"
import { formatDisplayDateTime, formatTimeSince } from "@/components/ops/fleet/columns/utils"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

type Flags = { favourite: boolean; fictional: boolean }

// Icon + relative time. Hover: label + exact UTC timestamp.
function Timestamp({ icon: Icon, label, date }: { icon: LucideIcon; label: string; date: Date }) {
  const title = `${label} ${formatDisplayDateTime(date)}`
  return (
    <span title={title} className="flex items-center gap-1">
      <Icon className="size-3.5" aria-hidden />
      {formatTimeSince(date)}
    </span>
  )
}

// Favourite/fictional save immediately, ignore lock.
export function AircraftToolbar() {
  const { aircraft, draft, saving, loadingSupplement, unlock, discard, save, reportError } = useAircraftEdit()

  // Page error instead of native bubble: one error display.
  function submit(form: HTMLFormElement | null) {
    if (!form) return
    const invalid = Array.from(form.elements).find(
      (element): element is HTMLInputElement => element instanceof HTMLInputElement && !element.checkValidity()
    )
    if (!invalid) return form.requestSubmit()
    invalid.focus()
    reportError({
      field: invalid.dataset.field ?? "general",
      message: invalid.dataset.error ?? "Check highlighted field",
    })
  }
  const [, startTransition] = useTransition()
  const [flags, setOptimisticFlags] = useOptimistic<Flags, Partial<Flags>>(
    { favourite: aircraft.favourite, fictional: aircraft.fictional },
    (current, patch) => ({ ...current, ...patch })
  )

  function toggle(patch: Partial<Flags>) {
    startTransition(async () => {
      setOptimisticFlags(patch)
      await setAircraftFlags(aircraft.id, patch)
    })
  }

  const editing = draft !== null
  const FictionalIcon = flags.fictional ? GlobeX : GlobeCheck
  const favouriteLabel = flags.favourite ? "Favourite" : "Non-favourite"
  const fictionalLabel = flags.fictional ? "Fictional" : "Real"
  const lockLabel = editing ? "Discard changes and lock" : "Unlock to edit"

  return (
    // Card width: lock aligns with image card edge.
    <div className="flex w-lg max-w-full items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        title={favouriteLabel}
        aria-label={favouriteLabel}
        aria-pressed={flags.favourite}
        className={cn("size-7", flags.favourite && "text-primary")}
        onClick={() => toggle({ favourite: !flags.favourite })}
      >
        <Star className={cn("size-3.5", flags.favourite ? "fill-current" : "opacity-40")} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        title={fictionalLabel}
        aria-label={fictionalLabel}
        // Real = positive state, full colour. Fictional muted.
        aria-pressed={!flags.fictional}
        className={cn("size-7", !flags.fictional && "text-primary")}
        onClick={() => toggle({ fictional: !flags.fictional })}
      >
        <FictionalIcon className={cn("size-3.5", flags.fictional && "opacity-40")} />
      </Button>
      <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
        <Timestamp icon={FilePlus} label="Created" date={aircraft.createdAt} />
        <Timestamp icon={FilePen} label="Updated" date={aircraft.updatedAt} />
      </div>
      {/* No submit button: Enter in a field never saves. -space-x-0.5: icon gap
          12px, as timestamps. */}
      <form
        id={AIRCRAFT_EDIT_FORM_ID}
        className="flex items-center -space-x-0.5"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        {editing && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Save and lock"
            aria-label="Save and lock"
            disabled={saving || loadingSupplement}
            onClick={(e) => submit(e.currentTarget.form)}
            // Success green, as StatusMessage.
            className="size-7 text-green-500 hover:text-green-500"
          >
            {saving ? <Spinner className="size-3.5" /> : <Lock className="size-3.5" />}
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title={lockLabel}
          aria-label={lockLabel}
          aria-pressed={editing}
          disabled={saving}
          className={cn("size-7", editing && "text-destructive hover:text-destructive")}
          onClick={editing ? discard : unlock}
        >
          {editing ? <LockOpen className="size-3.5" /> : <Lock className="size-3.5 opacity-40" />}
        </Button>
      </form>
    </div>
  )
}
