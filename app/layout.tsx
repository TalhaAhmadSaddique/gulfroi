import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  title: "UAE ROI Calculator — Know Your Returns Before You Invest",
  description:
    "Free UAE real estate ROI calculator. Instant gross yield, net yield, cash flow, and mortgage analysis for Dubai, Abu Dhabi, Sharjah and all emirates — powered by live area market data.",
  keywords: [
    "UAE ROI calculator",
    "Dubai real estate ROI",
    "property investment UAE",
    "rental yield calculator Dubai",
    "Abu Dhabi property ROI",
    "UAE property investment calculator",
  ],
  openGraph: {
    title: "UAE ROI Calculator — Know Your Returns Before You Invest",
    description:
      "Free, instant UAE property ROI analysis with area-level market data for all 7 emirates.",
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
