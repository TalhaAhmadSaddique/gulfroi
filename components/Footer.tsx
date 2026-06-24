import Link from "next/link";
import { CalculatorIcon } from "lucide-react";
import { getDubaiMarketStats } from "@/lib/featured-areas";

export default function Footer() {
  const { areaCount } = getDubaiMarketStats();
  return (
    <footer style={{ background: "#040506", borderTop: "1px solid rgba(201,168,76,0.12)" }} className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 font-bold text-lg mb-3 group">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{
                  background: "linear-gradient(135deg, var(--gold-dark), var(--gold-light))",
                  boxShadow: "0 0 12px rgba(201,168,76,0.3)",
                }}
              >
                <CalculatorIcon className="h-4 w-4" style={{ color: "#070809" }} />
              </div>
              <span style={{ color: "#F0E8D8" }}>
                Dubai<span className="gold-text">ROI</span>
              </span>
            </Link>
            <p className="text-sm max-w-xs mt-2" style={{ color: "rgba(232,220,200,0.4)" }}>
              Free, instant Dubai real estate ROI analysis. No signup, no hidden fees.
              Real DLD and Ejari data for {areaCount} Dubai neighbourhoods.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3" style={{ color: "#F0E8D8" }}>Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/calculator", label: "ROI Calculator" },
                { href: "/#features", label: "Features" },
                { href: "/#how-it-works", label: "How It Works" },
                { href: "/#faq", label: "FAQ" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors duration-200 hover:text-[var(--gold-light)]"
                    style={{ color: "rgba(232,220,200,0.45)" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div
          className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs"
          style={{ borderTop: "1px solid rgba(201,168,76,0.1)", color: "rgba(232,220,200,0.3)" }}
        >
          <p>© {new Date().getFullYear()} Dubai ROI. All rights reserved.</p>
          <p>Data is indicative. Always verify with a licensed agent. Dubai only.</p>
        </div>
      </div>
    </footer>
  );
}
