import fs from "fs";
import path from "path";

// ── Types ─────────────────────────────────────────────────────

/** Stats for a specific property sub-type within an area */
export type PropTypeStats = {
  type: string;             // e.g. "Flat", "Villa", "Penthouse"
  avgPricePerSqft: number;
  avgRentPerSqft: number | null;    // null = no rental data for this type
  grossYieldPct: number | null;     // null = cannot calculate without rent data
};

export type MarketArea = {
  city: string;
  area: string;
  avgPricePerSqft: number;               // overall area avg (all types)
  avgAnnualRentPerSqft: number | null;   // null if no rent data for this area
  avgGrossYieldPct: number | null;       // null if no rent data for this area
  byType: PropTypeStats[];               // per property-type breakdown
  avgServiceChargePerSqft: number;       // RERA benchmark (not in DLD CSVs)
};

// ── DLD area name (UPPERCASE) → { app name, city } ───────────

const DLD_TO_APP: Record<string, { area: string; city: string }> = {
  "DOWNTOWN DUBAI":           { area: "Downtown Dubai",                city: "Dubai" },
  "DUBAI MARINA":             { area: "Dubai Marina",                  city: "Dubai" },
  "PALM JUMEIRAH":            { area: "Palm Jumeirah",                 city: "Dubai" },
  "BUSINESS BAY":             { area: "Business Bay",                  city: "Dubai" },
  "JUMEIRAH VILLAGE CIRCLE":  { area: "Jumeirah Village Circle (JVC)", city: "Dubai" },
  "DUBAI HILLS ESTATE":       { area: "Dubai Hills Estate",            city: "Dubai" },
  "JUMEIRAH LAKES TOWERS":    { area: "Jumeirah Lake Towers (JLT)",    city: "Dubai" },
  "DUBAI SILICON OASIS":      { area: "Dubai Silicon Oasis",           city: "Dubai" },
  "INTERNATIONAL CITY":       { area: "International City",            city: "Dubai" },
  "CREEK HARBOUR":            { area: "Creek Harbour",                 city: "Dubai" },
  "AL BARSHA":                { area: "Al Barsha",                     city: "Dubai" },
  "DEIRA":                    { area: "Deira",                         city: "Dubai" },
  "BUR DUBAI":                { area: "Bur Dubai",                     city: "Dubai" },
  "DUBAI SPORTS CITY":        { area: "Dubai Sports City",             city: "Dubai" },
  "ARJAN":                    { area: "Arjan",                         city: "Dubai" },
  "TOWN SQUARE":              { area: "Town Square",                   city: "Dubai" },
  "DAMAC HILLS":              { area: "DAMAC Hills",                   city: "Dubai" },
  "MOHAMMED BIN RASHID CITY": { area: "Mohammed Bin Rashid City",      city: "Dubai" },
  "AL REEM ISLAND":           { area: "Al Reem Island",                city: "Abu Dhabi" },
  "YAS ISLAND":               { area: "Yas Island",                    city: "Abu Dhabi" },
  "AL RAHA BEACH":            { area: "Al Raha Beach",                 city: "Abu Dhabi" },
  "SAADIYAT ISLAND":          { area: "Saadiyat Island",               city: "Abu Dhabi" },
  "AL MAJAZ":                 { area: "Al Majaz",                      city: "Sharjah" },
  "MUWAILEH":                 { area: "Muwaileh",                      city: "Sharjah" },
  "ALJADA":                   { area: "Aljada",                        city: "Sharjah" },
  "AL NUAIMIYA":              { area: "Al Nuaimiya",                   city: "Ajman" },
  "EMIRATES CITY":            { area: "Emirates City",                 city: "Ajman" },
  "AL HAMRA VILLAGE":         { area: "Al Hamra Village",              city: "Ras Al Khaimah" },
  "MINA AL ARAB":             { area: "Mina Al Arab",                  city: "Ras Al Khaimah" },
};

// ── Rent CSV area names (uppercased) → DLD_TO_APP key ─────────
// The rent file uses granular DLD sub-district names;
// we map them back to the broader area keys used in transactions.

const RENT_AREA_MAP: Record<string, string> = {
  // Downtown / Trade Center district
  "TRADE CENTER FIRST":           "DOWNTOWN DUBAI",
  "TRADE CENTER SECOND":          "DOWNTOWN DUBAI",
  "BURJ KHALIFA":                 "DOWNTOWN DUBAI",
  // Dubai Marina area (Al Thanyah is the official DLD name)
  "AL THANYAH FIRST":             "DUBAI MARINA",
  "AL THANYAH SECOND":            "DUBAI MARINA",
  "AL THANYAH THIRD":             "DUBAI MARINA",
  "AL THANYAH FOURTH":            "DUBAI MARINA",
  "AL THANYAH FIFTH":             "DUBAI MARINA",
  "JABAL ALI FIRST":              "DUBAI MARINA",
  // Al Barsha sub-districts
  "AL BARSHA FIRST":              "AL BARSHA",
  "AL BARSHA SECOND":             "AL BARSHA",
  "AL BARSHA THIRD":              "AL BARSHA",
  "AL BARSHA SOUTH FIRST":        "AL BARSHA",
  "AL BARSHA SOUTH SECOND":       "AL BARSHA",
  "AL BARSHA SOUTH THIRD":        "AL BARSHA",
  "AL BARSHA SOUTH FOURTH":       "AL BARSHA",
  "AL BARSHA SOUTH FIFTH":        "AL BARSHA",
  // Bur Dubai sub-districts
  "AL SUQ AL KABEER":             "BUR DUBAI",
  "AL MANKHOOL":                  "BUR DUBAI",
  "AL HAMRIYA":                   "BUR DUBAI",
  "UMMD HURAIR FIRST":            "BUR DUBAI",
  "UMMD HURAIR SECOND":           "BUR DUBAI",
  // Deira sub-districts
  "AL RAS":                       "DEIRA",
  "AL KHABEESI":                  "DEIRA",
  "MUHAISANAH FIRST":             "DEIRA",
  "MUHAISANAH SECOND":            "DEIRA",
  "MUHAISANAH THIRD":             "DEIRA",
  "MUHAISANAH FOURTH":            "DEIRA",
  "AL SABKHA":                    "DEIRA",
  "AL MURAQQABAT":                "DEIRA",
  "AL RIGGA":                     "DEIRA",
  "NAIF":                         "DEIRA",
  // Dubai Silicon Oasis / east Dubai
  "AL NAHDA SECOND":              "DUBAI SILICON OASIS",
  "AL QUSAIS INDUSTRIAL FIFTH":   "DUBAI SILICON OASIS",
  "AL QUSAIS RESIDENTIAL FIRST":  "DUBAI SILICON OASIS",
  "NADD HESSA":                   "DUBAI SILICON OASIS",
  // International City adjacent
  "AL AWEER FIRST":               "INTERNATIONAL CITY",
  "AL AWEER SECOND":              "INTERNATIONAL CITY",
  // Creek Harbour / Meydan
  "AL MERKADH":                   "CREEK HARBOUR",
  "MEYDAN":                       "CREEK HARBOUR",
  // DAMAC Hills / Arabian Ranches corridor
  "AL YELAYISS 1":                "DAMAC HILLS",
  "AL YELAYISS 2":                "DAMAC HILLS",
  "AL YELAYISS 3":                "DAMAC HILLS",
  "WADI AL SAFA 1":               "DAMAC HILLS",
  "WADI AL SAFA 2":               "DAMAC HILLS",
  "WADI AL SAFA 3":               "DAMAC HILLS",
  "WADI AL SAFA 4":               "DAMAC HILLS",
  "WADI AL SAFA 5":               "DAMAC HILLS",
  "WADI AL SAFA 6":               "DAMAC HILLS",
  "WADI AL SAFA 7":               "DAMAC HILLS",
  // Arjan / Al Quoz corridor
  "AL GOZE FIRST":                "ARJAN",
  "AL GOZE SECOND":               "ARJAN",
  "AL GOZE THIRD":                "ARJAN",
  "AL GOZE FOURTH":               "ARJAN",
  "AL GOZE INDUSTRIAL FIRST":     "ARJAN",
  "AL GOZE INDUSTRIAL SECOND":    "ARJAN",
  "AL GOZE INDUSTRIAL THIRD":     "ARJAN",
  "AL GOZE INDUSTRIAL FOURTH":    "ARJAN",
  "DUBAI INVESTMENT PARK FIRST":  "ARJAN",
  "DUBAI INVESTMENT PARK SECOND": "ARJAN",
};

function normalizeRentArea(raw: string): string | null {
  const upper = raw.toUpperCase().trim();
  if (DLD_TO_APP[upper]) return upper;           // direct match
  return RENT_AREA_MAP[upper] ?? null;           // sub-district mapping
}

// ── Service charge benchmarks (RERA published rates) ─────────
// Not available in either DLD CSV; sourced from RERA published schedules.

const SVC_BENCHMARKS: Record<string, number> = {
  "Downtown Dubai":                30,
  "Dubai Marina":                  18,
  "Palm Jumeirah":                 25,
  "Business Bay":                  18,
  "Jumeirah Village Circle (JVC)": 12,
  "Dubai Hills Estate":            22,
  "Jumeirah Lake Towers (JLT)":    15,
  "Dubai Silicon Oasis":           10,
  "International City":             8,
  "Creek Harbour":                 20,
  "Al Barsha":                     12,
  "Deira":                         10,
  "Bur Dubai":                     10,
  "Dubai Sports City":             11,
  "Arjan":                         11,
  "Town Square":                   13,
  "DAMAC Hills":                   15,
  "Mohammed Bin Rashid City":      20,
  "Al Reem Island":                15,
  "Yas Island":                    18,
  "Al Raha Beach":                 18,
  "Saadiyat Island":               25,
  "Al Majaz":                      10,
  "Muwaileh":                       8,
  "Aljada":                        11,
  "Al Nuaimiya":                    8,
  "Emirates City":                  6,
  "Al Hamra Village":              12,
  "Mina Al Arab":                  10,
};

// ── Helpers ───────────────────────────────────────────────────

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function parseCSV(filePath: string): string[][] {
  const raw = fs.readFileSync(filePath, "utf-8").trim();
  return raw.split("\n").map((line) => {
    const cols: string[] = [];
    let cur = "";
    let inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === "," && !inQ) { cols.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    cols.push(cur.trim());
    return cols;
  });
}

// ── Main aggregation ──────────────────────────────────────────

let _cache: MarketArea[] | null = null;

export function getAllAreas(): MarketArea[] {
  if (_cache) return _cache;

  // ── 1. Parse transactions (sale prices) ──────────────────

  const txRows = parseCSV(path.join(process.cwd(), "data", "dld-transactions.csv"));
  const txH = txRows[0];
  const TX = {
    area:  txH.indexOf("AREA_EN"),
    value: txH.indexOf("TRANS_VALUE"),
    sqft:  txH.indexOf("ACTUAL_AREA"),
    type:  txH.indexOf("PROP_SB_TYPE_EN"),
  };

  // salesByAreaType: "DLDKEY||PropType" → [pricePerSqft]
  const salesByAreaType = new Map<string, number[]>();

  for (let i = 1; i < txRows.length; i++) {
    const r = txRows[i];
    const dldArea = r[TX.area] ?? "";
    if (!DLD_TO_APP[dldArea]) continue;

    const value = parseFloat(r[TX.value]) || 0;
    const sqft  = parseFloat(r[TX.sqft])  || 0;
    if (!value || !sqft) continue;

    const pps = value / sqft;
    if (pps < 100 || pps > 60_000) continue;

    const propType = r[TX.type]?.trim() || "Unit";
    const key = `${dldArea}||${propType}`;
    const arr = salesByAreaType.get(key) ?? [];
    arr.push(pps);
    salesByAreaType.set(key, arr);
  }

  // ── 2. Parse rents (annual rent per sqft) ─────────────────

  const rentRows = parseCSV(path.join(process.cwd(), "data", "dld-rents.csv"));
  const rentH = rentRows[0];
  const RN = {
    area:   rentH.indexOf("AREA_EN"),
    annual: rentH.indexOf("ANNUAL_AMOUNT"),
    sqft:   rentH.indexOf("ACTUAL_AREA"),
    type:   rentH.indexOf("PROP_SUB_TYPE_EN"),
    usage:  rentH.indexOf("USAGE_EN"),
  };

  // rentsByAreaType: "DLDKEY||PropType" → [annualRentPerSqft]
  const rentsByAreaType = new Map<string, number[]>();

  for (let i = 1; i < rentRows.length; i++) {
    const r = rentRows[i];
    const usage = r[RN.usage]?.trim() ?? "";
    if (usage !== "Residential") continue;         // skip commercial/industrial

    const rawArea = r[RN.area] ?? "";
    const dldKey  = normalizeRentArea(rawArea);
    if (!dldKey) continue;

    const annual = parseFloat(r[RN.annual]) || 0;
    const sqft   = parseFloat(r[RN.sqft])   || 0;
    if (!annual || !sqft) continue;

    const rps = annual / sqft;
    if (rps < 10 || rps > 5_000) continue;        // sanity bounds

    const propType = r[RN.type]?.trim() || "Flat";
    const key = `${dldKey}||${propType}`;
    const arr = rentsByAreaType.get(key) ?? [];
    arr.push(rps);
    rentsByAreaType.set(key, arr);
  }

  // ── 3. Build MarketArea objects ───────────────────────────

  // Collect all DLD keys that have sales data
  const dldKeys = new Set<string>();
  for (const key of salesByAreaType.keys()) {
    dldKeys.add(key.split("||")[0]);
  }

  const result: MarketArea[] = [];

  for (const dldArea of dldKeys) {
    const { area, city } = DLD_TO_APP[dldArea];

    // Collect all property types with sales in this area
    const typesWithSales = new Map<string, number[]>();
    for (const [key, prices] of salesByAreaType.entries()) {
      const [kArea, kType] = key.split("||");
      if (kArea === dldArea) typesWithSales.set(kType, prices);
    }

    // Build per-type stats
    const byType: PropTypeStats[] = [];
    const allSalePrices: number[] = [];
    const allRentPrices: number[] = [];

    for (const [propType, salePrices] of typesWithSales.entries()) {
      allSalePrices.push(...salePrices);

      const typeAvgPrice = mean(salePrices);
      const rentPrices   = rentsByAreaType.get(`${dldArea}||${propType}`) ?? [];

      let typeRent:  number | null = null;
      let typeYield: number | null = null;

      if (rentPrices.length > 0) {
        const typeAvgRent = mean(rentPrices);
        typeRent  = Math.round(typeAvgRent);
        typeYield = parseFloat(((typeAvgRent / typeAvgPrice) * 100).toFixed(1));
        allRentPrices.push(...rentPrices);
      }

      byType.push({
        type:             propType,
        avgPricePerSqft:  Math.round(typeAvgPrice),
        avgRentPerSqft:   typeRent,
        grossYieldPct:    typeYield,
      });
    }

    // Sort types: types with yield first, then alphabetically
    byType.sort((a, b) => {
      if (a.grossYieldPct !== null && b.grossYieldPct === null) return -1;
      if (a.grossYieldPct === null && b.grossYieldPct !== null) return 1;
      return a.type.localeCompare(b.type);
    });

    // Overall area averages
    const avgPrice = allSalePrices.length ? Math.round(mean(allSalePrices)) : 0;
    const avgRent  = allRentPrices.length ? Math.round(mean(allRentPrices)) : null;
    const avgYield = avgRent && avgPrice
      ? parseFloat(((avgRent / avgPrice) * 100).toFixed(1))
      : null;

    result.push({
      city,
      area,
      avgPricePerSqft:         avgPrice,
      avgAnnualRentPerSqft:    avgRent,
      avgGrossYieldPct:        avgYield,
      byType,
      avgServiceChargePerSqft: SVC_BENCHMARKS[area] ?? 12,
    });
  }

  result.sort((a, b) => a.city.localeCompare(b.city) || a.area.localeCompare(b.area));
  _cache = result;
  return _cache;
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

/** All unique property sub-types that appear across all areas (sorted) */
export function getPropertyTypes(): string[] {
  const types = new Set<string>();
  for (const area of getAllAreas()) {
    for (const t of area.byType) types.add(t.type);
  }
  return [...types].sort();
}

/** Cities that have at least one area with data for the given property type */
export function getCitiesByType(propType: string): string[] {
  const cities = new Set<string>();
  for (const area of getAllAreas()) {
    if (area.byType.some((t) => t.type === propType)) cities.add(area.city);
  }
  return [...cities].sort();
}

/** Areas within a city that have data for the given property type */
export function getAreasByTypeAndCity(propType: string, city: string): MarketArea[] {
  return getAllAreas().filter(
    (a) => a.city === city && a.byType.some((t) => t.type === propType)
  );
}
