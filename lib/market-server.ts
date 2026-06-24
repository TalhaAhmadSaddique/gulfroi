import fs from "fs";
import path from "path";
import type { MarketArea } from "./market-data";
import type { AreaTrend } from "./quarterly-trends.types";

export type CatalogEntry = {
  area: string;
  city: string;
  types: string[];
};

type SummaryRaw = {
  areas: MarketArea[];
  trends: Record<string, AreaTrend>;
};

let _raw: SummaryRaw | null = null;

function loadRaw(): SummaryRaw {
  if (_raw) return _raw;
  const jsonPath = path.join(process.cwd(), "data", "market-summary.json");
  _raw = JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as SummaryRaw;
  return _raw;
}

export function getMarketCatalog(): { propTypes: string[]; entries: CatalogEntry[] } {
  const { areas } = loadRaw();
  const types = new Set<string>();

  const entries: CatalogEntry[] = areas.map((a) => {
    const areaTypes = a.byType.map((t) => t.type);
    areaTypes.forEach((t) => types.add(t));
    return { area: a.area, city: a.city, types: areaTypes };
  });

  return { propTypes: [...types].sort(), entries };
}

export function getAreaWithTrend(
  city: string,
  area: string
): { area: MarketArea; trend: AreaTrend | null } | null {
  const { areas, trends } = loadRaw();
  const match = areas.find((a) => a.city === city && a.area === area);
  if (!match) return null;
  return { area: match, trend: trends[area] ?? null };
}
