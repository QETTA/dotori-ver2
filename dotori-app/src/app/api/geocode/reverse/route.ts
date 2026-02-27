import { NextResponse } from "next/server";
import { withApiHandler, BadRequestError } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";

interface KakaoRegionDocument {
	region_type: string;
	address_name: string;
	region_1depth_name: string; // sido
	region_2depth_name: string; // sigungu
	region_3depth_name: string; // dong
	region_4depth_name: string;
	code: string;
	x: number;
	y: number;
}

interface KakaoRegionResponse {
	meta: { total_count: number };
	documents: KakaoRegionDocument[];
}

export const GET = withApiHandler(async (req) => {
	const { searchParams } = req.nextUrl;
	const lat = searchParams.get("lat");
	const lng = searchParams.get("lng");

	if (!lat || !lng) {
		throw new BadRequestError("lat, lng 파라미터가 필요합니다");
	}

	const latitude = Number.parseFloat(lat);
	const longitude = Number.parseFloat(lng);

	if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
		throw new BadRequestError("올바른 좌표값이 아닙니다");
	}

	// Validate coordinate ranges for South Korea
	if (latitude < 33 || latitude > 39 || longitude < 124 || longitude > 132) {
		throw new BadRequestError("한국 내 좌표만 지원합니다");
	}

	const kakaoKey = process.env.KAKAO_REST_API_KEY;
	if (!kakaoKey) {
		throw new Error("KAKAO_REST_API_KEY 환경변수가 설정되지 않았습니다");
	}

	const url = `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${longitude}&y=${latitude}`;

	const response = await fetch(url, {
		headers: { Authorization: `KakaoAK ${kakaoKey}` },
	});

	if (!response.ok) {
		let kakaoMessage = "";
		try {
			const errorJson = await response.json() as { message?: string; errorType?: string };
			kakaoMessage = errorJson.message || errorJson.errorType || "";
		} catch {
			// ignore JSON parse failures and use status code fallback
		}

		if (response.status === 403) {
			throw new BadRequestError(
				"카카오 지도/로컬 API 사용 권한이 없어 현재 위치를 불러올 수 없어요. Kakao Developers에서 Maps/Local 서비스를 활성화해주세요.",
			);
		}

		throw new Error(`Kakao API 호출 실패: ${response.status}${kakaoMessage ? ` (${kakaoMessage})` : ""}`);
	}

	const result: KakaoRegionResponse = await response.json();

	// Use region_type "H" (행정동) for more precise neighborhood info
	const region =
		result.documents.find((d) => d.region_type === "H") ||
		result.documents[0];

	if (!region) {
		throw new BadRequestError("해당 좌표의 지역 정보를 찾을 수 없습니다");
	}

	return NextResponse.json({
		data: {
			sido: region.region_1depth_name,
			sigungu: region.region_2depth_name,
			dong: region.region_3depth_name,
		},
	});
}, { auth: false, rateLimiter: standardLimiter, skipDb: true });
