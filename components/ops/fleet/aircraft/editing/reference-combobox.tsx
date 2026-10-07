"use client"

import { type ReactNode, useEffect, useState } from "react"

import { Combobox as ComboboxPrimitive } from "@base-ui/react"
import { Minus, Plus, Search } from "lucide-react"

import { CELL_CONTROL, CELL_ICON, CELL_TYPABLE } from "@/components/ops/fleet/aircraft/editing/shared"
import { keepOpenOnSuggestionClick } from "@/components/ops/fleet/custom-aircraft-type-dialog/add-content"
import { Button } from "@/components/ui/button"
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group"
import {
  Combobox,
  ComboboxContent,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type CreateContentProps<T> = {
  initialText: string
  onCreated: (item: T) => void
  onClose: () => void
}

type RemoveContentProps<C> = {
  customItems: C[]
  onRemoved: () => void
  onClose: () => void
}

type DialogState<C> = { mode: "add"; initialText: string } | { mode: "remove"; customItems: C[] }

export function ReferenceCombobox<T extends { id: string }, C extends { id: string; inUse: boolean }>({
  value,
  onChange,
  search,
  itemToStringLabel,
  renderItem,
  extraItems = [],
  noun,
  footerLabel,
  loadCustomItems,
  renderCreateContent,
  renderRemoveContent,
}: {
  value: T
  onChange: (item: T) => void
  search: (query: string) => Promise<T[]>
  itemToStringLabel: (item: T) => string
  renderItem: (item: T) => ReactNode
  // Always offered, filtered locally (private operator).
  extraItems?: T[]
  noun: string
  footerLabel: string
  loadCustomItems: () => Promise<C[]>
  renderCreateContent: (props: CreateContentProps<T>) => ReactNode
  renderRemoveContent: (props: RemoveContentProps<C>) => ReactNode
}) {
  const anchor = useComboboxAnchor()
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(() => itemToStringLabel(value))
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<T[]>([])
  const [customItems, setCustomItems] = useState<C[] | null>(null)
  const [dialog, setDialog] = useState<DialogState<C> | null>(null)

  const trimmed = query.trim()

  // Debounced. `cancelled` drops responses superseded by newer input.
  useEffect(() => {
    if (!trimmed) return
    let cancelled = false
    const timeout = setTimeout(async () => {
      const found = await search(trimmed)
      if (!cancelled) setResults(found)
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [trimmed, search])

  const refreshCustomItems = () => loadCustomItems().then(setCustomItems)

  const baseItems = trimmed ? results : [value]
  const lowerQuery = trimmed.toLowerCase()
  const extras = extraItems.filter(
    (item) =>
      !baseItems.some((b) => b.id === item.id) &&
      (!trimmed || itemToStringLabel(item).toLowerCase().includes(lowerQuery))
  )
  const items = [...baseItems, ...extras]

  function select(item: T) {
    onChange(item)
    setInputValue(itemToStringLabel(item))
    setQuery("")
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      if (customItems === null) refreshCustomItems()
      return
    }
    setInputValue(itemToStringLabel(value))
    setQuery("")
  }

  function openDialog(state: DialogState<C>) {
    setDialog(state)
    handleOpenChange(false)
  }

  const closeDialog = () => setDialog(null)

  return (
    <>
      <Combobox
        items={items}
        // Server search already matched; extras filtered above.
        filter={null}
        itemToStringLabel={itemToStringLabel}
        isItemEqualToValue={(a, b) => a.id === b.id}
        value={value}
        // No clear: aircraft always has operator + type.
        onValueChange={(next) => next && select(next as T)}
        open={open}
        onOpenChange={handleOpenChange}
        inputValue={inputValue}
        onInputValueChange={(next, { reason }) => {
          setInputValue(next)
          if (reason === "input-change") setQuery(next)
        }}
      >
        <div ref={anchor} className={cn(CELL_CONTROL, CELL_TYPABLE)}>
          <ComboboxPrimitive.Input
            placeholder={`Search or add ${noun}…`}
            className="min-w-0 flex-1 truncate bg-transparent outline-none placeholder:text-muted-foreground"
            onFocus={() => {
              setInputValue("")
              handleOpenChange(true)
            }}
          />
          <Search className={CELL_ICON} />
        </div>
        <ComboboxContent anchor={anchor}>
          <ComboboxList>
            {(item: T) => (
              <ComboboxItem key={item.id} value={item}>
                {renderItem(item)}
              </ComboboxItem>
            )}
          </ComboboxList>
          <div className="p-1">
            <ButtonGroup className="w-full">
              <Button
                variant="outline"
                size="icon"
                aria-label={trimmed ? `Add ‘${trimmed}’ as custom ${noun}` : `Add custom ${noun}`}
                onClick={() => openDialog({ mode: "add", initialText: trimmed })}
              >
                <Plus className="size-3.5" />
              </Button>
              <ButtonGroupText className="min-w-0 flex-1 justify-center text-sm">
                <span className="truncate" title={trimmed ? `Add ‘${trimmed}’` : undefined}>
                  {trimmed ? <>Add &lsquo;{trimmed}&rsquo;</> : footerLabel}
                </span>
              </ButtonGroupText>
              <Button
                variant="outline"
                size="icon"
                aria-label={`Remove custom ${noun}s`}
                disabled={!customItems?.length}
                onClick={() =>
                  customItems &&
                  openDialog({
                    mode: "remove",
                    // Draft selection counts in use: removal blocked, save never points at
                    // deleted row.
                    customItems: customItems.map((item) => (item.id === value.id ? { ...item, inUse: true } : item)),
                  })
                }
              >
                <Minus className="size-3.5" />
              </Button>
            </ButtonGroup>
          </div>
        </ComboboxContent>
      </Combobox>
      <Dialog open={dialog !== null} onOpenChange={(next) => !next && closeDialog()}>
        {/* No focus return: refocus clears input. Type add content suggestions
            stay clickable. */}
        <DialogContent onCloseAutoFocus={(e) => e.preventDefault()} onInteractOutside={keepOpenOnSuggestionClick}>
          <DialogHeader>
            <DialogTitle>
              {dialog?.mode === "remove" ? `Remove custom ${noun}s?` : `Add custom ${noun}?`}
            </DialogTitle>
          </DialogHeader>
          {dialog?.mode === "add" &&
            renderCreateContent({
              initialText: dialog.initialText,
              onCreated: (item) => {
                select(item)
                refreshCustomItems()
              },
              onClose: closeDialog,
            })}
          {dialog?.mode === "remove" &&
            renderRemoveContent({
              customItems: dialog.customItems,
              onRemoved: refreshCustomItems,
              onClose: closeDialog,
            })}
        </DialogContent>
      </Dialog>
    </>
  )
}
