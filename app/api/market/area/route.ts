import { NextRequest, NextResponse } from "next/server";
import { getAreaWithTrend } from "@/lib/market-server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city")?.trim();
  const area = req.nextUrl.searchParams.get("area")?.trim();

  if (!city || !area) {
    return NextResponse.json({ error: "city and area required" }, { status: 400 });
  }

  const data = getAreaWithTrend(city, area);
  if (!data) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}
