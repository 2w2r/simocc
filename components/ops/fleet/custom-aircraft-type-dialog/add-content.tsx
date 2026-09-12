"use client"

import { useState } from "react"

import { addCustomAircraftType } from "@/actions/fleet"
import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { StatusMessage } from "@/components/ui/status-message"
import { MIN_LOADING_DELAY_MS } from "@/lib/constants"

export function AddAircraftTypeContent({
    onClose,
    onSuccess,
}: {
    onClose: () => void
    onSuccess?: () => void
}) {
    const [icaoCode, setIcaoCode] = useState("")
    const [manufacturer, setManufacturer] = useState("")
    const [model, setModel] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const canSubmit =
        icaoCode.trim().length > 0 &&
        manufacturer.trim().length > 0 &&
        model.trim().length > 0

    async function handleAdd(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        setSubmitting(true)

        const formData = new FormData(event.currentTarget)
        const minDelay = new Promise((resolve) => setTimeout(resolve, MIN_LOADING_DELAY_MS))
        const [result] = await Promise.all([addCustomAircraftType(formData), minDelay])

        if (result?.error) {
            setError(result.error.message)
        } else {
            setIcaoCode("")
            setManufacturer("")
            setModel("")
            setError(null)
            onClose()
            onSuccess?.()
        }

        setSubmitting(false)
    }

    return (
        <form onSubmit={handleAdd} className="space-y-3">
            <Input
                placeholder="ICAO Type Designator"
                name="icaoCode"
                value={icaoCode}
                maxLength={4}
                onChange={(e) => setIcaoCode(e.target.value.toUpperCase())}
                required
            />
            <Input
                placeholder="Manufacturer"
                name="manufacturer"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                required
            />
            <Input
                placeholder="Model"
                name="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
            />
            {error && <StatusMessage variant="error" text={error} />}
            <DialogFooter>
                <Button type="button" variant="secondary" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" disabled={!canSubmit || submitting}>
                    {submitting ? <Spinner /> : "Add"}
                </Button>
            </DialogFooter>
        </form>
    )
}
