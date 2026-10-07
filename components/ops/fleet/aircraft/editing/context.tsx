"use client"

import { type ReactNode, createContext, useContext, useEffect, useRef, useState } from "react"

import { getAircraftTypeSupplement, updateAircraftDetails } from "@/actions/fleet"
import { FLIGHT_PLAN_TEXT_FIELDS } from "@/components/ops/fleet/aircraft/editing/shared"
import { type RemarkEntry, parseRemarks } from "@/components/ops/fleet/flight-plan-remarks"
import type {
  Aircraft,
  AircraftFlightPlanFields,
  AircraftType,
  AircraftTypeSupplement,
  FlightPlanTextField,
  Operator,
  SupplementValues,
} from "@/components/ops/fleet/types"
import type { AircraftStatus } from "@/lib/generated/prisma/enums"

export type AircraftDraft = {
  registration: string
  operator: Operator
  aircraftType: AircraftType
  aircraftTypeName: string
  engineTypeName: string
  msn: string
  lineNumber: string
  deliveryDate: Date | null
  status: AircraftStatus
  imageUrl: string
  imagePageUrl: string
  imageAuthor: string
  supplement: SupplementValues
  flightPlanFields: Record<FlightPlanTextField, string>
  remarks: RemarkEntry[]
}

const supplementValues = (supplement: AircraftTypeSupplement | null): SupplementValues => ({
  aerodromeReferenceCodeNumber: supplement?.aerodromeReferenceCodeNumber ?? null,
  aerodromeReferenceCodeLetter: supplement?.aerodromeReferenceCodeLetter ?? null,
  rescueFireFightingCategory: supplement?.rescueFireFightingCategory ?? null,
})

function toDraft(
  aircraft: Aircraft,
  supplement: AircraftTypeSupplement | null,
  flightPlanFields: AircraftFlightPlanFields | null
): AircraftDraft {
  return {
    registration: aircraft.registration,
    operator: aircraft.operator,
    aircraftType: aircraft.aircraftType,
    aircraftTypeName: aircraft.aircraftTypeName ?? "",
    engineTypeName: aircraft.engineTypeName ?? "",
    msn: aircraft.msn ?? "",
    lineNumber: aircraft.lineNumber ?? "",
    deliveryDate: aircraft.deliveryDate,
    status: aircraft.status,
    imageUrl: aircraft.imageUrl ?? "",
    imagePageUrl: aircraft.imagePageUrl ?? "",
    imageAuthor: aircraft.imageAuthor ?? "",
    supplement: supplementValues(supplement),
    flightPlanFields: Object.fromEntries(
      FLIGHT_PLAN_TEXT_FIELDS.map((key) => [key, flightPlanFields?.[key] ?? ""])
    ) as Record<FlightPlanTextField, string>,
    remarks: flightPlanFields ? parseRemarks(flightPlanFields.rmk) : [],
  }
}

type EditError = { field: string; message: string }

type AircraftEditContextValue = {
  aircraft: Aircraft
  supplement: AircraftTypeSupplement | null
  flightPlanFields: AircraftFlightPlanFields | null
  privateOperator: Operator | null
  // Non-null while unlocked.
  draft: AircraftDraft | null
  saving: boolean
  loadingSupplement: boolean
  error: EditError | null
  unlock: () => void
  discard: () => void
  save: () => Promise<void>
  update: (patch: Partial<AircraftDraft>) => void
  changeAircraftType: (type: AircraftType) => void
  reportError: (error: EditError) => void
}

const AircraftEditContext = createContext<AircraftEditContextValue | null>(null)

export function useAircraftEdit() {
  const context = useContext(AircraftEditContext)
  if (!context) throw new Error("useAircraftEdit must be used within AircraftEditProvider")
  return context
}

export function AircraftEditProvider({
  aircraft,
  supplement,
  flightPlanFields,
  privateOperator,
  children,
}: {
  aircraft: Aircraft
  supplement: AircraftTypeSupplement | null
  flightPlanFields: AircraftFlightPlanFields | null
  privateOperator: Operator | null
  children: ReactNode
}) {
  const [draft, setDraft] = useState<AircraftDraft | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<EditError | null>(null)
  // Picked type supplement fetch in flight: save blocked, else old type ARC/RFF
  // stored under new type.
  const [loadingSupplement, setLoadingSupplement] = useState(false)
  // Latest picked type: stale supplement responses dropped.
  const pendingIcaoCode = useRef<string | null>(null)
  // Draft at unlock, serialised. Unchanged: save relocks. Changed: leave-page
  // guard.
  const [snapshot, setSnapshot] = useState("")
  const dirty = draft !== null && JSON.stringify(draft) !== snapshot

  // Tab close / reload with unsaved edits: browser "leave page?" prompt. In-app
  // link navigation not covered.
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  function update(patch: Partial<AircraftDraft>) {
    setError(null)
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  function relock() {
    pendingIcaoCode.current = null
    setLoadingSupplement(false)
    setDraft(null)
  }

  function unlock() {
    const initial = toDraft(aircraft, supplement, flightPlanFields)
    setSnapshot(JSON.stringify(initial))
    setError(null)
    setDraft(initial)
  }

  function discard() {
    setError(null)
    relock()
  }

  function changeAircraftType(type: AircraftType) {
    update({ aircraftType: type })
    pendingIcaoCode.current = type.icaoCode
    setLoadingSupplement(true)
    const current = () => pendingIcaoCode.current === type.icaoCode
    getAircraftTypeSupplement(type.icaoCode).then(
      (next) => {
        if (!current()) return
        update({ supplement: supplementValues(next) })
        setLoadingSupplement(false)
      },
      // Failed: save stays blocked; re-pick type retries.
      () => {
        if (current()) setError({ field: "aircraftType", message: "ARC/RFF load failed. Re-pick type." })
      }
    )
  }

  async function save() {
    if (!draft || loadingSupplement) return
    if (!dirty) return relock()
    setSaving(true)
    setError(null)
    try {
      const result = await updateAircraftDetails(aircraft.id, {
        registration: draft.registration,
        operatorId: draft.operator.id,
        aircraftTypeId: draft.aircraftType.id,
        aircraftTypeName: draft.aircraftTypeName,
        engineTypeName: draft.engineTypeName,
        msn: draft.msn,
        lineNumber: draft.lineNumber,
        deliveryDate: draft.deliveryDate,
        status: draft.status,
        imageUrl: draft.imageUrl,
        imagePageUrl: draft.imagePageUrl,
        imageAuthor: draft.imageAuthor,
        supplement: draft.supplement,
        flightPlanFields: { ...draft.flightPlanFields, rmk: draft.remarks },
      })
      if (result.error) setError(result.error)
      else relock()
    } catch {
      // Network / server crash: stay unlocked, draft kept.
      setError({ field: "general", message: "Failed to save aircraft." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AircraftEditContext.Provider
      value={{
        aircraft,
        supplement,
        flightPlanFields,
        privateOperator,
        draft,
        saving,
        loadingSupplement,
        error,
        unlock,
        discard,
        save,
        update,
        changeAircraftType,
        reportError: setError,
      }}
    >
      {children}
    </AircraftEditContext.Provider>
  )
}
