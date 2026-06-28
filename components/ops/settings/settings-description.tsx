import { FieldDescription } from "@/components/ui/field"

interface ProcessingMessageProps {
    loading: boolean
    message?: string
}

export function SettingsDescription({ loading, message }: ProcessingMessageProps) {
    if (!loading && !message) return null

    return (
        <FieldDescription className="text-left flex flex-wrap justify-end gap-2">
            <span>{loading ? "Processing . . ." : message}</span>
        </FieldDescription>
    )
}