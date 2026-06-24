import { NextResponse } from "next/server";
import { getMarketCatalog } from "@/lib/market-server";

export const runtime = "nodejs";

export async function GET() {
  const catalog = getMarketCatalog();
  return NextResponse.json(catalog, {
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}
