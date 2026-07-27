export function uniqueOrdered<T>(
  items: T[],
  keyOf: (item: T) => string
): T[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = keyOf(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function getRegPrefix(registration: string): string {
  const trimmed = registration.trim().toUpperCase()

  const delimiterIndex = trimmed.search(/[-+]/)
  if (delimiterIndex > 0) {
    const delimiter = trimmed[delimiterIndex]
    return trimmed.slice(0, delimiterIndex) + delimiter
  }

  const match = trimmed.match(/^[A-Z]+/)
  return match ? match[0] : trimmed
}