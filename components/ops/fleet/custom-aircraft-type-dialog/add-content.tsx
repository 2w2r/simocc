"use client"

import { useEffect, useState } from "react"

import { Lightbulb } from "lucide-react"

import { addCustomAircraftType, suggestAircraftTypeField } from "@/actions/fleet"
import { Button } from "@/components/ui/button"
import {
    Combobox,
    ComboboxContent,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox"
import { DialogFooter } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { StatusMessage } from "@/components/ui/status-message"
import { MIN_LOADING_DELAY_MS } from "@/lib/constants"

type SuggestionField = "icaoCode" | "manufacturer" | "model"

function useFieldSuggestions(
    field: SuggestionField,
    query: string,
    context?: { manufacturer?: string }
) {
    const [suggestions, setSuggestions] = useState<string[]>([])
    const manufacturer = context?.manufacturer

    useEffect(() => {
        const timeout = setTimeout(async () => {
            const results = query.trim()
                ? await suggestAircraftTypeField(field, query, { manufacturer })
                : []
            setSuggestions(results)
        }, 200)
        return () => clearTimeout(timeout)
    }, [field, query, manufacturer])

    return query.trim() ? suggestions : []
}

// Combobox that keeps free text and offers suggestions if text portions match.
// On close of SuggestingField's popup, the input is reset to the selected entry's 
// label, hindering custom typed values with no entry selection. Typed value is 
// mirrored into `value` to compensate.
function SuggestingField({
    name,
    placeholder,
    value,
    onChange,
    suggestions,
    maxLength,
}: {
    name: string
    placeholder: string
    value: string
    onChange: (next: string) => void
    suggestions: string[]
    maxLength?: number
}) {
    const [open, setOpen] = useState(false)

    return (
        <Combobox
            items={suggestions}
            filter={null}
            open={open && suggestions.length > 0}
            onOpenChange={setOpen}
            inputValue={value}
            onInputValueChange={(next) => onChange(next)}
            value={value || null}
            onValueChange={(next) => onChange((next as string | null) ?? "")}
        >
            <ComboboxInput
                name={name}
                placeholder={placeholder}
                maxLength={maxLength}
                className="text-sm"
                showTrigger={false}
                showClear
                required
            />
            <ComboboxContent>
                <div className="flex items-center gap-1.5 px-2 pt-1.5 text-xs text-muted-foreground">
                    <Lightbulb className="size-3" />
                    Existing entries
                </div>
                <ComboboxList>
                    {(item: string) => (
                        <ComboboxItem key={item} value={item}>
                            {item}
                        </ComboboxItem>
                    )}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    )
}

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

    const icaoCodeSuggestions = useFieldSuggestions("icaoCode", icaoCode)
    const manufacturerSuggestions = useFieldSuggestions("manufacturer", manufacturer)
    const modelSuggestions = useFieldSuggestions("model", model, { manufacturer })

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
            <SuggestingField
                name="icaoCode"
                placeholder="ICAO Type Designator"
                value={icaoCode}
                maxLength={4}
                onChange={(next) => setIcaoCode(next.toUpperCase())}
                suggestions={icaoCodeSuggestions}
            />
            <SuggestingField
                name="manufacturer"
                placeholder="Manufacturer"
                value={manufacturer}
                onChange={(next) => setManufacturer(next.toUpperCase())}
                suggestions={manufacturerSuggestions}
            />
            <SuggestingField
                name="model"
                placeholder="Model"
                value={model}
                onChange={setModel}
                suggestions={modelSuggestions}
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
