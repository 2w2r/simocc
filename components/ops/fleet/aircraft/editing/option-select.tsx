"use client"

import { ChevronsUpDown } from "lucide-react"
import { Select as SelectPrimitive } from "radix-ui"

import { CELL_CONTROL, CELL_ICON } from "@/components/ops/fleet/aircraft/editing/shared"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type SelectOption<T extends string> = { value: T; label: string }

export function OptionSelect<T extends string>({
  options,
  value,
  onChange,
  nullable = false,
  name,
  placeholder,
  variant = "default",
  className,
}: {
  options: SelectOption<T>[]
  value: T | null
  onChange: (value: T | null) => void
  nullable?: boolean
  name?: string
  placeholder?: string
  variant?: "default" | "cell"
  className?: string
}) {
  // Radix fires no change for current value: clear on item pick events (mouse
  // pointerup, touch click, Enter/Space). Radix then sees no change.
  const deselect = () => onChange(null)
  const deselectHandlers = {
    onPointerUp: deselect,
    onClick: deselect,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") deselect()
    },
  }

  return (
    <Select name={name} value={value ?? ""} onValueChange={(next) => onChange(next as T)}>
      {variant === "cell" ? (
        <SelectPrimitive.Trigger className={cn(CELL_CONTROL, "data-placeholder:text-muted-foreground", className)}>
          <span className="min-w-0 flex-1 truncate">
            <SelectValue placeholder={placeholder} />
          </span>
          <ChevronsUpDown className={CELL_ICON} />
        </SelectPrimitive.Trigger>
      ) : (
        // min-w-0: long label truncates, trigger keeps width.
        <SelectTrigger className={cn("w-full min-w-0", className)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
      )}
      <SelectContent
        position="popper"
        align="start"
        className={cn(variant === "cell" && "w-(--radix-select-trigger-width)")}
      >
        {/* Group gives p-1 inset; else items flush to border. */}
        <SelectGroup>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              {...(nullable && option.value === value ? deselectHandlers : {})}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
