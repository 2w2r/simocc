"use client"

import { useEffect, useRef, useState } from "react"

import { Combobox as ComboboxPrimitive } from "@base-ui/react"
import { Calendar1, CalendarIcon, CalendarX2, ChevronsUpDown, Plus, X } from "lucide-react"

import {
  getCustomAircraftTypes,
  getCustomOperators,
  searchAircraftTypes,
  searchOperators,
  suggestAircraftNameField,
} from "@/actions/fleet"
import {
  AIRCRAFT_EDIT_FORM_ID,
  CELL_CONTROL,
  CELL_ICON,
  CELL_TYPABLE,
} from "@/components/ops/fleet/aircraft/editing/shared"
import { DefinitionList } from "@/components/ops/fleet/aircraft/editing/definition-list"
import type { DefinitionTable } from "@/components/ops/fleet/aircraft/reference-definitions"
import { ReferenceCombobox } from "@/components/ops/fleet/aircraft/editing/reference-combobox"
import {
  formatDisplayDate,
  parseDateInput,
  toUTCMidnight,
} from "@/components/ops/fleet/columns/utils"
import { AddAircraftTypeContent } from "@/components/ops/fleet/custom-aircraft-type-dialog/add-content"
import { RemoveAircraftTypeContent } from "@/components/ops/fleet/custom-aircraft-type-dialog/remove-content"
import { AddOperatorContent } from "@/components/ops/fleet/custom-operator-dialog/add-content"
import { RemoveOperatorContent } from "@/components/ops/fleet/custom-operator-dialog/remove-content"
import type { RemarkEntry } from "@/components/ops/fleet/flight-plan-remarks"
import type { AircraftType, Operator } from "@/components/ops/fleet/types"
import { Calendar } from "@/components/ui/calendar"
import {
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const DROPDOWN_CONTENT = "min-w-0 gap-0 p-1"

// Free-text cell in page edit form. Empty stays blank ("—" reads as value).
export function CellInput({ className, ...props }: React.ComponentProps<"input">) {
  return <input form={AIRCRAFT_EDIT_FORM_ID} className={cn(CELL_CONTROL, CELL_TYPABLE, className)} {...props} />
}

export function SuggestingCellInput({
  field,
  icaoCode,
  value,
  onChange,
}: {
  field: "aircraftTypeName" | "engineTypeName"
  icaoCode: string
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])

  // Debounced. `cancelled` drops responses superseded by newer input.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    const timeout = setTimeout(async () => {
      const results = await suggestAircraftNameField(field, icaoCode, value)
      if (!cancelled) setSuggestions(results)
    }, 150)
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [open, field, icaoCode, value])

  const items = suggestions.filter((item) => item !== value)

  return (
    <Combobox
      items={items}
      filter={null}
      open={open && items.length > 0}
      onOpenChange={setOpen}
      inputValue={value}
      onInputValueChange={onChange}
      // Mirrors typed text; fixed null resets input on pick.
      value={value || null}
      onValueChange={(next) => onChange((next as string | null) ?? "")}
    >
      <ComboboxPrimitive.Input
        form={AIRCRAFT_EDIT_FORM_ID}
        className={cn(CELL_CONTROL, CELL_TYPABLE)}
        onFocus={() => setOpen(true)}
      />
      {/* Exact cell width; default min-width adds trigger room. */}
      <ComboboxContent className="min-w-(--anchor-width)">
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

const operatorLabel = (operator: Operator) =>
  `${operator.icaoCode ?? "—"}/${operator.iataCode ?? "—"}  ·  ${operator.name}`

export function OperatorPicker({
  value,
  onChange,
  privateOperator,
}: {
  value: Operator
  onChange: (operator: Operator) => void
  privateOperator: Operator | null
}) {
  return (
    <ReferenceCombobox
      value={value}
      onChange={onChange}
      search={searchOperators}
      itemToStringLabel={operatorLabel}
      extraItems={privateOperator ? [privateOperator] : []}
      noun="operator"
      footerLabel="Custom Operator"
      loadCustomItems={getCustomOperators}
      renderItem={(operator) => (
        <>
          <span className="w-16 shrink-0 font-mono text-sm">
            {`${operator.icaoCode ?? "———"}/${operator.iataCode ?? "——"}`}
          </span>
          <span className="truncate text-muted-foreground" title={operator.name}>
            {operator.name}
          </span>
        </>
      )}
      renderCreateContent={({ initialText, onCreated, onClose }) => (
        <AddOperatorContent initialText={initialText} onSuccess={onCreated} onClose={onClose} />
      )}
      renderRemoveContent={({ customItems, onRemoved, onClose }) => (
        <RemoveOperatorContent customOperators={customItems} onSuccess={onRemoved} onClose={onClose} />
      )}
    />
  )
}

const typeName = (type: AircraftType) => `${type.manufacturer} ${type.model}`

export function AircraftTypePicker({
  value,
  onChange,
}: {
  value: AircraftType
  onChange: (type: AircraftType) => void
}) {
  return (
    <ReferenceCombobox
      value={value}
      onChange={onChange}
      search={searchAircraftTypes}
      itemToStringLabel={(type) => `${type.icaoCode}  ·  ${typeName(type)}`}
      noun="aircraft type"
      footerLabel="Custom Type"
      loadCustomItems={getCustomAircraftTypes}
      renderItem={(type) => (
        <>
          <span className="w-12 shrink-0 font-mono text-sm">{type.icaoCode}</span>
          <span className="truncate text-muted-foreground" title={typeName(type)}>
            {typeName(type)}
          </span>
          {type.deprecated && (
            <span className="ml-auto shrink-0 rounded-sm bg-muted px-1 text-[10px] font-medium uppercase text-muted-foreground">
              Deprecated
            </span>
          )}
        </>
      )}
      renderCreateContent={({ initialText, onCreated, onClose }) => (
        <AddAircraftTypeContent initialText={initialText} onSuccess={onCreated} onClose={onClose} />
      )}
      renderRemoveContent={({ customItems, onRemoved, onClose }) => (
        <RemoveAircraftTypeContent customAircraftTypes={customItems} onSuccess={onRemoved} onClose={onClose} />
      )}
    />
  )
}

const CALENDAR_START = new Date(Date.UTC(1950, 0))
// Expected deliveries: few years ahead.
const CALENDAR_END = new Date(Date.UTC(new Date().getUTCFullYear() + 5, 11))

// UTC midnight, as fleet dates.
export function DatePicker({ value, onChange }: { value: Date | null; onChange: (date: Date | null) => void }) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [displayMonth, setDisplayMonth] = useState<Date>(() => value ?? toUTCMidnight(new Date()))

  function commit(next: Date | null) {
    onChange(next)
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setInputValue("")
        else setDisplayMonth(value ?? toUTCMidnight(new Date()))
      }}
    >
      <PopoverTrigger asChild>
        <button type="button" className={cn(CELL_CONTROL, !value && "text-muted-foreground")}>
          <span className="min-w-0 flex-1 truncate">{value && formatDisplayDate(value)}</span>
          <CalendarIcon className={CELL_ICON} />
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(DROPDOWN_CONTENT, "w-(--radix-popover-trigger-width)")} align="start">
        <div className="flex items-center gap-2 px-2 pt-1">
          {/* Buttons, not bare icons: keyboard reachable. Clear red if set, else faded. */}
          <button
            type="button"
            aria-label="Clear date"
            disabled={!value}
            className={cn(
              "shrink-0 cursor-pointer transition-colors disabled:cursor-default",
              value ? "text-destructive" : "text-muted-foreground opacity-40"
            )}
            onClick={() => commit(null)}
          >
            <CalendarX2 className="size-3.5" />
          </button>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return
              e.preventDefault()
              const parsed = parseDateInput(inputValue)
              if (parsed) commit(parsed)
            }}
            placeholder="YYYY-MM-DD"
            className="h-8 min-w-0 flex-1 text-xs"
            autoFocus
          />
          <button
            type="button"
            aria-label="Go to today"
            className="shrink-0 cursor-pointer text-muted-foreground"
            onClick={() => setDisplayMonth(toUTCMidnight(new Date()))}
          >
            <Calendar1 className="size-3.5" />
          </button>
        </div>
        <Calendar
          className="w-full"
          mode="single"
          captionLayout="dropdown"
          weekStartsOn={1}
          timeZone="UTC"
          startMonth={CALENDAR_START}
          endMonth={CALENDAR_END}
          month={displayMonth}
          onMonthChange={setDisplayMonth}
          selected={value ?? undefined}
          onSelect={(next) => commit(next ?? null)}
        />
      </PopoverContent>
    </Popover>
  )
}

// --- ICAO definition dropdowns (ARC, RFF, PER) ------------------------------

type Code = string | number

type DefinitionPart = {
  label: string
  table: DefinitionTable<Code>
  value: Code | null
  onChange: (value: Code | null) => void
}

// Ties value/onChange to table's code type.
export const definitionPart = <K extends Code>(part: {
  label: string
  table: DefinitionTable<K>
  value: K | null
  onChange: (value: K | null) => void
}): DefinitionPart => part as unknown as DefinitionPart

export function DefinitionSelect({ parts }: { parts: DefinitionPart[] }) {
  const anchorRef = useRef<HTMLDivElement>(null)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const part = openIndex !== null ? parts[openIndex] : null

  function select(next: Code | null) {
    part?.onChange(next)
    setOpenIndex(null)
  }

  return (
    <Popover open={part !== null} onOpenChange={(next) => !next && setOpenIndex(null)}>
      <PopoverAnchor asChild>
        <div ref={anchorRef} className="flex gap-px">
          {parts.map(({ label, value }, i) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              aria-expanded={openIndex === i}
              className={cn(CELL_CONTROL, openIndex === i && "bg-accent")}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            >
              <span className="min-w-0 flex-1 truncate">{value}</span>
              <ChevronsUpDown className={CELL_ICON} />
            </button>
          ))}
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className={cn(DROPDOWN_CONTENT, "w-(--radix-popover-trigger-width)")}
        // Part buttons toggle themselves; outside-close would reopen.
        onInteractOutside={(e) => {
          if (anchorRef.current?.contains(e.target as Node)) e.preventDefault()
        }}
      >
        {part && (
          <DefinitionList
            table={part.table}
            current={part.value}
            onSelect={(code) => select(code === part.value ? null : code)}
          />
        )}
      </PopoverContent>
    </Popover>
  )
}

// --- Remarks (RMK/) -----------------------------------------------------------

function TagInput({
  value,
  onChange,
  knownTags,
  popupAnchor,
}: {
  value: string[]
  onChange: (tags: string[]) => void
  knownTags: string[]
  popupAnchor: React.RefObject<HTMLDivElement | null>
}) {
  const [query, setQuery] = useState("")
  const typed = query.trim()
  const items = typed && !knownTags.includes(typed) ? [...knownTags, typed] : knownTags

  return (
    <Combobox
      multiple
      items={items}
      value={value}
      onValueChange={(next) => {
        onChange(next as string[])
        setQuery("")
      }}
      inputValue={query}
      onInputValueChange={setQuery}
    >
      <ComboboxPrimitive.Chips className={cn(CELL_CONTROL, CELL_TYPABLE, "w-auto max-w-1/2 shrink-0")}>
        <ComboboxValue>
          {(tags: string[]) => (
            <>
              {tags.map((tag) => (
                <ComboboxPrimitive.Chip
                  key={tag}
                  className="flex shrink-0 items-center rounded border border-primary pl-1 text-[10px] leading-4 uppercase"
                >
                  {tag}
                  <ComboboxPrimitive.ChipRemove aria-label={`Remove ${tag}`} className="px-0.5 opacity-50 hover:opacity-100">
                    <X className="size-2.5" />
                  </ComboboxPrimitive.ChipRemove>
                </ComboboxPrimitive.Chip>
              ))}
              <ComboboxPrimitive.Input
                placeholder="+ tag"
                className="w-12 min-w-0 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              />
            </>
          )}
        </ComboboxValue>
      </ComboboxPrimitive.Chips>
      <ComboboxContent anchor={popupAnchor}>
        <ComboboxList>
          {(tag: string) => (
            <ComboboxItem key={tag} value={tag} className="uppercase">
              {tag}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

export function RemarkEditRow({
  entry,
  knownTags,
  onChange,
  onRemove,
}: {
  entry: RemarkEntry
  knownTags: string[]
  onChange: (patch: Partial<RemarkEntry>) => void
  onRemove: () => void
}) {
  const anchor = useComboboxAnchor()
  return (
    <div ref={anchor} className="flex gap-px">
      <CellInput value={entry.text} onChange={(e) => onChange({ text: e.target.value })} placeholder="Remark" />
      <TagInput value={entry.tags} onChange={(tags) => onChange({ tags })} knownTags={knownTags} popupAnchor={anchor} />
      {/* No fixed width: last part takes badge end padding. */}
      <button
        type="button"
        title="Remove remark"
        aria-label="Remove remark"
        className={cn(CELL_CONTROL, "w-auto shrink-0 px-2.5")}
        onClick={onRemove}
      >
        <X className={CELL_ICON} />
      </button>
    </div>
  )
}

export function AddRemarkRow({ onAdd }: { onAdd: () => void }) {
  return (
    <button type="button" className={cn(CELL_CONTROL, "text-muted-foreground")} onClick={onAdd}>
      <Plus className={CELL_ICON} />
      Add remark
    </button>
  )
}

export const remarkTags = (entries: RemarkEntry[]) => [...new Set(entries.flatMap((entry) => entry.tags))].sort()

export const newRemark = (): RemarkEntry => ({ id: crypto.randomUUID(), text: "", tags: [] })
