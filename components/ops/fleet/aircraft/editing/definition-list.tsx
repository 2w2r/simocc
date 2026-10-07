import { Fragment } from "react"

import { Check } from "lucide-react"

import type { DefinitionTable, Range } from "@/components/ops/fleet/aircraft/reference-definitions"
import { cn } from "@/lib/utils"

// Range cells: from | op | var | op | to ("52 ≤ b < 65"). Explicit inclusivity
// disambiguates shared boundaries. Open end blank ("d < 800"); variable one axis.
const RANGE_CELL_CLASSES = ["text-right", "text-center", "text-center italic opacity-60", "text-center", "text-right"]
const SYMBOL_CELL_INDEX = 2

function rangeCells({ from, to, toOp = "<" }: Range, symbol: string) {
  return [
    from ?? null,
    from !== undefined ? "≤" : null,
    symbol,
    to !== undefined ? toOp : null,
    to ?? null,
  ]
}

export function DefinitionList<K extends string | number>({
  table,
  current,
  onSelect,
}: {
  table: DefinitionTable<K>
  current: K | null
  onSelect: (code: K) => void
}) {
  const rangeGroups = Math.max(...table.rows.map((row) => row.ranges.length))
  // Per group: slots filled in some row. All-blank slots dropped (RFF widths:
  // no lower bound); their gaps widen space before group.
  const usedCells = Array.from({ length: rangeGroups }, (_, g) =>
    RANGE_CELL_CLASSES.map((_, c) => c).filter(
      (c) =>
        c === SYMBOL_CELL_INDEX ||
        table.rows.some((row) => row.ranges[g] && rangeCells(row.ranges[g], "")[c] !== null)
    )
  )
  // Left-aligned. Fixed spacer before each group (+2 gaps = 32px): code-to-group
  // equals group-to-group. Small gaps keep RFF inside popover. Then 1fr, check.
  const template = [
    "auto",
    ...usedCells.flatMap((cells) => ["1rem", ...cells.map(() => "auto")]),
    "1fr",
    "auto",
  ].join(" ")

  return (
    <div className="flex flex-col gap-1">
      <div className="px-1.5 pt-1 text-sm font-medium text-muted-foreground">
        {table.measures.map(({ label, symbol }, i) => (
          <Fragment key={symbol}>
            {i > 0 && ", "}
            {label} <i className="font-normal">{symbol}</i>
          </Fragment>
        ))}{" "}
        ({table.unit})
      </div>
      <div className="grid gap-x-2 tabular-nums" style={{ gridTemplateColumns: template }}>
        {table.rows.map(({ code, ranges }) => {
          const selected = code === current
          return (
            <button
              key={code}
              type="button"
              onClick={() => onSelect(code)}
              className={cn(
                "col-span-full grid grid-cols-subgrid rounded-md py-1 pr-2 pl-1.5 text-left text-muted-foreground outline-hidden hover:bg-accent focus-visible:bg-accent",
                selected && "bg-accent"
              )}
            >
              <div className="font-medium text-foreground">{code}</div>
              {ranges.map((range, g) => {
                const cellValues = rangeCells(range, table.measures[g].symbol)
                return (
                  <Fragment key={g}>
                    <div />
                    {usedCells[g].map((c) => (
                      <div key={c} className={RANGE_CELL_CLASSES[c]}>
                        {cellValues[c]}
                      </div>
                    ))}
                  </Fragment>
                )
              })}
              <div />
              <span className="flex w-4 items-center text-foreground">
                {selected && <Check className="size-4" />}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
