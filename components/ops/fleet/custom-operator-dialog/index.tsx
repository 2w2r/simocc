"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { AddOperatorContent } from "./add-content"
import { RemoveOperatorContent } from "./remove-content"
import { CustomOperator } from "@/components/ops/fleet/types"

export function FleetCustomOperatorDialog({
    open,
    onOpenChange,
    mode,
    customOperators,
    onSuccess,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: "add" | "remove"
    customOperators?: CustomOperator[]
    onSuccess?: () => void
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {mode === "add" ? "Add" : "Remove"} custom operator{mode === "add" ? "" : "s"}?
                    </DialogTitle>
                </DialogHeader>
                {mode === "add" ? (
                    <AddOperatorContent
                        onClose={() => onOpenChange(false)}
                        onSuccess={onSuccess}
                    />
                ) : (
                    <RemoveOperatorContent
                        customOperators={customOperators}
                        onClose={() => onOpenChange(false)}
                        onSuccess={onSuccess}
                    />
                )}
            </DialogContent>
        </Dialog>
    )
}