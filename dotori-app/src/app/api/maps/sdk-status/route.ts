import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { evaluateKakaoMapSdkResponse } from "@/lib/kakao-map-sdk";
import { standardLimiter } from "@/lib/rate-limit";

function getKakaoMapKey() {
	const mapKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY?.trim();
	if (mapKey) return mapKey;

	const fallbackJsKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY?.trim();
	if (fallbackJsKey) return fallbackJsKey;

	return "";
}

export const GET = withApiHandler(async () => {
	const appKey = getKakaoMapKey();
	if (!appKey) {
		return NextResponse.json(
			{
				data: {
					status: "missing_key",
					message:
						"NEXT_PUBLIC_KAKAO_MAP_KEY가 설정되지 않았어요. 배포 환경변수를 확인해주세요.",
				},
			},
			{ headers: { "Cache-Control": "no-store" } },
		);
	}

	const sdkUrl = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
	const response = await fetch(sdkUrl, { cache: "no-store" });
	const bodyText = await response.text();
	const result = evaluateKakaoMapSdkResponse({
		httpStatus: response.status,
		bodyText,
	});

	return NextResponse.json(
		{
			data: result,
		},
		{ headers: { "Cache-Control": "no-store" } },
	);
}, { auth: false, rateLimiter: standardLimiter, skipDb: true, cacheControl: "no-store" });
