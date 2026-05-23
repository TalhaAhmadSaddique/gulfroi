"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { CalculatorIcon, Menu, X } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? "rgba(7,8,9,0.92)"
          : "rgba(7,8,9,0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: scrolled
          ? "1px solid rgba(201,168,76,0.25)"
          : "1px solid rgba(201,168,76,0.1)",
        boxShadow: scrolled ? "0 4px 30px rgba(0,0,0,0.5)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg group">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110"
            style={{
              background: "linear-gradient(135deg, var(--gold-dark), var(--gold-light))",
              boxShadow: "0 0 16px rgba(201,168,76,0.4)",
            }}
          >
            <CalculatorIcon className="h-4 w-4" style={{ color: "#070809" }} />
          </div>
          <span style={{ color: "#F0E8D8" }}>
            UAE<span className="gold-text">ROI</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {[
            { href: "/#features", label: "Features" },
            { href: "/#how-it-works", label: "How It Works" },
            { href: "/#market-data", label: "Market Data" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative transition-colors duration-200 group"
              style={{ color: "rgba(232,220,200,0.65)" }}
            >
              <span className="group-hover:text-[#EDD06A] transition-colors duration-200">{item.label}</span>
              <span
                className="absolute -bottom-0.5 left-0 w-0 h-px group-hover:w-full transition-all duration-300"
                style={{ background: "var(--gold)" }}
              />
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:block">
          <Link
            href="/calculator"
            className="btn-gold inline-flex items-center gap-2 px-5 py-2 text-sm rounded-lg"
          >
            <CalculatorIcon className="h-4 w-4" />
            Try Calculator
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg transition-colors"
          style={{ color: "rgba(232,220,200,0.7)" }}
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden px-4 py-4 space-y-3"
          style={{
            background: "rgba(7,8,9,0.97)",
            borderTop: "1px solid rgba(201,168,76,0.15)",
          }}
        >
          {[
            { href: "/#features", label: "Features" },
            { href: "/#how-it-works", label: "How It Works" },
            { href: "/#market-data", label: "Market Data" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block text-sm py-1 transition-colors"
              style={{ color: "rgba(232,220,200,0.7)" }}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/calculator"
            className="btn-gold block text-center px-4 py-2.5 text-sm rounded-lg"
            onClick={() => setOpen(false)}
          >
            Try Calculator — Free
          </Link>
        </div>
      )}
    </header>
  );
}
