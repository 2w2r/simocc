"use client"

import { useMemo, useState } from "react"
import { Calendar1, CalendarIcon, FunnelX } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { sameUTCDay, toUTCMidnight, parseDateInput } from "@/components/ops/fleet/columns/utils"

export function FleetDateRangeFilterPopover({
    column,
    presentDates,
}: {
    column: { getFilterValue: () => unknown; setFilterValue: (value: unknown) => void }
    presentDates: Date[]
}) {
    const [open, setOpen] = useState(false)
    const [inputValue, setInputValue] = useState("")
    const [displayMonth, setDisplayMonth] = useState<Date>(toUTCMidnight(new Date()))

    const range = (column.getFilterValue() as { from?: Date; to?: Date } | undefined) ?? {}
    const isFiltered = !!(range.from || range.to)

    const isOnCurrentMonth =
        displayMonth.getUTCFullYear() === new Date().getUTCFullYear() &&
        displayMonth.getUTCMonth() === new Date().getUTCMonth()

    const hasEntry = useMemo(
        () => (day: Date) => presentDates.some((d) => sameUTCDay(d, day)),
        [presentDates]
    )

    function clearFilter() {
        column.setFilterValue(undefined)
    }

    function handleInputSubmit() {
        const parsed = parseDateInput(inputValue)
        if (!parsed) return
        column.setFilterValue({ from: parsed, to: parsed })
        setDisplayMonth(parsed)
        setInputValue("")
    }

    return (
        <Popover
            open={open}
            onOpenChange={(next) => {
                setOpen(next)
                if (!next) setInputValue("")
            }}
        >
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("size-7", isFiltered && "text-primary")}
                >
                    <CalendarIcon className={cn("size-3.5", !isFiltered && "opacity-40")} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-fit min-w-0 p-1" align="start">
                <div className="flex items-center gap-2 px-2 pt-1">
                    <FunnelX
                        className={cn(
                            "size-3.5 shrink-0 cursor-pointer transition-colors",
                            isFiltered
                                ? "text-destructive"
                                : "text-muted-foreground opacity-40"
                        )}
                        onClick={() => {
                            clearFilter()
                            setOpen(false)
                        }}
                    />
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault()
                                handleInputSubmit()
                            }
                        }}
                        placeholder="YYYY-MM-DD"
                        className="h-8 min-w-0 max-w-38 text-xs"
                        autoFocus
                    />
                    <Calendar1
                        className={cn(
                            "size-3.5 shrink-0 cursor-pointer transition-colors",
                            isOnCurrentMonth &&
                            "text-muted-foreground opacity-40"
                        )}
                        onClick={() => setDisplayMonth(toUTCMidnight(new Date()))}
                    />
                </div>
                <Calendar
                    className="w-full"
                    mode="range"
                    captionLayout="dropdown"
                    weekStartsOn={1}
                    timeZone="UTC"
                    month={displayMonth}
                    onMonthChange={setDisplayMonth}
                    selected={range.from ? { from: range.from, to: range.to } : undefined}
                    onSelect={(next) => column.setFilterValue(next ?? undefined)}
                    modifiers={{ hasEntry }}
                    modifiersClassNames={{
                        hasEntry:
                            "relative after:absolute after:bottom-0 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-blue-500",
                    }}
                />
            </PopoverContent>
        </Popover>
    )
}