import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  title: "Dubai ROI Calculator — Know Your Returns Before You Invest",
  description:
    "Free Dubai real estate ROI calculator. Instant gross yield, net yield, cash flow, and mortgage analysis — powered by real DLD and Ejari area data.",
  keywords: [
    "Dubai ROI calculator",
    "Dubai real estate ROI",
    "property investment Dubai",
    "rental yield calculator Dubai",
    "DLD property data",
    "Dubai property investment calculator",
  ],
  openGraph: {
    title: "Dubai ROI Calculator — Know Your Returns Before You Invest",
    description:
      "Free, instant Dubai property ROI analysis with area-level DLD market data.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body suppressHydrationWarning className="min-h-full" style={{ background: "#070809", color: "#E8DCC8" }}>{children}</body>
    </html>
  );
}
