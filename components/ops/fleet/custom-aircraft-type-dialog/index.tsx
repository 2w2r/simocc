"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { AddAircraftTypeContent, keepOpenOnSuggestionClick } from "./add-content"
import { RemoveAircraftTypeContent } from "./remove-content"
import { CustomAircraftType } from "@/components/ops/fleet/types"

export function FleetCustomAircraftTypeDialog({
    open,
    onOpenChange,
    mode,
    customAircraftTypes,
    onSuccess,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: "add" | "remove"
    customAircraftTypes?: CustomAircraftType[]
    onSuccess?: () => void
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent onInteractOutside={keepOpenOnSuggestionClick}>
                <DialogHeader>
                    <DialogTitle>
                        {mode === "add" ? "Add" : "Remove"} custom aircraft type{mode === "add" ? "" : "s"}?
                    </DialogTitle>
                </DialogHeader>
                {mode === "add" ? (
                    <AddAircraftTypeContent
                        onClose={() => onOpenChange(false)}
                        onSuccess={onSuccess}
                    />
                ) : (
                    <RemoveAircraftTypeContent
                        customAircraftTypes={customAircraftTypes}
                        onClose={() => onOpenChange(false)}
                        onSuccess={onSuccess}
                    />
                )}
            </DialogContent>
        </Dialog>
    )
}
