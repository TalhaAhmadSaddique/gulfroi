"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Minus, BarChart3, Building2 } from "lucide-react";
import type { AreaTrend, QuarterlyPoint } from "@/lib/quarterly-trends.types";

// ── Helpers ────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fmtM(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

// ── Tooltip state ──────────────────────────────────────────

type TooltipState = {
  visible: boolean;
  x: number;
  y: number;
  point: QuarterlyPoint | null;
};

// ── Main Chart Component ───────────────────────────────────

export default function QuarterlyTrendChart({ trend }: { trend: AreaTrend }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible]     = useState(false);
  const [animated, setAnimated]   = useState(false);
  const [tooltip, setTooltip]     = useState<TooltipState>({ visible: false, x: 0, y: 0, point: null });

  // Intersection observer — animate in when scrolled into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          setTimeout(() => setAnimated(true), 80);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [trend.area]);

  // Reset animation when area changes
  useEffect(() => {
    setVisible(false);
    setAnimated(false);
    setTooltip({ visible: false, x: 0, y: 0, point: null });
    const t = setTimeout(() => {
      setVisible(true);
      setTimeout(() => setAnimated(true), 80);
    }, 50);
    return () => clearTimeout(t);
  }, [trend.area]);

  const { quarters } = trend;
  if (!quarters.length) return null;

  // Safe id: remove all non-alphanumeric chars to avoid breaking SVG url() references
  const safeId = trend.area.replace(/[^a-zA-Z0-9]/g, "");

  // ── SVG dimensions ────────────────────────────────────
  const W = 400;
  const H_PRICE = 130;
  const H_VOL   = 38;
  const PAD_L   = 48;
  const PAD_R   = 12;
  const PAD_T   = 12;
  const PAD_B   = 24;

  const chartW = W - PAD_L - PAD_R;
  const chartH = H_PRICE - PAD_T - PAD_B;

  const prices = quarters.map((q) => q.avgPricePerSqft);
  const maxP   = Math.max(...prices) * 1.06;
  const minP   = Math.min(...prices) * 0.94;
  const priceRange = maxP - minP || 1;

  const volumes    = quarters.map((q) => q.transactionCount);
  const maxVol     = Math.max(...volumes) || 1;

  const xStep = chartW / Math.max(quarters.length - 1, 1);

  const toX = (i: number) => PAD_L + i * xStep;
  const toY = (p: number) => PAD_T + chartH - ((p - minP) / priceRange) * chartH;

  // SVG path points
  const points = quarters.map((q, i) => ({ x: toX(i), y: toY(q.avgPricePerSqft) }));

  // Line path
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  // Area fill path
  const areaPath = [
    ...points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`),
    `L ${points[points.length - 1].x.toFixed(1)} ${(PAD_T + chartH).toFixed(1)}`,
    `L ${PAD_L.toFixed(1)} ${(PAD_T + chartH).toFixed(1)}`,
    "Z",
  ].join(" ");

  // Y-axis labels (3 ticks)
  const yTicks = [minP, minP + priceRange / 2, maxP].map((v) => ({
    val: v,
    y: toY(v),
  }));

  // Animated line length
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLen, setPathLen] = useState(0);
  useEffect(() => {
    if (pathRef.current) setPathLen(pathRef.current.getTotalLength());
  }, [trend.area, quarters.length]);

  // Stat badges
  const priceUp1Y = trend.priceChange1Y >= 0;
  const priceUpQoQ = trend.priceChangeQoQ >= 0;

  return (
    <div
      ref={containerRef}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
        marginTop: "12px",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-4 w-4 shrink-0" style={{ color: "var(--gold)" }} />
        <span className="text-sm font-bold" style={{ color: "#F0E8D8" }}>
          Price / sqft Trend
        </span>
        <span
          className="text-[10px] font-medium px-2 py-0.5 rounded-full ml-auto"
          style={{ background: "rgba(201,168,76,0.12)", color: "rgba(232,220,200,0.5)" }}
        >
          Q1 2024 – Q1 2026 · DLD Data
        </span>
      </div>

      {/* Key stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* 1Y Change */}
        <div
          className="rounded-xl px-3 py-2 text-center"
          style={{
            background: priceUp1Y ? "rgba(52,211,153,0.08)" : "rgba(239,68,68,0.08)",
            border: `1px solid ${priceUp1Y ? "rgba(52,211,153,0.25)" : "rgba(239,68,68,0.25)"}`,
          }}
        >
          <div className="flex items-center justify-center gap-1 mb-0.5">
            {priceUp1Y
              ? <TrendingUp className="h-3 w-3" style={{ color: "#6ee7b7" }} />
              : <TrendingDown className="h-3 w-3" style={{ color: "#fca5a5" }} />}
            <span
              className="text-xs font-bold"
              style={{ color: priceUp1Y ? "#6ee7b7" : "#fca5a5" }}
            >
              {priceUp1Y ? "+" : ""}{trend.priceChange1Y}%
            </span>
          </div>
          <p className="text-[10px]" style={{ color: "rgba(232,220,200,0.4)" }}>1Y Change</p>
        </div>

        {/* QoQ Change */}
        <div
          className="rounded-xl px-3 py-2 text-center"
          style={{
            background: priceUpQoQ ? "rgba(52,211,153,0.08)" : "rgba(239,68,68,0.08)",
            border: `1px solid ${priceUpQoQ ? "rgba(52,211,153,0.25)" : "rgba(239,68,68,0.25)"}`,
          }}
        >
          <div className="flex items-center justify-center gap-1 mb-0.5">
            {priceUpQoQ
              ? <TrendingUp className="h-3 w-3" style={{ color: "#6ee7b7" }} />
              : <TrendingDown className="h-3 w-3" style={{ color: "#fca5a5" }} />}
            <span
              className="text-xs font-bold"
              style={{ color: priceUpQoQ ? "#6ee7b7" : "#fca5a5" }}
            >
              {priceUpQoQ ? "+" : ""}{trend.priceChangeQoQ}%
            </span>
          </div>
          <p className="text-[10px]" style={{ color: "rgba(232,220,200,0.4)" }}>QoQ Change</p>
        </div>

        {/* Off-plan share */}
        <div
          className="rounded-xl px-3 py-2 text-center"
          style={{
            background: "rgba(201,168,76,0.08)",
            border: "1px solid rgba(201,168,76,0.2)",
          }}
        >
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Building2 className="h-3 w-3" style={{ color: "var(--gold)" }} />
            <span className="text-xs font-bold" style={{ color: "var(--gold-light)" }}>
              {trend.offPlanShare}%
            </span>
          </div>
          <p className="text-[10px]" style={{ color: "rgba(232,220,200,0.4)" }}>Off-Plan</p>
        </div>
      </div>

      {/* Price chart */}
      <div
        className="rounded-xl overflow-hidden relative"
        style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(201,168,76,0.12)" }}
        onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}
      >
        <svg
          viewBox={`0 0 ${W} ${H_PRICE}`}
          style={{ width: "100%", display: "block" }}
          role="img"
          aria-label={`Price per sqft trend for ${trend.area}`}
        >
          <defs>
            <linearGradient id={`areaFill-${safeId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="rgba(201,168,76,0.35)" />
              <stop offset="100%" stopColor="rgba(201,168,76,0)" />
            </linearGradient>
            <clipPath id={`lineClip-${safeId}`}>
              <rect
                x={PAD_L} y={PAD_T}
                width={animated ? chartW : 0}
                height={chartH + PAD_B}
                style={{ transition: "width 1.1s cubic-bezier(0.22,1,0.36,1)" }}
              />
            </clipPath>
          </defs>

          {/* Y-axis grid lines */}
          {yTicks.map((t) => (
            <g key={t.val}>
              <line
                x1={PAD_L} y1={t.y.toFixed(1)}
                x2={W - PAD_R} y2={t.y.toFixed(1)}
                stroke="rgba(255,255,255,0.06)" strokeWidth="1"
              />
              <text
                x={PAD_L - 4} y={t.y + 4}
                textAnchor="end" fontSize="8"
                fill="rgba(232,220,200,0.35)"
              >
                {Math.round(t.val).toLocaleString()}
              </text>
            </g>
          ))}

          {/* Area fill */}
          <path
            d={areaPath}
            fill={`url(#areaFill-${safeId})`}
            clipPath={`url(#lineClip-${safeId})`}
          />

          {/* Price line */}
          <path
            ref={pathRef}
            d={linePath}
            fill="none"
            stroke="var(--gold)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            clipPath={`url(#lineClip-${safeId})`}
          />

          {/* Data points + hit targets */}
          {points.map((pt, i) => {
            const q = quarters[i];
            const isLatest = i === points.length - 1;
            return (
              <g key={q.quarter}>
                {/* Hit area */}
                <rect
                  x={pt.x - xStep / 2} y={PAD_T}
                  width={xStep} height={chartH}
                  fill="transparent"
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => {
                    const rect = (e.currentTarget.closest("svg") as SVGSVGElement)
                      .getBoundingClientRect();
                    const svgW = rect.width;
                    const relX = pt.x / W;
                    setTooltip({
                      visible: true,
                      x: relX * 100,
                      y: (pt.y / H_PRICE) * 100,
                      point: q,
                    });
                  }}
                />
                {/* Dot */}
                <circle
                  cx={pt.x} cy={pt.y} r={isLatest ? 5 : 3.5}
                  fill={isLatest ? "var(--gold-light)" : "var(--gold)"}
                  stroke="rgba(7,8,9,0.8)" strokeWidth={isLatest ? 2 : 1.5}
                  style={{
                    opacity: animated ? 1 : 0,
                    transition: `opacity 0.3s ease ${0.8 + i * 0.06}s`,
                    filter: isLatest ? "drop-shadow(0 0 4px rgba(201,168,76,0.8))" : undefined,
                  }}
                />
              </g>
            );
          })}

          {/* X-axis labels */}
          {quarters.map((q, i) => {
            const showLabel = quarters.length <= 6 || i % 2 === 0 || i === quarters.length - 1;
            if (!showLabel) return null;
            return (
              <text
                key={q.quarter}
                x={toX(i)} y={H_PRICE - 4}
                textAnchor="middle" fontSize="8"
                fill="rgba(232,220,200,0.4)"
              >
                {q.quarterLabel}{String(q.year).slice(2)}
              </text>
            );
          })}
        </svg>

        {/* Tooltip */}
        {tooltip.visible && tooltip.point && (
          <div
            className="absolute pointer-events-none rounded-xl text-xs z-20"
            style={{
              left: `clamp(4px, calc(${tooltip.x}% - 70px), calc(100% - 148px))`,
              top: `clamp(4px, calc(${tooltip.y}% - 84px), calc(100% - 10px))`,
              background: "rgba(7,8,9,0.97)",
              border: "1px solid rgba(201,168,76,0.35)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
              padding: "10px 12px",
              minWidth: "140px",
            }}
          >
            <p className="font-bold mb-1.5" style={{ color: "var(--gold-light)" }}>
              {tooltip.point.quarter}
            </p>
            <div className="space-y-1" style={{ color: "rgba(232,220,200,0.75)" }}>
              <p>Avg: <span className="font-semibold" style={{ color: "#F0E8D8" }}>AED {fmt(tooltip.point.avgPricePerSqft)}/sqft</span></p>
              <p>Median: AED {fmt(tooltip.point.medianPricePerSqft)}/sqft</p>
              <p>Txns: <span className="font-semibold" style={{ color: "var(--gold-light)" }}>{tooltip.point.transactionCount}</span></p>
              <p>Vol: AED {fmtM(tooltip.point.totalValue)}</p>
              <div className="flex gap-2 pt-1" style={{ borderTop: "1px solid rgba(201,168,76,0.15)" }}>
                <span style={{ color: "#6ee7b7" }}>Ready {tooltip.point.readyCount}</span>
                <span style={{ color: "rgba(232,220,200,0.4)" }}>|</span>
                <span style={{ color: "var(--gold-light)" }}>Off-plan {tooltip.point.offPlanCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Volume bars */}
      <div
        className="rounded-xl overflow-hidden mt-2"
        style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(201,168,76,0.08)" }}
      >
        <svg
          viewBox={`0 0 ${W} ${H_VOL}`}
          style={{ width: "100%", display: "block" }}
        >
          <text x={PAD_L - 4} y={14} textAnchor="end" fontSize="8" fill="rgba(232,220,200,0.3)">Txns</text>

          {quarters.map((q, i) => {
            const barW  = xStep * 0.55;
            const barH  = ((q.transactionCount / maxVol) * (H_VOL - 16));
            const barX  = toX(i) - barW / 2;
            const barY  = H_VOL - barH - 2;
            const isLatest = i === quarters.length - 1;
            return (
              <rect
                key={q.quarter}
                x={barX.toFixed(1)} y={animated ? barY.toFixed(1) : (H_VOL - 2).toFixed(1)}
                width={barW.toFixed(1)}
                height={animated ? barH.toFixed(1) : "0"}
                rx="2"
                fill={isLatest ? "var(--gold-light)" : "rgba(201,168,76,0.45)"}
                style={{
                  transition: `height 0.7s cubic-bezier(0.22,1,0.36,1) ${0.2 + i * 0.05}s, y 0.7s cubic-bezier(0.22,1,0.36,1) ${0.2 + i * 0.05}s`,
                }}
              />
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-2 text-[10px]" style={{ color: "rgba(232,220,200,0.4)" }}>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full inline-block" style={{ background: "var(--gold)" }} />
          Avg Price/sqft
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-4 rounded inline-block" style={{ background: "rgba(201,168,76,0.45)" }} />
          Txn Volume
        </span>
        <span className="ml-auto">
          {trend.volumeTrend === "up" && <span style={{ color: "#6ee7b7" }}>↑ Volume Rising</span>}
          {trend.volumeTrend === "down" && <span style={{ color: "#fca5a5" }}>↓ Volume Falling</span>}
          {trend.volumeTrend === "stable" && <span style={{ color: "rgba(232,220,200,0.5)" }}>→ Stable Volume</span>}
        </span>
      </div>
    </div>
  );
}
