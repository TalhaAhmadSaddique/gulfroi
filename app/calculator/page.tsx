import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import UAECalculator from "@/components/UAECalculator";
import { getAllAreas, getPropertyTypes } from "@/lib/market-data";
import { getAllTrends } from "@/lib/quarterly-trends";

export const metadata: Metadata = {
  title: "UAE ROI Calculator — Free Property Analysis Tool",
  description:
    "Calculate gross yield, net yield, cash flow and ROI for any UAE property. 60+ areas across Dubai, Abu Dhabi, Sharjah and all 7 emirates. 100% free.",
};

export default function CalculatorPage() {
  const areas      = getAllAreas();
  const propTypes  = getPropertyTypes();
  const trends     = getAllTrends();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#070809" }}>
      <Navbar />
      <main className="flex-1">
        <UAECalculator areas={areas} propTypes={propTypes} trends={trends} />
      </main>
      <Footer />
    </div>
  );
}
