// Static ICAO definitions behind aircraft page codes. Row codes = edit-mode
// options. Figures in ICAO units (m, kt).

// Interval, explicit inclusivity: shared boundary (65 closes E, opens F) reads
// unambiguous: `{ from: 52, to: 65 }` = 52 ≤ b < 65. Lower always inclusive;
// upper exclusive by default (ICAO "up to but not including"), `toOp` "≤" inclusive.
export type Range = { from?: number; to?: number; toOp?: "<" | "≤" }

type Definition<K extends string | number = string> = {
  code: K
  // One range per column group.
  ranges: Range[]
}

// One measure per range column group. `symbol`: formula variable in rows
// (b = wingspan, as aspect ratio b²/S), italic in title legend.
type Measure = { label: string; symbol: string }

// Unit in title, not per row. Title = measures + unit:
// "Length l, fuselage width w (m)".
export type DefinitionTable<K extends string | number = string> = {
  measures: Measure[]
  unit: string
  rows: Definition<K>[]
}

// Aerodrome reference code, element 1: aeroplane reference field length (ICAO Annex 14).
export const ARC_NUMBER_DEFINITIONS: DefinitionTable<number> = {
  // Field length = distance: d, not l (l = RFF fuselage length).
  measures: [{ label: "Reference field length", symbol: "d" }],
  unit: "m",
  rows: [
    { code: 1, ranges: [{ to: 800 }] },
    { code: 2, ranges: [{ from: 800, to: 1200 }] },
    { code: 3, ranges: [{ from: 1200, to: 1800 }] },
    { code: 4, ranges: [{ from: 1800 }] },
  ],
}

// Aerodrome reference code, element 2: wingspan (ICAO Annex 14).
export const ARC_LETTER_DEFINITIONS: DefinitionTable = {
  measures: [{ label: "Wingspan", symbol: "b" }],
  unit: "m",
  rows: [
    { code: "A", ranges: [{ to: 15 }] },
    { code: "B", ranges: [{ from: 15, to: 24 }] },
    { code: "C", ranges: [{ from: 24, to: 36 }] },
    { code: "D", ranges: [{ from: 36, to: 52 }] },
    { code: "E", ranges: [{ from: 52, to: 65 }] },
    { code: "F", ranges: [{ from: 65, to: 80 }] },
  ],
}

// FPL PER/: aircraft approach category, by threshold speed Vat (ICAO Doc 8168).
// Whole knots, both ends inclusive, as ICAO (B 91–120).
const knots = (from: number, to: number): Range => ({ from, to, toOp: "≤" })
export const APPROACH_CATEGORY_DEFINITIONS: DefinitionTable = {
  measures: [{ label: "IAS at runway threshold", symbol: "Vat" }],
  unit: "kt",
  rows: [
    { code: "A", ranges: [{ to: 91 }] },
    { code: "B", ranges: [knots(91, 120)] },
    { code: "C", ranges: [knots(121, 140)] },
    { code: "D", ranges: [knots(141, 165)] },
    { code: "E", ranges: [knots(166, 210)] },
  ],
}

export const APPROACH_CATEGORIES = APPROACH_CATEGORY_DEFINITIONS.rows.map((row) => row.code)

// Rescue and fire fighting category: overall length, max fuselage width (ICAO Annex 14).
const width = (to: number): Range => ({ to, toOp: "≤" })
export const RFF_DEFINITIONS: DefinitionTable<number> = {
  measures: [
    { label: "Length", symbol: "l" },
    { label: "fuselage width", symbol: "w" },
  ],
  unit: "m",
  rows: [
    { code: 1, ranges: [{ to: 9 }, width(2)] },
    { code: 2, ranges: [{ from: 9, to: 12 }, width(2)] },
    { code: 3, ranges: [{ from: 12, to: 18 }, width(3)] },
    { code: 4, ranges: [{ from: 18, to: 24 }, width(4)] },
    { code: 5, ranges: [{ from: 24, to: 28 }, width(4)] },
    { code: 6, ranges: [{ from: 28, to: 39 }, width(5)] },
    { code: 7, ranges: [{ from: 39, to: 49 }, width(5)] },
    { code: 8, ranges: [{ from: 49, to: 61 }, width(7)] },
    { code: 9, ranges: [{ from: 61, to: 76 }, width(7)] },
    { code: 10, ranges: [{ from: 76, to: 90 }, width(8)] },
  ],
}
