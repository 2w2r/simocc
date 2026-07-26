"use client"

import { useState } from "react"

import { removeCustomOperator } from "@/actions/fleet"
import type { CustomOperator } from "@/actions/fleet"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { StatusMessage } from "@/components/ui/status-message"
import { cn } from "@/lib/utils"
import { MIN_LOADING_DELAY_MS } from "@/lib/constants"

export function RemoveOperatorContent({
    customOperators,
    onClose,
    onSuccess,
}: {
    customOperators?: CustomOperator[]
    onClose: () => void
    onSuccess?: () => void
}) {
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const hasInUseOperators = customOperators?.some((operator) => operator.inUse)

    function toggleOperator(operator: CustomOperator) {
        if (operator.inUse) return
        setSelectedIds((prev) =>
            prev.includes(operator.id)
                ? prev.filter((id) => id !== operator.id)
                : [...prev, operator.id]
        )
    }

    async function handleRemove() {
        setError(null)
        setSubmitting(true)

        const minDelay = new Promise((resolve) => setTimeout(resolve, MIN_LOADING_DELAY_MS))
        const [response] = await Promise.all([removeCustomOperator(selectedIds), minDelay])

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
            {!customOperators?.length ? (
                <div className="overflow-hidden rounded-md border">
                    <table className="w-full table-fixed">
                        <tbody>
                            <tr>
                                <td className="h-8 text-center text-sm text-muted-foreground">
                                    No custom operators.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="overflow-hidden rounded-md border">
                    <table className="w-full table-fixed">
                        <tbody>
                            {customOperators.map((operator) => (
                                <div
                                    key={operator.id}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-1",
                                        operator.inUse
                                            ? "cursor-not-allowed opacity-50"
                                            : "cursor-pointer"
                                    )}
                                    onClick={() => toggleOperator(operator)}
                                >
                                    <span className="w-14 shrink-0 font-mono text-xs">
                                        {operator.icaoCode ?? "—"}/{operator.iataCode ?? "—"}
                                    </span>
                                    <span className="flex-1 text-sm text-muted-foreground truncate">
                                        {operator.name}
                                    </span>
                                    <Checkbox
                                        checked={selectedIds.includes(operator.id)}
                                        disabled={operator.inUse}
                                        onCheckedChange={() => toggleOperator(operator)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {error && <StatusMessage variant="error" text={error} />}
            {hasInUseOperators && (
                <StatusMessage
                    variant="info"
                    text="Some custom operators are currently assigned to aircraft."
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