"use client"

import { useEffect, useState } from "react"

import { Check, Copy } from "lucide-react"

import type { RemarkEntry } from "@/components/ops/fleet/flight-plan-remarks"
import { Button } from "@/components/ui/button"

const COPIED_FEEDBACK_MS = 1500

// Copy shortcut to paste remark into SimBrief when planning.
function CopyRemarkButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS)
    return () => clearTimeout(timer)
  }, [copied])

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      title="Copy remark"
      aria-label="Copy remark"
      className="size-5 shrink-0 text-muted-foreground"
      onClick={() => navigator.clipboard.writeText(text).then(() => setCopied(true))}
    >
      {copied ? <Check /> : <Copy />}
    </Button>
  )
}

// One remark per table row, single line. Keeps row height aligned with page.
// Full text via tooltip and copy button.
export function RemarkRow({ entry: { text, tags } }: { entry: RemarkEntry }) {
  return (
    <div className="flex items-center gap-2 leading-5">
      <span title={text} className="min-w-0 flex-1 truncate">
        {text}
      </span>
      {tags.length > 0 && (
        <span className="flex shrink-0 gap-1">
          {tags.map((tag) => (
            <span key={tag} className="rounded border border-primary px-1 text-[10px] leading-4 uppercase">
              {tag}
            </span>
          ))}
        </span>
      )}
      <CopyRemarkButton text={text} />
    </div>
  )
}
