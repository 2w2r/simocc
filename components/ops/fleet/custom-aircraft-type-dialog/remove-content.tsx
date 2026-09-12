"use client"

import { useState } from "react"

import { removeCustomAircraftType } from "@/actions/fleet"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { StatusMessage } from "@/components/ui/status-message"
import { cn } from "@/lib/utils"
import { MIN_LOADING_DELAY_MS } from "@/lib/constants"
import { CustomAircraftType } from "@/components/ops/fleet/types"

export function RemoveAircraftTypeContent({
    customAircraftTypes,
    onClose,
    onSuccess,
}: {
    customAircraftTypes?: CustomAircraftType[]
    onClose: () => void
    onSuccess?: () => void
}) {
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const hasInUseAircraftTypes = customAircraftTypes?.some((type) => type.inUse)

    function toggleAircraftType(type: CustomAircraftType) {
        if (type.inUse) return
        setSelectedIds((prev) =>
            prev.includes(type.id)
                ? prev.filter((id) => id !== type.id)
                : [...prev, type.id]
        )
    }

    async function handleRemove() {
        setError(null)
        setSubmitting(true)

        const minDelay = new Promise((resolve) => setTimeout(resolve, MIN_LOADING_DELAY_MS))
        const [response] = await Promise.all([removeCustomAircraftType(selectedIds), minDelay])

        if (response.error) {
            setError(response.error.message)
        } else {
            setSelectedIds([])
            setError(null)
            onClose()
            onSuccess?.()
        }

        setSubmitting(false)
    }

    return (
        <div className="space-y-2">
            {!customAircraftTypes?.length ? (
                <div className="overflow-hidden rounded-md border">
                    <table className="w-full table-fixed">
                        <tbody>
                            <tr>
                                <td className="h-8 text-center text-sm text-muted-foreground">
                                    No custom aircraft types.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="overflow-hidden rounded-md border">
                    <table className="w-full table-fixed">
                        <tbody>
                            {customAircraftTypes.map((type) => (
                                <div
                                    key={type.id}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-1",
                                        type.inUse
                                            ? "cursor-not-allowed opacity-50"
                                            : "cursor-pointer"
                                    )}
                                    onClick={() => toggleAircraftType(type)}
                                >
                                    <span className="w-14 shrink-0 font-mono text-xs">
                                        {type.icaoCode}
                                    </span>
                                    <span className="flex-1 text-sm text-muted-foreground truncate">
                                        {type.manufacturer} {type.model}
                                    </span>
                                    <Checkbox
                                        checked={selectedIds.includes(type.id)}
                                        disabled={type.inUse}
                                        onCheckedChange={() => toggleAircraftType(type)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {error && <StatusMessage variant="error" text={error} />}
            {hasInUseAircraftTypes && (
                <StatusMessage
                    variant="info"
                    text="Some custom aircraft types are currently assigned to aircraft."
                />
            )}
            {selectedIds.length !== 0 && (
                <DialogDescription>
                    <span className="mt-2 block">
                        This action cannot be undone.
                    </span>
                </DialogDescription>
            )}
            <DialogFooter>
                <Button type="button" variant="secondary" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    variant="destructive"
                    disabled={selectedIds.length === 0 || submitting}
                    onClick={handleRemove}
                >
                    {submitting ? <Spinner /> : "Remove"}
                </Button>
            </DialogFooter>
        </div>
    )
}
