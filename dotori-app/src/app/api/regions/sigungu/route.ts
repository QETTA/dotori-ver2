import { NextResponse } from "next/server";
import { withApiHandler, BadRequestError } from "@/lib/api-handler";
import Facility from "@/models/Facility";

export const GET = withApiHandler(async (req) => {
  const sido = req.nextUrl.searchParams.get("sido");
  if (!sido) throw new BadRequestError("sido 파라미터가 필요합니다");

  const sigunguList = await Facility.distinct("region.sigungu", { "region.sido": sido });
  const sorted = sigunguList.filter(Boolean).sort((a: string, b: string) => a.localeCompare(b, "ko"));
  return NextResponse.json(
    { data: sorted },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
  );
}, { auth: false });
