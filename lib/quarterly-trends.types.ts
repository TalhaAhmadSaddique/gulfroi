// Shared types — no Node.js imports, safe to use in both server and client components

export type QuarterKey = string; // "Q1 2024", "Q2 2024", …

export type QuarterlyPoint = {
  quarter: QuarterKey;
  quarterLabel: string;      // "Q1", "Q2", …
  year: number;
  avgPricePerSqft: number;
  medianPricePerSqft: number;
  transactionCount: number;
  totalValue: number;
  offPlanCount: number;
  readyCount: number;
  avgActualArea: number;
};

export type AreaTrend = {
  area: string;
  quarters: QuarterlyPoint[];
  priceChange1Y: number;
  priceChangeQoQ: number;
  latestAvgPrice: number;
  volumeTrend: "up" | "down" | "stable";
  offPlanShare: number;
};
