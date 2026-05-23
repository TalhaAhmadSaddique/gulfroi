import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";
import StatsCounter from "@/components/StatsCounter";
import {
  CalculatorIcon,
  TrendingUp,
  MapPin,
  BarChart3,
  Banknote,
  ArrowRight,
  CheckCircle2,
  Building2,
  Users,
  Briefcase,
  Globe2,
  ChevronRight,
  Zap,
  Shield,
  Clock,
} from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "Complete ROI Breakdown",
    desc: "Gross yield, net yield, cash-on-cash return, and ROI — all computed from a single property input.",
  },
  {
    icon: MapPin,
    title: "Area-Level Market Data",
    desc: "60+ UAE areas across all 7 emirates. Average price/sqft, rental rates, and yields by neighbourhood.",
  },
  {
    icon: Banknote,
    title: "Mortgage & Cash Flow",
    desc: "Monthly mortgage, net cash flow, and break-even period — with your actual financing terms.",
  },
  {
    icon: BarChart3,
    title: "Market Comparison",
    desc: "See how your target property stacks up against neighbourhood averages and UAE benchmarks.",
  },
];

const steps = [
  {
    step: "01",
    title: "Select Your Area",
    desc: "Choose from 60+ areas across Dubai, Abu Dhabi, Sharjah, and beyond. Market data auto-populates.",
  },
  {
    step: "02",
    title: "Enter Property Details",
    desc: "Add price, size, financing terms, and expenses. Our defaults are pre-filled from area averages.",
  },
  {
    step: "03",
    title: "Analyse & Decide",
    desc: "Get a full investment breakdown — yield, cash flow, mortgage, and ROI — in under 10 seconds.",
  },
];

const userTypes = [
  {
    icon: Building2,
    title: "Individual Investors",
    points: [
      "Compare areas before committing capital",
      "Model different down payment scenarios",
      "Understand true net yield after costs",
    ],
  },
  {
    icon: Users,
    title: "Real Estate Agents",
    points: [
      "Qualify clients with data-driven ROI",
      "Present investment cases in minutes",
      "Compare multiple properties side-by-side",
    ],
  },
  {
    icon: Briefcase,
    title: "Property Developers",
    points: [
      "Benchmark yields against competition",
      "Validate pricing for investor decks",
      "Model absorption rates by area",
    ],
  },
  {
    icon: Globe2,
    title: "Expats & NRIs",
    points: [
      "Understand UAE market before relocating",
      "Calculate returns in AED vs home currency",
      "Evaluate buy vs. rent decisions",
    ],
  },
];

const trustPoints = [
  { icon: Zap, title: "Instant Results", desc: "No loading, no waiting. Calculations happen in real time." },
  { icon: Shield, title: "No Signup Required", desc: "100% free. Open the calculator and start immediately." },
  { icon: Clock, title: "Always Up to Date", desc: "Market data refreshed regularly from UAE property sources." },
];

const stats = [
  { value: "60+", numericValue: 60, suffix: "+", label: "UAE Areas Covered" },
  { value: "7", numericValue: 7, suffix: "", label: "Emirates Included" },
  { value: "10+", numericValue: 10, suffix: "+", label: "Metrics Calculated" },
  { value: "Free", label: "No Signup Needed" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#070809" }}>
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ background: "#070809" }}>
        {/* Background layers */}
        <div className="absolute inset-0">
          {/* City glow at bottom */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[300px] rounded-full blur-3xl"
            style={{ background: "radial-gradient(ellipse, rgba(201,168,76,0.18) 0%, transparent 70%)" }} />
          {/* Top vignette */}
          <div className="absolute top-0 inset-x-0 h-40"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)" }} />
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "linear-gradient(rgba(201,168,76,1) 1px, transparent 1px), linear-gradient(to right, rgba(201,168,76,1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }} />
          {/* Dubai skyline silhouette SVG */}
          <svg className="absolute bottom-0 inset-x-0 w-full" viewBox="0 0 1440 220" preserveAspectRatio="xMidYMax slice" style={{ opacity: 0.12 }}>
            <path fill="rgba(201,168,76,0.8)" d="
              M0,220 L0,160 L40,160 L40,140 L55,140 L55,120 L70,120 L70,80 L80,80 L80,60 L90,60
              L90,40 L95,40 L95,20 L100,20 L100,40 L105,40 L105,60 L110,60 L110,80 L120,80 L120,120
              L130,120 L130,100 L140,100 L140,80 L148,80 L148,50 L153,50 L153,30 L158,30 L158,50
              L163,50 L163,80 L170,80 L170,100 L180,100 L180,140 L200,140 L200,120 L210,120
              L210,90 L216,90 L216,70 L222,70 L222,50 L227,50 L227,30 L232,30 L232,10 L237,10
              L237,30 L242,30 L242,50 L247,50 L247,70 L252,70 L252,90 L258,90 L258,120 L270,120
              L270,110 L280,110 L280,70 L285,70 L285,50 L290,50 L290,30 L295,30 L295,50 L300,50
              L300,70 L305,70 L305,110 L320,110 L320,130 L340,130 L340,100 L350,100 L350,60
              L355,60 L355,40 L360,40 L360,20 L365,20 L365,40 L370,40 L370,60 L375,60 L375,100
              L390,100 L390,120 L410,120 L410,90 L418,90 L418,60 L424,60 L424,40 L430,40 L430,20
              L436,20 L436,0 L442,0 L442,20 L448,20 L448,40 L454,40 L454,60 L460,60 L460,90
              L468,90 L468,120 L490,120 L490,140 L510,140 L510,110 L520,110 L520,80 L528,80
              L528,60 L534,60 L534,40 L540,40 L540,60 L546,60 L546,80 L554,80 L554,110 L570,110
              L570,130 L590,130 L590,100 L600,100 L600,70 L607,70 L607,50 L614,50 L614,30 L621,30
              L621,50 L628,50 L628,70 L635,70 L635,100 L650,100 L650,120 L670,120 L670,90 L680,90
              L680,60 L687,60 L687,40 L694,40 L694,20 L701,20 L701,40 L708,40 L708,60 L715,60
              L715,90 L730,90 L730,110 L750,110 L750,80 L758,80 L758,50 L764,50 L764,30 L770,30
              L770,50 L776,50 L776,80 L784,80 L784,110 L800,110 L800,130 L820,130 L820,100 L830,100
              L830,70 L837,70 L837,50 L844,50 L844,30 L850,30 L850,10 L856,10 L856,30 L862,30
              L862,50 L868,50 L868,70 L875,70 L875,100 L890,100 L890,120 L910,120 L910,90 L918,90
              L918,60 L924,60 L924,40 L930,40 L930,60 L936,60 L936,90 L944,90 L944,120 L960,120
              L960,140 L980,140 L980,110 L990,110 L990,80 L997,80 L997,60 L1003,60 L1003,40
              L1009,40 L1009,60 L1015,60 L1015,80 L1022,80 L1022,110 L1038,110 L1038,130 L1060,130
              L1060,100 L1070,100 L1070,70 L1077,70 L1077,50 L1084,50 L1084,30 L1090,30 L1090,50
              L1096,50 L1096,70 L1103,70 L1103,100 L1118,100 L1118,120 L1138,120 L1138,90 L1146,90
              L1146,60 L1152,60 L1152,40 L1158,40 L1158,60 L1164,60 L1164,90 L1172,90 L1172,120
              L1190,120 L1190,140 L1210,140 L1210,110 L1220,110 L1220,80 L1228,80 L1228,60 L1234,60
              L1234,40 L1240,40 L1240,60 L1246,60 L1246,80 L1254,80 L1254,110 L1270,110 L1270,130
              L1290,130 L1290,100 L1300,100 L1300,70 L1307,70 L1307,50 L1314,50 L1314,30 L1320,30
              L1320,50 L1326,50 L1326,70 L1333,70 L1333,100 L1348,100 L1348,130 L1370,130 L1370,150
              L1390,150 L1390,160 L1440,160 L1440,220 Z
            " />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 text-center">
          {/* Badge */}
          <div
            className="animate-fade-in-up inline-flex items-center gap-4 mb-6"
            style={{ animationDelay: "0ms" }}
          >
            <span className="block h-px w-16 sm:w-24" style={{ background: "linear-gradient(to left, var(--gold), transparent)" }} />
            <span className="text-xs font-semibold tracking-[0.25em] uppercase whitespace-nowrap" style={{ color: "var(--gold-light)" }}>
              DLD Data · All 7 Emirates · No Sign-up
            </span>
            <span className="block h-px w-16 sm:w-24" style={{ background: "linear-gradient(to right, var(--gold), transparent)" }} />
          </div>

          <h1
            className="animate-fade-in-up text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight mb-6"
            style={{ animationDelay: "100ms", color: "#F0E8D8" }}
          >
            Know Your ROI
            <br />
            <span className="gold-shimmer-text">Before You Sign</span>
          </h1>

          <p
            className="animate-fade-in-up text-lg md:text-xl max-w-2xl mx-auto mb-10"
            style={{ animationDelay: "200ms", color: "rgba(232,220,200,0.6)" }}
          >
            Instant gross yield, net yield, cash flow, and mortgage analysis for any UAE property.
            Powered by area-level market data across Dubai, Abu Dhabi, Sharjah and beyond.
          </p>

          <div
            className="animate-fade-in-up flex flex-col sm:flex-row gap-4 justify-center"
            style={{ animationDelay: "300ms" }}
          >
            <Link
              href="/calculator"
              className="btn-gold inline-flex items-center justify-center gap-2 px-8 py-4 text-base rounded-xl"
            >
              <CalculatorIcon className="h-5 w-5" />
              Calculate ROI — Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#market-data"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold text-base rounded-xl transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(201,168,76,0.25)",
                color: "rgba(232,220,200,0.85)",
              }}
            >
              <MapPin className="h-4 w-4" />
              Explore Market Data
            </Link>
          </div>

          {/* Animated Stats */}
          <StatsCounter stats={stats} />
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <section style={{ background: "rgba(201,168,76,0.1)", borderTop: "1px solid rgba(201,168,76,0.2)", borderBottom: "1px solid rgba(201,168,76,0.2)" }} className="py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {trustPoints.map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.title} className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <div
                    className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(201,168,76,0.2)" }}
                  >
                    <Icon className="h-4.5 w-4.5" style={{ color: "var(--gold)" }} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm" style={{ color: "#E8DCC8" }}>{t.title}</p>
                    <p className="text-xs" style={{ color: "rgba(232,220,200,0.5)" }}>{t.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 md:py-28" style={{ background: "#0A0B0E" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center mb-14">
            <p className="font-semibold text-sm uppercase tracking-widest mb-3" style={{ color: "var(--gold)" }}>What You Get</p>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: "#F0E8D8" }}>
              Everything needed to evaluate a UAE property
            </h2>
            <p className="max-w-xl mx-auto" style={{ color: "rgba(232,220,200,0.5)" }}>
              No spreadsheets. No guesswork. Just enter the basics — we handle the analysis.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <ScrollReveal key={f.title} delay={i * 100}>
                  <div className="glass-card glass-card-hover p-7 h-full">
                    <div
                      className="h-12 w-12 rounded-xl flex items-center justify-center mb-4"
                      style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)" }}
                    >
                      <Icon className="h-6 w-6" style={{ color: "var(--gold)" }} />
                    </div>
                    <h3 className="font-bold text-lg mb-2" style={{ color: "#F0E8D8" }}>{f.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(232,220,200,0.55)" }}>{f.desc}</p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 md:py-28" style={{ background: "#070809" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center mb-14">
            <p className="font-semibold text-sm uppercase tracking-widest mb-3" style={{ color: "var(--gold)" }}>How It Works</p>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: "#F0E8D8" }}>
              From property details to investment verdict in 3 steps
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <ScrollReveal key={s.step} delay={i * 150}>
                <div className="relative flex flex-col items-center text-center">
                  <div
                    className="h-16 w-16 rounded-2xl flex items-center justify-center font-extrabold text-xl mb-5 animate-float"
                    style={{
                      background: "linear-gradient(135deg, var(--gold-dark), var(--gold))",
                      color: "#070809",
                      boxShadow: "0 8px 32px rgba(201,168,76,0.35)",
                      animationDelay: `${i * 0.5}s`,
                    }}
                  >
                    {s.step}
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className="hidden md:block absolute top-8 h-px"
                      style={{
                        left: "calc(50% + 40px)",
                        right: 0,
                        background: "linear-gradient(to right, rgba(201,168,76,0.4), transparent)",
                      }}
                    />
                  )}
                  <h3 className="font-bold text-lg mb-2" style={{ color: "#F0E8D8" }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(232,220,200,0.5)" }}>{s.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal className="text-center mt-12">
            <Link
              href="/calculator"
              className="btn-gold inline-flex items-center gap-2 px-8 py-4 rounded-xl"
            >
              Start Analysing Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ── BUILT FOR ── */}
      <section className="py-20 md:py-28" style={{ background: "#0A0B0E" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center mb-14">
            <p className="font-semibold text-sm uppercase tracking-widest mb-3" style={{ color: "var(--gold)" }}>Built For</p>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: "#F0E8D8" }}>
              Every player in the UAE property market
            </h2>
            <p className="max-w-xl mx-auto" style={{ color: "rgba(232,220,200,0.5)" }}>
              Whether you are evaluating your first investment or managing a portfolio, this tool gives you the numbers that matter.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {userTypes.map((u, i) => {
              const Icon = u.icon;
              return (
                <ScrollReveal key={u.title} delay={i * 100}>
                  <div className="glass-card glass-card-hover p-6 h-full">
                    <div
                      className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-5"
                      style={{ background: "rgba(201,168,76,0.15)", color: "var(--gold-light)", border: "1px solid rgba(201,168,76,0.3)" }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {u.title}
                    </div>
                    <ul className="space-y-2.5">
                      {u.points.map((p) => (
                        <li key={p} className="flex items-start gap-2 text-sm" style={{ color: "rgba(232,220,200,0.65)" }}>
                          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "var(--gold)" }} />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── MARKET DATA ── */}
      <section id="market-data" className="py-20 md:py-28" style={{ background: "#070809" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal direction="left">
              <p className="font-semibold text-sm uppercase tracking-widest mb-3" style={{ color: "var(--gold)" }}>Market Intelligence</p>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-5" style={{ color: "#F0E8D8" }}>
                Area-level data for every<br />
                <span className="gold-text">UAE neighbourhood</span>
              </h2>
              <p className="leading-relaxed mb-6" style={{ color: "rgba(232,220,200,0.55)" }}>
                Our calculator comes pre-loaded with average price per sqft, rental rates, gross yields,
                and service charges for 60+ areas across all 7 UAE emirates.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Average sale price per sqft by area",
                  "Average annual rent per sqft",
                  "Historical gross yield benchmarks",
                  "Service charge estimates per area",
                  "Dominant property types per district",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm" style={{ color: "rgba(232,220,200,0.7)" }}>
                    <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "var(--gold)" }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/calculator"
                className="btn-gold inline-flex items-center gap-2 px-6 py-3 rounded-xl"
              >
                Explore Areas in Calculator
                <ChevronRight className="h-4 w-4" />
              </Link>
            </ScrollReveal>

            <ScrollReveal direction="right">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { city: "Dubai", areas: "28 areas", yields: "4.0 – 10.7%", icon: "🏙️" },
                  { city: "Abu Dhabi", areas: "13 areas", yields: "5.2 – 7.2%", icon: "🕌" },
                  { city: "Sharjah", areas: "8 areas", yields: "8.2 – 9.7%", icon: "🌆" },
                  { city: "Ajman & Others", areas: "11 areas", yields: "7.3 – 12.1%", icon: "🌇" },
                ].map((c) => (
                  <div key={c.city} className="glass-card glass-card-hover p-5">
                    <div className="text-2xl mb-2">{c.icon}</div>
                    <div className="font-bold text-base" style={{ color: "#F0E8D8" }}>{c.city}</div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(232,220,200,0.45)" }}>{c.areas}</div>
                    <div
                      className="mt-3 text-xs font-semibold px-2.5 py-1 rounded-full inline-block"
                      style={{ background: "rgba(201,168,76,0.15)", color: "var(--gold-light)", border: "1px solid rgba(201,168,76,0.3)" }}
                    >
                      Yields {c.yields}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 relative overflow-hidden" style={{ background: "#0A0B0E" }}>
        <div
          className="absolute inset-0 opacity-30"
          style={{ background: "radial-gradient(ellipse at center, rgba(201,168,76,0.25) 0%, transparent 70%)" }}
        />
        <ScrollReveal className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: "#F0E8D8" }}>
            Ready to run the numbers?
          </h2>
          <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: "rgba(232,220,200,0.55)" }}>
            No account. No credit card. Just open the calculator and start analysing UAE property investments in seconds.
          </p>
          <Link
            href="/calculator"
            className="btn-gold inline-flex items-center gap-3 px-10 py-4 rounded-xl text-base"
          >
            <CalculatorIcon className="h-5 w-5" />
            Open Free Calculator
            <ArrowRight className="h-4 w-4" />
          </Link>
        </ScrollReveal>
      </section>

      <Footer />
    </div>
  );
}
