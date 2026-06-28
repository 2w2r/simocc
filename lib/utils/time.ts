export function timeDecode(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const parts = []
  if (h > 0) parts.push(`${h} ${h === 1 ? "hour" : "hours"}`)
  if (m > 0) parts.push(`${m} ${m === 1 ? "minute" : "minutes"}`)
  if (s > 0) parts.push(`${s} ${s === 1 ? "second" : "seconds"}`)
  return parts.join(", ")
}
