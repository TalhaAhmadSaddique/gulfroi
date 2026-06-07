import fs from "fs";
import path from "path";

// ── Types ─────────────────────────────────────────────────────

export type PropTypeStats = {
  type: string;
  avgPricePerSqft: number;
  avgRentPerSqft: number | null;
  grossYieldPct: number | null;
  transactions?: number;
};

export type MarketArea = {
  city: string;
  area: string;
  avgPricePerSqft: number;
  avgAnnualRentPerSqft: number | null;
  avgGrossYieldPct: number | null;
  byType: PropTypeStats[];
  avgServiceChargePerSqft: number;
};

// ── Load from pre-aggregated JSON ─────────────────────────────

let _cache: MarketArea[] | null = null;

function loadSummary(): MarketArea[] {
  if (_cache) return _cache;
  const jsonPath = path.join(process.cwd(), "data", "market-summary.json");
  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  _cache = (raw.areas as MarketArea[]);
  return _cache;
}

// ── Public API ────────────────────────────────────────────────

export function getAllAreas(): MarketArea[] {
  return loadSummary();
}

export function getCities(): string[] {
  return [...new Set(getAllAreas().map((a) => a.city))];
}

export function getAreasByCity(city: string): MarketArea[] {
  return getAllAreas().filter((a) => a.city === city);
}

export function getArea(city: string, area: string): MarketArea | undefined {
  return getAllAreas().find((a) => a.city === city && a.area === area);
}

export function getPropertyTypes(): string[] {
  const types = new Set<string>();
  for (const area of getAllAreas()) {
    for (const t of area.byType) types.add(t.type);
  }
  return [...types].sort();
}

export function getCitiesByType(propType: string): string[] {
  const cities = new Set<string>();
  for (const area of getAllAreas()) {
    if (area.byType.some((t) => t.type === propType)) cities.add(area.city);
  }
  return [...cities].sort();
}

export function getAreasByTypeAndCity(propType: string, city: string): MarketArea[] {
  return getAllAreas().filter(
    (a) => a.city === city && a.byType.some((t) => t.type === propType)
  );
}
