// Seeds OperatorReference from OpenFlights' airlines.dat
// Source: https://github.com/jpatokal/openflights (Open Database License / ODbL)
// "You are free to use OpenFlights data as you wish, as long as you
//  attribute the source and license derived works under a free license too."
// This is a private, single-user seed — not a public redistribution — so
// attribution here (this comment) satisfies the ODbL requirement.
//
// Note: despite the source filename, this covers all ICAO 3-letter operator
// designators (DOC8585) — airlines, but also military, government, and GA
// operators — hence OperatorReference rather than AirlineReference.
//
// Download the file yourself first (no auth needed):
//   https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat
// Save it as prisma/airlines.dat, then run:
//   pnpm tsx prisma/seed-operators.ts

import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { parse } from "csv-parse/sync";
import { readFileSync } from "fs";
import path from "path";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const DAT_PATH = path.join(process.cwd(), "prisma", "airlines.dat");

// airlines.dat has no header row. Columns, in order:
// Airline ID, Name, Alias, IATA, ICAO, Callsign, Country, Active
const COLUMNS = [
  "id",
  "name",
  "alias",
  "iata",
  "icao",
  "callsign",
  "country",
  "active",
] as const;

function nullify(value: string): string | null {
  if (value === "\\N" || value === "" || value === undefined) return null;
  return value;
}

// OpenFlights uses these as placeholder codes for its "Unknown" (-1) and
// "Private flight" (1) rows — not real designators, so treat them as absent.
const PLACEHOLDER_CODES = new Set(["-", "N/A"]);

function realCode(value: string | null): string | null {
  if (!value || PLACEHOLDER_CODES.has(value)) return null;
  return value;
}

async function main() {
  const raw = readFileSync(DAT_PATH, "utf-8");
  const rows: Record<(typeof COLUMNS)[number], string>[] = parse(raw, {
    columns: COLUMNS as unknown as string[],
    skip_empty_lines: true,
  });

  console.log(`Parsed ${rows.length} rows from ${DAT_PATH}`);

  let seeded = 0;
  let skipped = 0;

  for (const row of rows) {
    const sourceId = Number(row.id);
    const icaoCode = realCode(nullify(row.icao));
    const iataCode = realCode(nullify(row.iata));
    const name = nullify(row.name);

    // Skip only the 2 genuine placeholder rows (Unknown, Private flight)
    // whose codes clean to null on both sides after realCode() filtering.
    // All other rows — including historical duplicates — are intentionally kept.
    if (!Number.isFinite(sourceId) || !name || (!icaoCode && !iataCode)) {
      skipped++;
      continue;
    }

    await prisma.operatorReference.upsert({
      where: { sourceId },
      create: {
        sourceId,
        icaoCode,
        iataCode,
        name,
        callsign: nullify(row.callsign),
        country: nullify(row.country),
      },
      update: {
        icaoCode,
        iataCode,
        name,
        callsign: nullify(row.callsign),
        country: nullify(row.country),
      },
    });

    seeded++;
  }

  console.log(`Seeded ${seeded} operators, skipped ${skipped} (no usable id/code).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });