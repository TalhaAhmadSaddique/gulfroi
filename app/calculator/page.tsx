import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DubaiBackground from "@/components/DubaiBackground";
import UAECalculator from "@/components/UAECalculator";
import { getAllAreas, getPropertyTypes } from "@/lib/market-data";
import { getAllTrends } from "@/lib/quarterly-trends";

export const metadata: Metadata = {
  title: "Dubai ROI Calculator — Free Property Analysis Tool",
  description:
    "Calculate gross yield, net yield, cash flow and ROI for any Dubai property. 108 areas with real DLD sales and Ejari rental data. 100% free.",
};

export default function CalculatorPage() {
  const areas      = getAllAreas();
  const propTypes  = getPropertyTypes();
  const trends     = getAllTrends();

  return (
    <div className="min-h-screen flex flex-col relative">
      <DubaiBackground />
      <div className="relative z-10 flex flex-col flex-1 min-h-screen">
        <Navbar />
        <main className="flex-1">
          <UAECalculator areas={areas} propTypes={propTypes} trends={trends} />
        </main>
        <Footer />
      </div>
    </div>
  );
}
