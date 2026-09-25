import type { LucideIcon } from "lucide-react"
import { FilePen, FilePlus, GlobeCheck, GlobeX, Star } from "lucide-react"

import { formatDisplayDateTime, formatTimeSince } from "@/components/ops/fleet/columns/utils"
import type { Aircraft } from "@/components/ops/fleet/types"
import { cn } from "@/lib/utils"

// Icon + relative time. Hover: label + exact UTC timestamp.
function Timestamp({ icon: Icon, label, date }: { icon: LucideIcon; label: string; date: Date }) {
  const title = `${label} ${formatDisplayDateTime(date)}`
  return (
    <span title={title} className="flex items-center gap-1">
      <Icon className="size-3.5" aria-hidden />
      {formatTimeSince(date)}
    </span>
  )
}

// Toolbar above section cards, like fleet table filter row. Favourite/fictional
// read-only indicators left, record timestamps right.
export function AircraftToolbar({ aircraft }: { aircraft: Aircraft }) {
  const FictionalIcon = aircraft.fictional ? GlobeX : GlobeCheck
  const favouriteLabel = aircraft.favourite ? "Favourite" : "Non-favourite"
  const fictionalLabel = aircraft.fictional ? "Fictional" : "Real"

  return (
    <div className="flex items-center gap-1 mr-2">
      <span
        role="img"
        title={favouriteLabel}
        aria-label={favouriteLabel}
        className={cn("flex size-7 items-center justify-center", aircraft.favourite && "text-primary")}
      >
        <Star className={cn("size-3.5", aircraft.favourite ? "fill-current" : "opacity-40")} />
      </span>
      <span
        role="img"
        title={fictionalLabel}
        aria-label={fictionalLabel}
        className={cn("flex size-7 items-center justify-center", aircraft.fictional && "text-primary")}
      >
        <FictionalIcon className={cn("size-3.5", !aircraft.fictional && "opacity-40")} />
      </span>
      <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
        <Timestamp icon={FilePlus} label="Created" date={aircraft.createdAt} />
        <Timestamp icon={FilePen} label="Updated" date={aircraft.updatedAt} />
      </div>
    </div>
  )
}
