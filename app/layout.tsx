import type { Metadata, Viewport } from "next";
import JsonLd from "@/components/JsonLd";
import { SEO_KEYWORDS } from "@/lib/landing-content";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const siteUrl = getSiteUrl();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#070809",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  title: {
    default: "Dubai Real Estate ROI Calculator | Free Property Analysis",
    template: "%s | Dubai ROI",
  },
  description:
    "Free Dubai real estate ROI calculator with real DLD sales and Ejari rental data. Calculate gross yield, net yield, Dubai price per sqft, rental income, cash flow and mortgage for 108 areas.",
  keywords: SEO_KEYWORDS,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "Dubai ROI Calculator | Know Your Returns Before You Invest",
    description:
      "Instant Dubai property analysis with real DLD market data. Gross yield, cash flow and mortgage calculator. 100% free.",
    type: "website",
    locale: "en_AE",
    siteName: "Dubai ROI Calculator",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Dubai ROI Calculator | Free Dubai Property Analysis",
    description: "Calculate gross yield, net yield and ROI for any Dubai property. Real DLD data. Free.",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  category: "finance",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body suppressHydrationWarning className="min-h-full touch-manipulation" style={{ background: "#070809", color: "#E8DCC8" }}>
        <JsonLd />
        {children}
      </body>
    </html>
  );
}
