import fs from "fs";
import path from "path";
import type { QuarterKey, QuarterlyPoint, AreaTrend } from "./quarterly-trends.types";

export type { QuarterKey, QuarterlyPoint, AreaTrend } from "./quarterly-trends.types";

// ── DLD area name → App area name mapping ─────────────────

const DLD_TO_APP: Record<string, string> = {
  "DOWNTOWN DUBAI":           "Downtown Dubai",
  "DUBAI MARINA":             "Dubai Marina",
  "PALM JUMEIRAH":            "Palm Jumeirah",
  "BUSINESS BAY":             "Business Bay",
  "JUMEIRAH VILLAGE CIRCLE":  "Jumeirah Village Circle (JVC)",
  "DUBAI HILLS ESTATE":       "Dubai Hills Estate",
  "JUMEIRAH LAKES TOWERS":    "Jumeirah Lake Towers (JLT)",
  "DUBAI SILICON OASIS":      "Dubai Silicon Oasis",
  "INTERNATIONAL CITY":       "International City",
  "CREEK HARBOUR":            "Creek Harbour",
  "AL BARSHA":                "Al Barsha",
  "DEIRA":                    "Deira",
  "BUR DUBAI":                "Bur Dubai",
  "DUBAI SPORTS CITY":        "Dubai Sports City",
  "ARJAN":                    "Arjan",
  "TOWN SQUARE":              "Town Square",
  "DAMAC HILLS":              "DAMAC Hills",
  "MOHAMMED BIN RASHID CITY": "Mohammed Bin Rashid City",
  "AL REEM ISLAND":           "Al Reem Island",
  "YAS ISLAND":               "Yas Island",
  "AL RAHA BEACH":            "Al Raha Beach",
  "SAADIYAT ISLAND":          "Saadiyat Island",
  "AL MAJAZ":                 "Al Majaz",
  "MUWAILEH":                 "Muwaileh",
  "ALJADA":                   "Aljada",
  "AL NUAIMIYA":              "Al Nuaimiya",
  "EMIRATES CITY":            "Emirates City",
  "AL HAMRA VILLAGE":         "Al Hamra Village",
  "MINA AL ARAB":             "Mina Al Arab",
};

const QUARTER_ORDER: QuarterKey[] = [
  "Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024",
  "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025",
  "Q1 2026",
];

// ── Helpers ────────────────────────────────────────────────

function toQuarterKey(dateStr: string): QuarterKey | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})/);
  if (!match) return null;
  const year = parseInt(match[1]);
  const month = parseInt(match[2]);
  const q = month <= 3 ? "Q1" : month <= 6 ? "Q2" : month <= 9 ? "Q3" : "Q4";
  const key = `${q} ${year}`;
  return QUARTER_ORDER.includes(key) ? key : null;
}

function median(arr: number[]): number {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

// ── Module-level cache ─────────────────────────────────────

let _cache: Record<string, AreaTrend> | null = null;

export function getAllTrends(): Record<string, AreaTrend> {
  if (_cache) return _cache;

  const csvPath = path.join(process.cwd(), "data", "dld-transactions.csv");
  if (!fs.existsSync(csvPath)) return (_cache = {});

  const raw = fs.readFileSync(csvPath, "utf-8");
  const lines = raw.trim().split("\n");
  if (lines.length < 2) return (_cache = {});

  // Parse header indices
  const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());
  const COL = {
    area:    headers.indexOf("AREA_EN"),
    date:    headers.indexOf("INSTANCE_DATE"),
    value:   headers.indexOf("TRANS_VALUE"),
    sqft:    headers.indexOf("ACTUAL_AREA"),
    offplan: headers.indexOf("IS_OFFPLAN_EN"),
  };

  // Accumulator: appArea → quarterKey → raw arrays
  type Bucket = {
    prices: number[];
    sqfts: number[];
    values: number[];
    offPlan: number;
    ready: number;
  };
  const grouped = new Map<string, Map<QuarterKey, Bucket>>();

  const clean = (cols: RegExpMatchArray | null, i: number) =>
    (cols?.[i] ?? "").replace(/^"|"$/g, "").trim();

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].match(/(".*?"|[^,]+)/g);
    const dldArea = clean(cols, COL.area);
    const appArea = DLD_TO_APP[dldArea];
    if (!appArea) continue;

    const qKey = toQuarterKey(clean(cols, COL.date));
    if (!qKey) continue;

    const value   = parseFloat(clean(cols, COL.value)) || 0;
    const areaSqft = parseFloat(clean(cols, COL.sqft)) || 0;
    if (!value || !areaSqft) continue;

    const pricePerSqft = value / areaSqft;
    if (pricePerSqft < 100 || pricePerSqft > 60000) continue;

    const isOffPlan = clean(cols, COL.offplan) === "Off-Plan";

    if (!grouped.has(appArea)) grouped.set(appArea, new Map());
    const areaMap = grouped.get(appArea)!;
    if (!areaMap.has(qKey)) areaMap.set(qKey, { prices: [], sqfts: [], values: [], offPlan: 0, ready: 0 });

    const b = areaMap.get(qKey)!;
    b.prices.push(pricePerSqft);
    b.sqfts.push(areaSqft);
    b.values.push(value);
    if (isOffPlan) b.offPlan++; else b.ready++;
  }

  // Build AreaTrend objects
  const result: Record<string, AreaTrend> = {};

  for (const [appArea, qMap] of grouped.entries()) {
    const quarters: QuarterlyPoint[] = QUARTER_ORDER
      .filter((k) => qMap.has(k))
      .map((k) => {
        const b = qMap.get(k)!;
        const [qLabel, yearStr] = k.split(" ");
        const avg = Math.round(b.prices.reduce((a, c) => a + c, 0) / b.prices.length);
        return {
          quarter:           k,
          quarterLabel:      qLabel,
          year:              parseInt(yearStr),
          avgPricePerSqft:   avg,
          medianPricePerSqft: Math.round(median(b.prices)),
          transactionCount:  b.prices.length,
          totalValue:        Math.round(b.values.reduce((a, c) => a + c, 0)),
          offPlanCount:      b.offPlan,
          readyCount:        b.ready,
          avgActualArea:     Math.round(b.sqfts.reduce((a, c) => a + c, 0) / b.sqfts.length),
        };
      });

    if (quarters.length < 2) continue;

    const latest  = quarters[quarters.length - 1];
    const prevQ   = quarters[quarters.length - 2];
    const prev4   = quarters.length >= 5 ? quarters[quarters.length - 5] : quarters[0];

    const priceChange1Y  = prev4.avgPricePerSqft > 0
      ? Math.round(((latest.avgPricePerSqft - prev4.avgPricePerSqft) / prev4.avgPricePerSqft) * 1000) / 10
      : 0;
    const priceChangeQoQ = prevQ.avgPricePerSqft > 0
      ? Math.round(((latest.avgPricePerSqft - prevQ.avgPricePerSqft) / prevQ.avgPricePerSqft) * 1000) / 10
      : 0;

    const volRatio = prevQ.transactionCount > 0 ? latest.transactionCount / prevQ.transactionCount : 1;
    const volumeTrend = volRatio > 1.1 ? "up" : volRatio < 0.9 ? "down" : "stable";

    const totalLatest = latest.offPlanCount + latest.readyCount;
    const offPlanShare = totalLatest > 0
      ? Math.round((latest.offPlanCount / totalLatest) * 100)
      : 0;

    result[appArea] = {
      area: appArea,
      quarters,
      priceChange1Y,
      priceChangeQoQ,
      latestAvgPrice: latest.avgPricePerSqft,
      volumeTrend,
      offPlanShare,
    };
  }

  return (_cache = result);
}

export function getAreaTrend(areaName: string): AreaTrend | null {
  return getAllTrends()[areaName] ?? null;
}
