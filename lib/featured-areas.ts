import { getAllAreas, type MarketArea } from "./market-data";

export function getFeaturedAreas(limit = 8): MarketArea[] {
  return [...getAllAreas()]
    .sort(
      (a, b) =>
        sumTx(b) - sumTx(a) ||
        (b.avgGrossYieldPct ?? 0) - (a.avgGrossYieldPct ?? 0)
    )
    .slice(0, limit);
}

export function getDubaiMarketStats() {
  const areas = getAllAreas();
  const withYield = areas.filter((a) => a.avgGrossYieldPct != null);
  const yields = withYield
    .map((a) => a.avgGrossYieldPct as number)
    .filter((y) => y >= 3 && y <= 15);

  return {
    areaCount: areas.length,
    withYieldCount: withYield.length,
    yieldMin: yields.length ? Math.min(...yields) : null,
    yieldMax: yields.length ? Math.max(...yields) : null,
    totalTransactions: areas.reduce((n, a) => n + sumTx(a), 0),
  };
}

function sumTx(area: MarketArea): number {
  return area.byType.reduce((n, t) => n + (t.transactions ?? 0), 0);
}
