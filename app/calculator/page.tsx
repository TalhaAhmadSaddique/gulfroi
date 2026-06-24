import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DubaiBackground from "@/components/DubaiBackground";
import DubaiCalculator from "@/components/DubaiCalculator";
import { SEO_KEYWORDS } from "@/lib/landing-content";
import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: "Dubai Property ROI Calculator | Free Rental Yield & Price Tool",
  description:
    "Free Dubai real estate ROI calculator. Analyse gross yield, net yield, rental income, price per sqft and cash flow using real DLD sales and Ejari rental data for 108 Dubai areas.",
  keywords: SEO_KEYWORDS.slice(0, 12),
  alternates: {
    canonical: `${siteUrl}/calculator`,
  },
  openGraph: {
    title: "Dubai Property ROI Calculator | Free Tool",
    description: "Real DLD area data. Calculate yield, cash flow and ROI for Dubai properties.",
    url: `${siteUrl}/calculator`,
  },
};

export default function CalculatorPage() {
  return (
    <div className="min-h-screen flex flex-col relative">
      <DubaiBackground />
      <div className="relative z-10 flex flex-col flex-1 min-h-screen">
        <Navbar />
        <main className="flex-1">
          <DubaiCalculator />
        </main>
        <Footer />
      </div>
    </div>
  );
}
