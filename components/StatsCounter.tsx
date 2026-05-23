"use client";

import { useEffect, useRef, useState } from "react";

function useCountUp(target: number, duration = 1400, trigger: boolean) {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!trigger) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration, trigger]);

  return value;
}

type Stat = { value: string; numericValue?: number; suffix?: string; label: string };

export default function StatsCounter({ stats }: { stats: Stat[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setTriggered(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
      {stats.map((s, i) => (
        <StatItem key={s.label} stat={s} triggered={triggered} delay={i * 120} />
      ))}
    </div>
  );
}

function StatItem({ stat, triggered, delay }: { stat: Stat; triggered: boolean; delay: number }) {
  const count = useCountUp(stat.numericValue ?? 0, 1400, triggered);
  const display = stat.numericValue != null
    ? `${Math.round(count)}${stat.suffix ?? ""}`
    : stat.value;

  return (
    <div
      className="glass-card p-4 text-center"
      style={{
        opacity: triggered ? 1 : 0,
        transform: triggered ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      <div className="text-2xl font-extrabold gold-text">{display}</div>
      <div className="text-xs mt-0.5" style={{ color: "rgba(232,220,200,0.5)" }}>{stat.label}</div>
    </div>
  );
}
