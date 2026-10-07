import { CircleAlert, CircleCheck, Info } from "lucide-react"

import { FieldDescription } from "@/components/ui/field"

type StatusMessageVariant = "success" | "error" | "info"

// Inline icon, first line of wrapped text. align -0.2em: 16px icon centred on
// 14px text cap height (margin put it above centre).
const ICON_CLASS = "inline size-4 flex-none align-[-0.2em]"

const variantConfig: Record<
  StatusMessageVariant,
  { icon: React.ReactNode; className: string }
> = {
  success: {
    icon: <CircleCheck className={ICON_CLASS} />,
    className: "text-green-500",
  },
  error: {
    icon: <CircleAlert className={ICON_CLASS} />,
    className: "text-destructive",
  },
  info: {
    icon: <Info className={ICON_CLASS} />,
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
