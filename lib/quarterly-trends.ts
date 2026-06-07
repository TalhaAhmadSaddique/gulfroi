import fs from "fs";
import path from "path";
import type { AreaTrend } from "./quarterly-trends.types";

export type { AreaTrend };

let _cache: Record<string, AreaTrend> | null = null;

export function getAllTrends(): Record<string, AreaTrend> {
  if (_cache) return _cache;
  const jsonPath = path.join(process.cwd(), "data", "market-summary.json");
  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  _cache = raw.trends as Record<string, AreaTrend>;
  return _cache;
}
