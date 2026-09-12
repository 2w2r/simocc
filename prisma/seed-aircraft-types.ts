// AircraftTypeReference based on
// ICAO Doc 8643 (icao.int/operational-safety/doc-8643-aircraft-type-designators/search).
//
// First run seeds everything fresh, no prompts (nothing to compare against yet).
// On later runs: rows whose (manufacturer, model, icaoCode) triple is unchanged
// update silently. New/changed triples are reviewed interactively only when a
// candidate match exists; genuinely new rows with no overlap insert automatically.

import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import {
  PrismaClient,
  AircraftTypeDescription,
  AircraftTypeEngineCategory,
  AircraftTypeWakeTurbulenceCategory,
} from "@/lib/generated/prisma/client";
import { parse } from "csv-parse/sync";
import { readFileSync } from "fs";
import path from "path";
import readline from "readline/promises";

const CSV_PATH = path.join(process.cwd(), "prisma", "aircraft-types.csv");
const COLUMNS = [
  "manufacturer",
  "model",
  "icaoCode",
  "description",
  "engineCategory",
  "engineCount",
  "wakeTurbulenceCategory",
] as const;

const DESCRIPTION_MAP: Record<string, AircraftTypeDescription> = {
  LandPlane: "LANDPLANE",
  SeaPlane: "SEAPLANE",
  Amphibian: "AMPHIBIAN",
  Helicopter: "HELICOPTER",
  Gyrocopter: "GYROCOPTER",
  Tiltrotor: "TILTROTOR",
};

const ENGINE_CATEGORY_MAP: Record<string, AircraftTypeEngineCategory> = {
  Piston: "PISTON",
  Jet: "JET",
  Electric: "ELECTRIC",
  Rocket: "ROCKET",
  "Turboprop/Turboshaft": "TURBOPROP_TURBOSHAFT",
};

const VALID_WAKE_TURBULENCE_CATEGORIES = new Set<AircraftTypeWakeTurbulenceCategory>(["L", "M", "H", "J"]);

interface ParsedRow {
  manufacturer: string;
  model: string;
  icaoCode: string;
  description?: AircraftTypeDescription;
  engineCategory?: AircraftTypeEngineCategory;
  engineCount: string | null;
  wakeTurbulenceCategory: AircraftTypeWakeTurbulenceCategory[];
}
type ExistingRow = ParsedRow & { id: string };

const rowKey = (r: Pick<ParsedRow, "manufacturer" | "model" | "icaoCode">) =>
  `${r.manufacturer}\u0000${r.model}\u0000${r.icaoCode}`;

const sameFields = (a: ParsedRow, b: ParsedRow) =>
  JSON.stringify({ ...a, wakeTurbulenceCategory: [...a.wakeTurbulenceCategory].sort() }) ===
  JSON.stringify({ ...b, wakeTurbulenceCategory: [...b.wakeTurbulenceCategory].sort() });

function mapOrWarn<T extends string>(
  raw: string | undefined,
  map: Record<string, T>,
  label: string,
  ctx: string,
  warnings: string[]
): T | undefined {
  const v = raw?.trim();
  if (!v) return undefined;
  if (!map[v]) warnings.push(`Unrecognized ${label} "${v}" for ${ctx}`);
  return map[v];
}

function parseWakeTurbulenceCategory(
  raw: string | undefined,
  ctx: string,
  warnings: string[]
): AircraftTypeWakeTurbulenceCategory[] {
  return (raw?.split("/") ?? [])
    .map((v) => v.trim())
    .filter((v) => {
      if (!v) return false;
      if (VALID_WAKE_TURBULENCE_CATEGORIES.has(v as AircraftTypeWakeTurbulenceCategory)) return true;
      warnings.push(`Unrecognized WTC "${v}" for ${ctx}`);
      return false;
    }) as AircraftTypeWakeTurbulenceCategory[];
}

function parseRow(raw: Record<(typeof COLUMNS)[number], string>, warnings: string[]): ParsedRow | null {
  const manufacturer = raw.manufacturer?.trim();
  const model = raw.model?.trim();
  const icaoCode = raw.icaoCode?.trim();
  if (!manufacturer || !model || !icaoCode) {
    warnings.push(`Skipped row — missing key field(s): ${JSON.stringify(raw)}`);
    return null;
  }
  const ctx = `${manufacturer} ${model} (${icaoCode})`;
  return {
    manufacturer,
    model,
    icaoCode,
    description: mapOrWarn(raw.description, DESCRIPTION_MAP, "Description", ctx, warnings),
    engineCategory: mapOrWarn(raw.engineCategory, ENGINE_CATEGORY_MAP, "Engine Type", ctx, warnings),
    engineCount: raw.engineCount?.trim() || null,
    wakeTurbulenceCategory: parseWakeTurbulenceCategory(raw.wakeTurbulenceCategory, ctx, warnings),
  };
}

function parseCsv(warnings: string[]): Map<string, ParsedRow> {
  const rows: Record<(typeof COLUMNS)[number], string>[] = parse(readFileSync(CSV_PATH, "utf-8"), {
    columns: COLUMNS as unknown as string[],
    from_line: 2,
    skip_empty_lines: true,
    bom: true,
  });
  console.log(`Parsed ${rows.length} rows from ${CSV_PATH}`);
  const parsed = rows.map((r) => parseRow(r, warnings)).filter((r): r is ParsedRow => r !== null);
  return new Map(parsed.map((r) => [rowKey(r), r]));
}

async function loadExisting(prisma: PrismaClient): Promise<Map<string, ExistingRow>> {
  const rows = await prisma.aircraftTypeReference.findMany({ where: { userId: null } });
  const normalized = rows.map((r) => ({
    ...r,
    description: r.description ?? undefined,
    engineCategory: r.engineCategory ?? undefined,
  }));
  return new Map(normalized.map((r) => [rowKey(r), r]));
}

async function applySilentUpdates(
  prisma: PrismaClient,
  incoming: Map<string, ParsedRow>,
  current: Map<string, ExistingRow>
) {
  const matchedKeys = new Set<string>();
  let updated = 0;
  for (const [k, next] of incoming) {
    const existing = current.get(k);
    if (!existing) continue;
    matchedKeys.add(k);
    if (!sameFields(next, existing)) {
      await prisma.aircraftTypeReference.update({ where: { id: existing.id }, data: next });
      updated++;
    }
  }
  return { matchedKeys, updated };
}

function findCandidates(add: ParsedRow, removals: Map<string, ExistingRow>) {
  return [...removals.entries()].filter(
    ([, r]) => r.manufacturer === add.manufacturer || r.model === add.model || r.icaoCode === add.icaoCode
  );
}

async function resolveAddition(
  prisma: PrismaClient,
  rl: readline.Interface,
  add: ParsedRow,
  removals: Map<string, ExistingRow>
): Promise<"matched" | "inserted" | "skipped"> {
  const candidates = findCandidates(add, removals);

  if (!candidates.length) {
    await prisma.aircraftTypeReference.create({ data: add });
    return "inserted";
  }

  console.log(`\nNEW:  ${add.manufacturer} | ${add.model} | ${add.icaoCode}`);
  console.log("Possibly replaces one of:");
  candidates.forEach(([, r], i) => console.log(`  [${i + 1}] ${r.manufacturer} | ${r.model} | ${r.icaoCode}  (id: ${r.id})`));

  const answer = (await rl.question(`Choice [1-${candidates.length}, n=new, s=skip]: `)).trim().toLowerCase();
  if (answer === "s") return "skipped";

  const choice = Number(answer);
  if (choice >= 1 && choice <= candidates.length) {
    const [rk, matchedRow] = candidates[choice - 1];
    await prisma.aircraftTypeReference.update({ where: { id: matchedRow.id }, data: add });
    removals.delete(rk);
    return "matched";
  }

  await prisma.aircraftTypeReference.create({ data: add });
  return "inserted";
}

async function reviewAdditions(prisma: PrismaClient, additions: ParsedRow[], removals: Map<string, ExistingRow>) {
  if (!additions.length) return { matched: 0, inserted: 0 };
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const tally = { matched: 0, inserted: 0 };
  for (const add of additions) {
    const result = await resolveAddition(prisma, rl, add, removals);
    if (result === "matched") tally.matched++;
    if (result === "inserted") tally.inserted++;
  }
  rl.close();
  return tally;
}

async function deprecateRemaining(prisma: PrismaClient, removals: Map<string, ExistingRow>) {
  let count = 0;
  for (const r of removals.values()) {
    await prisma.aircraftTypeReference.update({ where: { id: r.id }, data: { deprecated: true } });
    count++;
  }
  return count;
}

async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  const warnings: string[] = [];

  const incoming = parseCsv(warnings);
  const current = await loadExisting(prisma);

  const { matchedKeys, updated } = await applySilentUpdates(prisma, incoming, current);

  const additions = [...incoming.entries()].filter(([k]) => !current.has(k)).map(([, r]) => r);
  const removals = new Map([...current.entries()].filter(([k]) => !matchedKeys.has(k)));

  const { matched, inserted } = await reviewAdditions(prisma, additions, removals);
  const deprecated = await deprecateRemaining(prisma, removals);

  console.log(`\nSilently updated: ${updated} | Matched via review: ${matched} | Inserted: ${inserted} | Deprecated: ${deprecated}`);
  if (warnings.length) {
    console.log(`\n${warnings.length} warning(s):`);
    warnings.forEach((w) => console.log(`  - ${w}`));
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});