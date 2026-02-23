import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import Facility from "@/models/Facility";

export const GET = withApiHandler(async () => {
  let sorted: string[] = [];
  try {
    const sidoList = await Facility.distinct("region.sido");
    sorted = sidoList
      .filter(Boolean)
      .sort((a: string, b: string) => a.localeCompare(b, "ko"));
  } catch {
    sorted = [];
  }
  return NextResponse.json(
    { data: sorted },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}, { auth: false, skipDb: true });
