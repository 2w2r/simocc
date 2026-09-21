import type { AircraftFlightPlanFields } from "@/components/ops/fleet/types"

// Element shape of AircraftFlightPlanFields.rmk (Json).
export type RemarkEntry = { id: string; text: string; tags: string[] }

const isRemarkEntry = (value: unknown): value is RemarkEntry =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as RemarkEntry).id === "string" &&
  typeof (value as RemarkEntry).text === "string" &&
  Array.isArray((value as RemarkEntry).tags) &&
  (value as RemarkEntry).tags.every((tag) => typeof tag === "string")

// rmk stored as Json. Keep well-formed entries only.
export const parseRemarks = (rmk: AircraftFlightPlanFields["rmk"]): RemarkEntry[] =>
  Array.isArray(rmk) ? rmk.filter(isRemarkEntry) : []

// Plain RMK/ field content, stored order. Tags = metadata, never emitted.
export const joinRemarks = (entries: RemarkEntry[]): string => entries.map((entry) => entry.text).join(" ")
