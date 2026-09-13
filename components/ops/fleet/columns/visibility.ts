import { VisibilityState } from "@tanstack/react-table"

import { buildColumns } from "@/components/ops/fleet/columns"
import { getColumnId } from "@/components/ops/fleet/columns/utils"

const allColumns = buildColumns("day")

// groupingOnly columns (regPrefix) back grouping and sorting only and are never rendered.
export const ALWAYS_HIDDEN_COLUMNS: VisibilityState = Object.fromEntries(
  allColumns.filter((column) => column.meta?.groupingOnly).map((column) => [getColumnId(column), false])
)

// Applied under any saved state, so a user's explicit choices win once they exist.
export const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  ...Object.fromEntries(
    allColumns.filter((column) => column.meta?.defaultHidden).map((column) => [getColumnId(column), false])
  ),
  ...ALWAYS_HIDDEN_COLUMNS,
}
