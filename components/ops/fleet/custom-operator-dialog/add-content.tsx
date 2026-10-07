"use client"

import { useState } from "react"

import { addCustomOperator } from "@/actions/fleet"
import type { Operator } from "@/components/ops/fleet/types"
import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { StatusMessage } from "@/components/ui/status-message"
import { MIN_LOADING_DELAY_MS } from "@/lib/constants"

export function AddOperatorContent({
    initialText = "",
    onClose,
    onSuccess,
}: {
    initialText?: string
    onClose: () => void
    onSuccess?: (operator: Operator) => void
}) {
    const initialIcao = /^[A-Z]{3}$/.test(initialText) ? initialText : undefined
    const initialIata = /^(?=.*[A-Z])[A-Z0-9]{2}$/.test(initialText) ? initialText : undefined
    const [name, setName] = useState(initialIcao || initialIata ? "" : initialText)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleAdd(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        setSubmitting(true)

        const formData = new FormData(event.currentTarget)
        const minDelay = new Promise((resolve) => setTimeout(resolve, MIN_LOADING_DELAY_MS))
        const [result] = await Promise.all([addCustomOperator(formData), minDelay])

        if (result.error) {
            setError(result.error.message)
        } else {
            setName("")
            setError(null)
            onClose()
            onSuccess?.(result.operator)
        }

        setSubmitting(false)
    }

    return (
        <form onSubmit={handleAdd} className="space-y-3">
            <Input
                placeholder="Name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
            />
            <div className="flex gap-2">
                <Input
                    placeholder="ICAO"
                    name="icaoCode"
                    maxLength={3}
                    defaultValue={initialIcao}
                    className="w-1/2"
                    onChange={(e) => (e.target.value = e.target.value.toUpperCase())}
                />
                <Input
                    placeholder="IATA"
                    name="iataCode"
                    maxLength={2}
                    defaultValue={initialIata}
                    className="w-1/2"
                    onChange={(e) => (e.target.value = e.target.value.toUpperCase())}
                />
            </div>
            <Input
                placeholder="Callsign"
                name="callsign"
                onChange={(e) => (e.target.value = e.target.value.toUpperCase())}
            />
            <Input placeholder="Country" name="country" />
            {error && <StatusMessage variant="error" text={error} />}
            <DialogFooter>
                <Button type="button" variant="secondary" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" disabled={!name.trim() || submitting}>
                    {submitting ? <Spinner /> : "Add"}
                </Button>
            </DialogFooter>
        </form>
    )
}
