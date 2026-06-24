"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  CalculatorIcon,
  TrendingUp,
  Banknote,
  PiggyBank,
  BarChart3,
  RefreshCw,
  MapPin,
  Info,
  ArrowDownToLine,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
} from "lucide-react";
import type { MarketArea, PropTypeStats } from "@/lib/market-data";
import type { AreaTrend } from "@/lib/quarterly-trends.types";
import QuarterlyTrendChart from "@/components/QuarterlyTrendChart";

// ── Types ──────────────────────────────────────────────────

type Inputs = {
  propertySizeSqft: number;
  purchasePrice: number;
  monthlyRent: number;
  downPaymentPct: number;
  mortgageRatePct: number;
  mortgageTermYears: number;
  annualServiceCharge: number;
  otherMonthlyExpenses: number;
};

type Results = {
  grossRentalYield: number;
  netRentalYield: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  roi: number;
  cashOnCash: number;
  monthlyMortgage: number;
  totalCashInvested: number;
  annualRentalIncome: number;
  annualExpenses: number;
  netAnnualIncome: number;
  breakEvenYears: number | null;
  loanAmount: number;
};

// ── Helpers ────────────────────────────────────────────────

function calcMortgage(principal: number, annualRate: number, termYears: number): number {
  if (annualRate === 0) return principal / (termYears * 12);
  const r = annualRate / 100 / 12;
  const n = termYears * 12;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function calculate(inp: Inputs): Results {
  const annualRentalIncome = inp.monthlyRent * 12;
  const annualExpenses = inp.annualServiceCharge + inp.otherMonthlyExpenses * 12;
  const netAnnualIncome_preFinance = annualRentalIncome - annualExpenses;

  const downPayment = (inp.purchasePrice * inp.downPaymentPct) / 100;
  const loanAmount = inp.purchasePrice - downPayment;
  const monthlyMortgage = loanAmount > 0 ? calcMortgage(loanAmount, inp.mortgageRatePct, inp.mortgageTermYears) : 0;
  const annualMortgage = monthlyMortgage * 12;

  const netAnnualIncome = netAnnualIncome_preFinance - annualMortgage;
  const annualCashFlow = netAnnualIncome;
  const monthlyCashFlow = annualCashFlow / 12;

  const grossRentalYield = inp.purchasePrice > 0 ? (annualRentalIncome / inp.purchasePrice) * 100 : 0;
  const netRentalYield =
    inp.purchasePrice > 0 ? (netAnnualIncome_preFinance / inp.purchasePrice) * 100 : 0;

  const totalCashInvested = downPayment;
  const roi = inp.purchasePrice > 0 ? (netAnnualIncome_preFinance / inp.purchasePrice) * 100 : 0;
  const cashOnCash = totalCashInvested > 0 ? (annualCashFlow / totalCashInvested) * 100 : 0;
  const breakEvenYears = annualCashFlow > 0 ? totalCashInvested / annualCashFlow : null;

  return {
    grossRentalYield, netRentalYield, monthlyCashFlow, annualCashFlow,
    roi, cashOnCash, monthlyMortgage, totalCashInvested,
    annualRentalIncome, annualExpenses, netAnnualIncome, breakEvenYears, loanAmount,
  };
}

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}
function fmtAed(n: number): string { return `AED ${fmt(Math.abs(n))}`; }
function fmtPct(n: number): string { return `${fmt(n, 2)}%`; }

// ── Animated counter hook ──────────────────────────────────

function useCountUp(target: number, duration = 1200, trigger: boolean): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const prevTarget = useRef<number>(0);

  useEffect(() => {
    if (!trigger) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const from = prevTarget.current;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(from + (target - from) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
      else prevTarget.current = target;
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, trigger]);

  return value;
}

// ── Projection Chart ───────────────────────────────────────

function ProjectionChart({ results, purchasePrice }: { results: Results; purchasePrice: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const years = 10;
  const appreciationRate = 0.05; // 5% per year capital appreciation assumption
  const data = Array.from({ length: years }, (_, i) => {
    const yr = i + 1;
    const cumulativeCashFlow = results.annualCashFlow * yr;
    const appreciation = purchasePrice * (Math.pow(1 + appreciationRate, yr) - 1);
    const totalReturn = cumulativeCashFlow + appreciation;
    return { yr, cashFlow: cumulativeCashFlow, appreciation, totalReturn };
  });

  const maxVal = Math.max(...data.map((d) => Math.max(d.totalReturn, 0)));
  const minVal = Math.min(...data.map((d) => Math.min(d.totalReturn, 0)));
  const range = maxVal - minVal || 1;
  const chartH = 120;

  return (
    <div ref={ref} className="glass-card p-5 mt-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5" style={{ color: "var(--gold)" }} />
        <h2 className="font-bold" style={{ color: "#F0E8D8" }}>10-Year Return Projection</h2>
        <span className="text-xs ml-auto px-2 py-0.5 rounded-full" style={{ background: "rgba(201,168,76,0.12)", color: "rgba(232,220,200,0.5)" }}>
          Incl. 5% annual appreciation
        </span>
      </div>

      <div className="flex items-end gap-1.5 h-[140px] px-2 relative">
        {/* Zero line */}
        {minVal < 0 && (
          <div
            className="absolute inset-x-2 h-px"
            style={{
              bottom: `${((0 - minVal) / range) * chartH}px`,
              background: "rgba(255,255,255,0.1)",
            }}
          />
        )}
        {data.map((d, i) => {
          const heightPct = (Math.abs(d.totalReturn) / range) * chartH;
          const isPositive = d.totalReturn >= 0;
          return (
            <div key={d.yr} className="flex-1 flex flex-col items-center justify-end gap-1">
              <div
                className="w-full rounded-t-md relative group"
                style={{
                  height: `${heightPct}px`,
                  background: isPositive
                    ? "linear-gradient(to top, var(--gold-dark), var(--gold-light))"
                    : "linear-gradient(to top, #7f1d1d, #ef4444)",
                  transformOrigin: "bottom",
                  transform: visible ? "scaleY(1)" : "scaleY(0)",
                  transition: `transform 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 60}ms`,
                  minHeight: "2px",
                  boxShadow: isPositive ? "0 0 10px rgba(201,168,76,0.35)" : undefined,
                  cursor: "pointer",
                }}
              >
                {/* Tooltip */}
                <div
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 text-xs rounded-lg px-3 py-2 whitespace-nowrap pointer-events-none"
                  style={{
                    background: "rgba(10,11,14,0.97)",
                    border: "1px solid rgba(201,168,76,0.3)",
                    color: "#E8DCC8",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                  }}
                >
                  <p className="font-semibold mb-0.5" style={{ color: "var(--gold-light)" }}>Year {d.yr}</p>
                  <p>Cash Flow: {d.cashFlow >= 0 ? "+" : "−"}AED {fmt(Math.abs(d.cashFlow))}</p>
                  <p>Appreciation: +AED {fmt(d.appreciation)}</p>
                  <p className="mt-0.5 font-bold" style={{ color: isPositive ? "var(--gold-light)" : "#f87171" }}>
                    Total: {d.totalReturn >= 0 ? "+" : "−"}AED {fmt(Math.abs(d.totalReturn))}
                  </p>
                </div>
              </div>
              <span className="text-[10px]" style={{ color: "rgba(232,220,200,0.4)" }}>Y{d.yr}</span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: "rgba(232,220,200,0.5)" }}>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm" style={{ background: "var(--gold)" }} />
          Cumulative Return (Cash Flow + Appreciation)
        </div>
      </div>
    </div>
  );
}

// ── Slider Input ───────────────────────────────────────────

function SliderInput({
  value,
  onChange,
  min,
  max,
  step,
  prefix,
  suffix,
  format,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix?: string;
  format?: (v: number) => string;
}) {
  const displayVal = format ? format(value) : value.toString();
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold" style={{ color: "var(--gold-light)" }}>
          {prefix && <span style={{ color: "rgba(232,220,200,0.5)", fontSize: "11px", marginRight: "4px" }}>{prefix}</span>}
          {displayVal}
          {suffix && <span style={{ color: "rgba(232,220,200,0.5)", fontSize: "11px", marginLeft: "2px" }}>{suffix}</span>}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          background: `linear-gradient(to right, var(--gold) 0%, var(--gold) ${((value - min) / (max - min)) * 100}%, rgba(201,168,76,0.18) ${((value - min) / (max - min)) * 100}%, rgba(201,168,76,0.18) 100%)`,
        }}
      />
      <div className="flex justify-between text-[10px] mt-1" style={{ color: "rgba(232,220,200,0.3)" }}>
        <span>{prefix}{min.toLocaleString()}{suffix}</span>
        <span>{prefix}{max.toLocaleString()}{suffix}</span>
      </div>
    </div>
  );
}

// ── Label ──────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
      style={{ color: "rgba(232,220,200,0.5)" }}>
      {children}
    </label>
  );
}

// ── MetricCard ─────────────────────────────────────────────

function MetricCard({
  label, value, sub, highlight, large, tooltip, animated,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: "green" | "amber" | "red" | "gold" | "default";
  large?: boolean;
  tooltip?: string;
  animated?: boolean;
}) {
  const styles: Record<string, { border: string; bg: string; text: string }> = {
    green:   { border: "rgba(52,211,153,0.3)",  bg: "rgba(52,211,153,0.08)",  text: "#6ee7b7" },
    amber:   { border: "rgba(251,191,36,0.3)",  bg: "rgba(251,191,36,0.08)",  text: "#fcd34d" },
    red:     { border: "rgba(239,68,68,0.3)",   bg: "rgba(239,68,68,0.08)",   text: "#fca5a5" },
    gold:    { border: "rgba(201,168,76,0.4)",  bg: "rgba(201,168,76,0.1)",   text: "var(--gold-light)" },
    default: { border: "rgba(255,255,255,0.08)", bg: "rgba(255,255,255,0.04)", text: "#E8DCC8" },
  };
  const s = styles[highlight ?? "default"];

  return (
    <div
      className={`rounded-xl p-4 ${animated ? "animate-count-reveal" : ""}`}
      style={{ border: `1px solid ${s.border}`, background: s.bg }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(232,220,200,0.45)" }}>{label}</p>
        {tooltip && (
          <div className="group relative">
            <Info className="h-3 w-3 cursor-help" style={{ color: "rgba(232,220,200,0.3)" }} />
            <div
              className="hidden group-hover:block absolute bottom-5 left-0 z-20 w-52 text-xs rounded-xl p-3"
              style={{ background: "rgba(7,8,9,0.98)", border: "1px solid rgba(201,168,76,0.25)", color: "#E8DCC8", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}
            >
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <p className={`font-bold ${large ? "text-2xl" : "text-xl"}`} style={{ color: s.text }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: "rgba(232,220,200,0.4)" }}>{sub}</p>}
    </div>
  );
}

// ── Animated Metric (count-up) ─────────────────────────────

function AnimatedPct({ value, trigger, ...rest }: { value: number; trigger: boolean } & Omit<Parameters<typeof MetricCard>[0], "value">) {
  const c = useCountUp(value, 1000, trigger);
  return <MetricCard value={fmtPct(c)} animated={trigger} {...rest} />;
}

function AnimatedAed({ value, trigger, ...rest }: { value: number; trigger: boolean } & Omit<Parameters<typeof MetricCard>[0], "value">) {
  const c = useCountUp(value, 1000, trigger);
  return <MetricCard value={fmtAed(c)} animated={trigger} {...rest} />;
}

// ── Section card wrapper ───────────────────────────────────

function SectionCard({ children, icon, title, iconColor = "var(--gold)" }: {
  children: React.ReactNode;
  icon: React.ReactNode;
  title: string;
  iconColor?: string;
}) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)" }}
        >
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
        <h2 className="font-bold" style={{ color: "#F0E8D8" }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────

export default function UAECalculator({
  areas,
  propTypes,
  trends = {},
}: {
  areas: MarketArea[];
  propTypes: string[];
  trends?: Record<string, AreaTrend>;
}) {
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [results, setResults] = useState<Results | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [resultKey, setResultKey] = useState(0);

  const [inp, setInp] = useState<Inputs>({
    propertySizeSqft: 1000,
    purchasePrice: 1500000,
    monthlyRent: 8000,
    downPaymentPct: 20,
    mortgageRatePct: 4.5,
    mortgageTermYears: 25,
    annualServiceCharge: 15000,
    otherMonthlyExpenses: 500,
  });

  // Derived options based on upstream selections
  const cityOptions = useMemo(() => {
    if (!selectedType) return [];
    return [...new Set(
      areas.filter((a) => a.byType.some((t) => t.type === selectedType)).map((a) => a.city)
    )].sort();
  }, [areas, selectedType]);

  const areaOptions = useMemo(() => {
    if (!selectedType || !selectedCity) return [];
    return areas.filter(
      (a) => a.city === selectedCity && a.byType.some((t) => t.type === selectedType)
    );
  }, [areas, selectedType, selectedCity]);

  const currentArea = useMemo(
    () => areas.find((a) => a.city === selectedCity && a.area === selectedArea),
    [areas, selectedCity, selectedArea]
  );

  // The active PropTypeStats for the selected type within the current area
  const activeTypeStats = useMemo(
    () => currentArea?.byType.find((t) => t.type === selectedType) ?? null,
    [currentArea, selectedType]
  );

  const set = useCallback((key: keyof Inputs) => (v: number) => {
    setInp((prev) => ({ ...prev, [key]: v }));
    if (results) setIsStale(true);
  }, [results]);

  const autoFill = useCallback((m: MarketArea, typeStats: typeof activeTypeStats, sqft: number) => {
    const price = Math.round((typeStats?.avgPricePerSqft ?? m.avgPricePerSqft) * sqft);
    const rentPerSqft = typeStats?.avgRentPerSqft ?? m.avgAnnualRentPerSqft;
    const rent  = rentPerSqft ? Math.round((rentPerSqft * sqft) / 12) : 0;
    const svc   = Math.round(m.avgServiceChargePerSqft * sqft);
    setInp((prev) => ({ ...prev, purchasePrice: price, monthlyRent: rent, annualServiceCharge: svc }));
  }, []);

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setSelectedCity("");
    setSelectedArea("");
    if (results) setIsStale(true);
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSelectedArea("");
    if (results) setIsStale(true);
  };

  const handleAreaChange = (areaName: string) => {
    setSelectedArea(areaName);
    const m = areas.find((a) => a.city === selectedCity && a.area === areaName);
    if (m && inp.propertySizeSqft > 0) {
      const tStats = m.byType.find((t) => t.type === selectedType) ?? null;
      autoFill(m, tStats, inp.propertySizeSqft);
    }
    if (results) setIsStale(true);
  };

  const handleCalculate = () => {
    setResults(calculate(inp));
    setIsStale(false);
    setResultKey((k) => k + 1);
  };

  const cashFlowPos = results ? results.monthlyCashFlow >= 0 : true;
  const triggerAnim = resultKey > 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Page Header */}
      <div className="mb-10 text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-4"
          style={{
            background: "rgba(201,168,76,0.12)",
            border: "1px solid rgba(201,168,76,0.3)",
            color: "var(--gold-light)",
          }}
        >
          <CalculatorIcon className="h-4 w-4" />
          Dubai Real Estate ROI Calculator
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2" style={{ color: "#F0E8D8" }}>
          Analyse Any Dubai Property in Seconds
        </h1>
        <p className="max-w-xl mx-auto" style={{ color: "rgba(232,220,200,0.5)" }}>
          Select a Dubai area to auto-fill market benchmarks from DLD data, then customise with your actual deal terms.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── LEFT PANEL: Inputs ── */}
        <div className="w-full lg:w-2/5 space-y-4">

          {/* Area Selection */}
          <SectionCard icon={<MapPin className="h-4 w-4" />} title="Area Selection">
            <div className="space-y-3">

              {/* Step 1 — Property Type */}
              <div>
                <Label>Property Type</Label>
                <select
                  value={selectedType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="dark-select w-full h-10 px-3 text-sm"
                >
                  <option value="">Select property type…</option>
                  {propTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Step 2 — City (filtered by type) */}
              {selectedType && (
                <div>
                  <Label>City / Emirate</Label>
                  <select
                    value={selectedCity}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="dark-select w-full h-10 px-3 text-sm"
                  >
                    <option value="">Select a city…</option>
                    {cityOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              {/* Step 3 — Area (filtered by type + city) */}
              {selectedType && selectedCity && (
                <div>
                  <Label>Neighbourhood / Area</Label>
                  <select
                    value={selectedArea}
                    onChange={(e) => handleAreaChange(e.target.value)}
                    className="dark-select w-full h-10 px-3 text-sm"
                  >
                    <option value="">Select an area…</option>
                    {areaOptions.map((a) => (
                      <option key={a.area} value={a.area}>{a.area}</option>
                    ))}
                  </select>
                  {activeTypeStats?.grossYieldPct === null && selectedArea && (
                    <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "rgba(232,220,200,0.4)" }}>
                      <Info className="h-3 w-3 flex-shrink-0" />
                      No rental data for this type — enter rent manually
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Market Snapshot */}
            {currentArea && (() => {
              const displayPrice = activeTypeStats?.avgPricePerSqft ?? currentArea.avgPricePerSqft;
              const displayRent  = activeTypeStats?.avgRentPerSqft  ?? currentArea.avgAnnualRentPerSqft;
              const displayYield = activeTypeStats?.grossYieldPct   ?? currentArea.avgGrossYieldPct;
              const snapshotLabel = activeTypeStats
                ? `${activeTypeStats.type} · ${currentArea.area}`
                : currentArea.area;

              return (
                <div
                  className="mt-4 rounded-xl p-4 space-y-2 text-sm"
                  style={{ background: "rgba(201,168,76,0.07)", border: "1px solid rgba(201,168,76,0.2)" }}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <BarChart3 className="h-4 w-4" style={{ color: "var(--gold)" }} />
                    <span className="font-semibold" style={{ color: "var(--gold-light)" }}>
                      Market Snapshot — {snapshotLabel}
                    </span>
                  </div>
                  {[
                    { label: "Avg. Price",        value: `AED ${fmt(displayPrice)} /sqft` },
                    { label: "Avg. Annual Rent",   value: displayRent  ? `AED ${fmt(displayRent)} /sqft` : "—" },
                    { label: "Gross Yield",        value: displayYield !== null ? `${displayYield}%`     : "—" },
                    { label: "Service Charge",     value: `AED ${fmt(currentArea.avgServiceChargePerSqft)} /sqft/yr` },
                    { label: "Property Types",     value: currentArea.byType.map((t) => t.type).join(", ") },
                  ].map((r) => (
                    <div key={r.label} className="flex items-center justify-between">
                      <span style={{ color: "rgba(232,220,200,0.5)" }}>{r.label}</span>
                      <span className="font-semibold" style={{ color: r.value === "—" ? "rgba(232,220,200,0.3)" : "var(--gold-light)" }}>
                        {r.value}
                      </span>
                    </div>
                  ))}
                  <div className="pt-1 border-t flex items-center gap-1 text-xs" style={{ borderColor: "rgba(201,168,76,0.15)", color: "rgba(232,220,200,0.4)" }}>
                    <ArrowDownToLine className="h-3 w-3" />
                    {activeTypeStats
                      ? `Inputs auto-filled from ${activeTypeStats.type} averages`
                      : "Inputs auto-filled from area averages"}
                  </div>
                </div>
              );
            })()}
          </SectionCard>

          {/* ── Quarterly Trend Chart ── */}
          {currentArea && trends[currentArea.area] && (
            <div
              className="glass-card px-5 pt-4 pb-5"
              style={{ borderColor: "rgba(201,168,76,0.15)" }}
            >
              <QuarterlyTrendChart trend={trends[currentArea.area]} />
            </div>
          )}

          {/* Property Details */}
          <SectionCard icon={<Banknote className="h-4 w-4" />} title="Property Details">
            <div className="space-y-5">
              <div>
                <Label>Property Size</Label>
                <SliderInput
                  value={inp.propertySizeSqft}
                  onChange={set("propertySizeSqft")}
                  min={300} max={5000} step={50}
                  suffix=" sqft"
                  format={(v) => v.toLocaleString()}
                />
              </div>
              <div>
                <Label>Purchase Price</Label>
                <SliderInput
                  value={inp.purchasePrice}
                  onChange={set("purchasePrice")}
                  min={300000} max={10000000} step={50000}
                  prefix="AED "
                  format={(v) => v.toLocaleString()}
                />
              </div>
              <div>
                <Label>Expected Monthly Rent</Label>
                <SliderInput
                  value={inp.monthlyRent}
                  onChange={set("monthlyRent")}
                  min={1000} max={80000} step={500}
                  prefix="AED "
                  format={(v) => v.toLocaleString()}
                />
              </div>
            </div>
          </SectionCard>

          {/* Financing */}
          <SectionCard icon={<PiggyBank className="h-4 w-4" />} title="Financing">
            <div className="space-y-5">
              <div>
                <Label>Down Payment</Label>
                <SliderInput
                  value={inp.downPaymentPct}
                  onChange={set("downPaymentPct")}
                  min={10} max={100} step={5}
                  suffix="%"
                  format={(v) => v.toString()}
                />
                <p className="text-xs mt-1" style={{ color: "rgba(232,220,200,0.35)" }}>
                  = AED {fmt((inp.purchasePrice * inp.downPaymentPct) / 100)}
                </p>
              </div>
              <div>
                <Label>Mortgage Interest Rate</Label>
                <SliderInput
                  value={inp.mortgageRatePct}
                  onChange={set("mortgageRatePct")}
                  min={1} max={12} step={0.25}
                  suffix="% / yr"
                  format={(v) => v.toFixed(2)}
                />
              </div>
              <div>
                <Label>Mortgage Term</Label>
                <SliderInput
                  value={inp.mortgageTermYears}
                  onChange={set("mortgageTermYears")}
                  min={5} max={30} step={1}
                  suffix=" yrs"
                  format={(v) => v.toString()}
                />
              </div>
            </div>
          </SectionCard>

          {/* Expenses */}
          <SectionCard icon={<TrendingUp className="h-4 w-4" />} title="Annual Expenses">
            <div className="space-y-5">
              <div>
                <Label>Annual Service Charge</Label>
                <SliderInput
                  value={inp.annualServiceCharge}
                  onChange={set("annualServiceCharge")}
                  min={0} max={80000} step={1000}
                  prefix="AED "
                  format={(v) => v.toLocaleString()}
                />
              </div>
              <div>
                <Label>Other Monthly Expenses</Label>
                <SliderInput
                  value={inp.otherMonthlyExpenses}
                  onChange={set("otherMonthlyExpenses")}
                  min={0} max={5000} step={100}
                  prefix="AED "
                  format={(v) => v.toLocaleString()}
                />
                <p className="text-xs mt-1" style={{ color: "rgba(232,220,200,0.35)" }}>
                  Management, maintenance, insurance, etc.
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Calculate Button */}
          <button
            onClick={handleCalculate}
            className="btn-gold w-full h-14 flex items-center justify-center gap-2 text-base rounded-2xl"
            style={{ fontSize: "16px" }}
          >
            {isStale ? (
              <><RefreshCw className="h-5 w-5" /> Recalculate ROI</>
            ) : (
              <><CalculatorIcon className="h-5 w-5" /> Calculate ROI</>
            )}
          </button>
        </div>

        {/* ── RIGHT PANEL: Results ── */}
        <div className="w-full lg:flex-1 space-y-4">
          {isStale && results && (
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
              style={{
                background: "rgba(251,191,36,0.08)",
                border: "1px solid rgba(251,191,36,0.25)",
                color: "#fcd34d",
              }}
            >
              <RefreshCw className="h-4 w-4 shrink-0" />
              Inputs changed — click <strong className="mx-1">Recalculate</strong> to update.
            </div>
          )}

          {!results && (
            <div
              className="h-64 flex flex-col items-center justify-center rounded-2xl text-center px-6"
              style={{
                border: "2px dashed rgba(201,168,76,0.2)",
                background: "rgba(201,168,76,0.03)",
              }}
            >
              <CalculatorIcon className="h-12 w-12 mb-3" style={{ color: "rgba(201,168,76,0.25)" }} />
              <p className="font-semibold text-base" style={{ color: "rgba(232,220,200,0.4)" }}>
                Select an area and click Calculate
              </p>
              <p className="text-sm mt-1" style={{ color: "rgba(232,220,200,0.25)" }}>
                Your full investment analysis will appear here.
              </p>
            </div>
          )}

          {results && (
            <div key={resultKey}>
              {/* Monthly Cash Flow — Hero metric */}
              <div
                className="rounded-2xl p-5 mb-4"
                style={{
                  background: cashFlowPos
                    ? "linear-gradient(135deg, rgba(52,211,153,0.08), rgba(52,211,153,0.04))"
                    : "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.04))",
                  border: cashFlowPos
                    ? "1px solid rgba(52,211,153,0.3)"
                    : "1px solid rgba(239,68,68,0.3)",
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(232,220,200,0.45)" }}>
                    Monthly Cash Flow
                  </span>
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{
                      background: cashFlowPos ? "rgba(52,211,153,0.2)" : "rgba(239,68,68,0.2)",
                      color: cashFlowPos ? "#6ee7b7" : "#fca5a5",
                    }}
                  >
                    {cashFlowPos ? "● POSITIVE" : "● NEGATIVE"}
                  </span>
                </div>
                <div
                  className="text-4xl font-extrabold animate-count-reveal"
                  style={{ color: cashFlowPos ? "#6ee7b7" : "#fca5a5" }}
                >
                  {cashFlowPos ? "+" : "−"}{fmtAed(results.monthlyCashFlow)}
                  <span className="text-base font-medium ml-1" style={{ color: "rgba(232,220,200,0.4)" }}>/month</span>
                </div>
                <p className="text-sm mt-1" style={{ color: "rgba(232,220,200,0.4)" }}>
                  Annual: {cashFlowPos ? "+" : "−"}{fmtAed(results.annualCashFlow)}
                </p>
              </div>

              {/* Return Metrics */}
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5" style={{ color: "var(--gold)" }} />
                  <h2 className="font-bold" style={{ color: "#F0E8D8" }}>Return Metrics</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <AnimatedPct
                    value={results.grossRentalYield}
                    trigger={triggerAnim}
                    label="Gross Rental Yield"
                    sub="Annual rent ÷ Price"
                    highlight={results.grossRentalYield >= 6 ? "green" : results.grossRentalYield >= 4 ? "gold" : "amber"}
                    tooltip="Annual rent divided by purchase price × 100"
                    large
                  />
                  <AnimatedPct
                    value={results.netRentalYield}
                    trigger={triggerAnim}
                    label="Net Rental Yield"
                    sub="After service + expenses"
                    highlight={results.netRentalYield >= 5 ? "green" : results.netRentalYield >= 3 ? "gold" : "amber"}
                    tooltip="(Annual rent - expenses) ÷ Purchase price × 100"
                    large
                  />
                  <AnimatedPct
                    value={results.roi}
                    trigger={triggerAnim}
                    label="ROI"
                    sub="Return on Investment"
                    highlight={results.roi >= 5 ? "green" : results.roi >= 3 ? "gold" : "amber"}
                    tooltip="Net income before financing ÷ purchase price × 100"
                  />
                  <AnimatedPct
                    value={results.cashOnCash}
                    trigger={triggerAnim}
                    label="Cash-on-Cash Return"
                    sub="On cash invested"
                    highlight={results.cashOnCash >= 5 ? "green" : results.cashOnCash >= 0 ? "gold" : "red"}
                    tooltip="Annual cash flow ÷ down payment × 100"
                  />
                </div>
              </div>

              {/* Income & Expense Breakdown */}
              <div className="glass-card p-5 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Banknote className="h-5 w-5" style={{ color: "var(--gold)" }} />
                  <h2 className="font-bold" style={{ color: "#F0E8D8" }}>Annual Income & Expense Breakdown</h2>
                </div>
                <div className="space-y-1 text-sm">
                  {[
                    {
                      label: "Gross Rental Income",
                      value: `+${fmtAed(results.annualRentalIncome)}`,
                      color: "#6ee7b7",
                      barColor: "rgba(52,211,153,0.5)",
                      pct: 100,
                    },
                    {
                      label: "Annual Expenses",
                      value: `−${fmtAed(results.annualExpenses)}`,
                      color: "#fca5a5",
                      barColor: "rgba(239,68,68,0.4)",
                      pct: Math.min((results.annualExpenses / results.annualRentalIncome) * 100, 100),
                    },
                    {
                      label: "Annual Mortgage",
                      value: `−${fmtAed(results.monthlyMortgage * 12)}`,
                      color: "#fca5a5",
                      barColor: "rgba(239,68,68,0.4)",
                      pct: Math.min(((results.monthlyMortgage * 12) / results.annualRentalIncome) * 100, 100),
                    },
                  ].map((row) => (
                    <div key={row.label} className="py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="flex justify-between mb-1.5">
                        <span style={{ color: "rgba(232,220,200,0.55)" }}>{row.label}</span>
                        <span className="font-semibold" style={{ color: row.color }}>{row.value}</span>
                      </div>
                      <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <div
                          className="h-1 rounded-full transition-all duration-1000"
                          style={{ width: `${row.pct}%`, background: row.barColor }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between py-3">
                    <span className="font-bold" style={{ color: "#F0E8D8" }}>Net Annual Income</span>
                    <span
                      className="font-extrabold text-base"
                      style={{ color: results.netAnnualIncome >= 0 ? "#6ee7b7" : "#fca5a5" }}
                    >
                      {results.netAnnualIncome >= 0 ? "+" : "−"}{fmtAed(results.netAnnualIncome)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Investment Summary */}
              <div className="glass-card p-5 mt-4">
                <div className="flex items-center gap-2 mb-4">
                  <PiggyBank className="h-5 w-5" style={{ color: "var(--gold)" }} />
                  <h2 className="font-bold" style={{ color: "#F0E8D8" }}>Investment Summary</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <AnimatedAed
                    value={results.totalCashInvested}
                    trigger={triggerAnim}
                    label="Total Cash Invested"
                    sub="Down payment"
                    highlight="gold"
                  />
                  <AnimatedAed
                    value={results.loanAmount}
                    trigger={triggerAnim}
                    label="Loan Amount"
                    sub={`Over ${inp.mortgageTermYears} years`}
                    highlight="default"
                  />
                  <AnimatedAed
                    value={results.monthlyMortgage}
                    trigger={triggerAnim}
                    label="Monthly Mortgage"
                    sub={`${inp.mortgageRatePct}% p.a.`}
                    highlight="default"
                  />
                  <MetricCard
                    label="Break-Even Period"
                    value={results.breakEvenYears !== null ? `${results.breakEvenYears.toFixed(1)} yrs` : "N/A"}
                    sub={results.breakEvenYears !== null ? "To recover cash invested" : "Cash flow negative"}
                    highlight={results.breakEvenYears !== null && results.breakEvenYears <= 15 ? "green" : "amber"}
                    animated
                  />
                </div>
              </div>

              {/* Market Comparison */}
              {currentArea && (
                <div
                  className="rounded-2xl p-5 mt-4"
                  style={{
                    background: "rgba(7,8,9,0.8)",
                    border: "1px solid rgba(201,168,76,0.25)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-5 w-5" style={{ color: "var(--gold)" }} />
                    <h2 className="font-bold" style={{ color: "#F0E8D8" }}>vs. {currentArea.area} Market Average</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        label: "Your Gross Yield",
                        yours: results.grossRentalYield,
                        market: activeTypeStats?.grossYieldPct ?? currentArea.avgGrossYieldPct,
                        fmtFn: (v: number | null) => v != null ? fmtPct(v) : "—",
                        lowerBetter: false,
                      },
                      {
                        label: "Price per Sqft",
                        yours: inp.propertySizeSqft > 0 ? inp.purchasePrice / inp.propertySizeSqft : 0,
                        market: activeTypeStats?.avgPricePerSqft ?? currentArea.avgPricePerSqft,
                        fmtFn: (v: number | null) => v != null ? `AED ${fmt(v, 0)}` : "—",
                        lowerBetter: true,
                      },
                    ].map((r) => {
                      const diff = r.market != null ? r.yours - r.market : 0;
                      const better = r.lowerBetter ? diff < 0 : diff > 0;
                      return (
                        <div
                          key={r.label}
                          className="rounded-xl p-3"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                        >
                          <p className="text-xs mb-1" style={{ color: "rgba(232,220,200,0.4)" }}>{r.label}</p>
                          <p className="text-xl font-extrabold" style={{ color: "#F0E8D8" }}>{r.fmtFn(r.yours)}</p>
                          <p className="text-xs mt-1" style={{ color: "rgba(232,220,200,0.35)" }}>Market avg: {r.fmtFn(r.market)}</p>
                          <div
                            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              background: better ? "rgba(52,211,153,0.12)" : "rgba(251,191,36,0.12)",
                              color: better ? "#6ee7b7" : "#fcd34d",
                            }}
                          >
                            {better
                              ? <CheckCircle2 className="h-3 w-3" />
                              : <AlertCircle className="h-3 w-3" />}
                            {better ? "Better than avg" : "Above market avg"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 10-Year Projection Chart */}
              <ProjectionChart results={results} purchasePrice={inp.purchasePrice} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
