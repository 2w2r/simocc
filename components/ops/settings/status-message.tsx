import { CircleAlert, CircleCheck, Info } from "lucide-react"

import { FieldDescription } from "@/components/ui/field"

type StatusMessageVariant = "success" | "error" | "info"

const variantConfig: Record<
  StatusMessageVariant,
  { icon: React.ReactNode; className: string }
> = {
  success: {
    icon: <CircleCheck className="size-4 flex-none mb-0.75 inline" />,
    className: "text-green-500",
  },
  error: {
    icon: <CircleAlert className="size-4 flex-none mb-0.75 inline" />,
    className: "text-destructive",
  },
  info: {
    icon: <Info className="size-4 flex-none mb-0.75 inline" />,
    className: "text-blue-500",
  },
}

interface StatusMessageProps {
  variant: StatusMessageVariant
  text: string
}

export function StatusMessage({ variant, text }: StatusMessageProps) {
  const { icon, className } = variantConfig[variant]
  return (
    <FieldDescription className={className}>
      {icon} {text}
    </FieldDescription>
  )
}
