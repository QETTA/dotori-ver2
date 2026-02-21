/**
 * POST /api/ocr/waitlist
 * 아이사랑 대기현황 스크린샷을 Claude Haiku Vision으로 분석하여
 * 구조화된 대기 정보(시설명, 대기순번, 신청일, 상태 등)를 추출
 */

import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { strictLimiter } from "@/lib/rate-limit";
import Anthropic from "@anthropic-ai/sdk";
import { log } from "@/lib/logger";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
// Vision OCR은 빠르고 저렴한 Haiku 사용
const OCR_MODEL = "claude-haiku-4-5-20251001";

const EXTRACTION_PROMPT = `다음은 아이사랑 보육포털의 대기현황 또는 입소대기 관련 스크린샷입니다.
이미지에서 어린이집/유치원 대기 정보를 추출하여 JSON 배열로 반환하세요.

각 항목마다 다음 필드를 추출:
- facilityName (시설명, string)
- waitlistNumber (대기순번, number 또는 null)
- applicationDate (신청일자, "YYYY-MM-DD" 형식, 또는 null)
- status (상태: "대기중" | "입소확정" | "취소" | 기타 문자열)
- childClass (반명/연령반, string 또는 null)
- childName (아동명, string 또는 null)
- facilityType (시설유형: "국공립" | "민간" | "가정" | "직장" | null)

JSON 배열만 반환하세요. 다른 텍스트는 포함하지 마세요.
확인 불가능한 필드는 null로 설정하세요.
이미지에 대기 정보가 없으면 빈 배열 []을 반환하세요.`;

export interface ExtractedWaitlistItem {
	facilityName: string;
	waitlistNumber: number | null;
	applicationDate: string | null;
	status: string;
	childClass: string | null;
	childName: string | null;
	facilityType: string | null;
}

export async function POST(request: NextRequest) {
	const limited = strictLimiter.check(request);
	if (limited) return limited;

	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json(
			{ error: "인증이 필요합니다" },
			{ status: 401 },
		);
	}

	if (!ANTHROPIC_API_KEY) {
		return NextResponse.json(
			{ error: "AI 서비스가 설정되지 않았습니다" },
			{ status: 500 },
		);
	}

	try {
		const formData = await request.formData();
		const imageFile = formData.get("image") as File | null;

		if (!imageFile) {
			return NextResponse.json(
				{ error: "이미지가 필요합니다" },
				{ status: 400 },
			);
		}

		// Validate file type
		const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
		if (!allowedTypes.includes(imageFile.type)) {
			return NextResponse.json(
				{ error: "지원하지 않는 이미지 형식입니다 (JPG, PNG, WebP, GIF만 가능)" },
				{ status: 400 },
			);
		}

		// Validate file size (max 10MB)
		if (imageFile.size > 10 * 1024 * 1024) {
			return NextResponse.json(
				{ error: "이미지 크기는 10MB 이하여야 합니다" },
				{ status: 400 },
			);
		}

		// Convert to base64
		const arrayBuffer = await imageFile.arrayBuffer();
		const base64 = Buffer.from(arrayBuffer).toString("base64");
		const mediaType = imageFile.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

		// Call Claude Haiku Vision
		const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
		const response = await client.messages.create({
			model: OCR_MODEL,
			max_tokens: 2000,
			messages: [
				{
					role: "user",
					content: [
						{
							type: "image",
							source: {
								type: "base64",
								media_type: mediaType,
								data: base64,
							},
						},
						{
							type: "text",
							text: EXTRACTION_PROMPT,
						},
					],
				},
			],
		});

		// Extract text response
		const textBlock = response.content.find((b) => b.type === "text");
		const rawText = textBlock?.type === "text" ? textBlock.text : "[]";

		// Parse JSON from response (handle potential markdown code blocks)
		let jsonStr = rawText.trim();
		if (jsonStr.startsWith("```")) {
			jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
		}

		let items: ExtractedWaitlistItem[];
		try {
			items = JSON.parse(jsonStr);
			if (!Array.isArray(items)) {
				items = [];
			}
		} catch {
			log.error("OCR JSON 파싱 실패", { rawText: rawText.slice(0, 200) });
			items = [];
		}

		return NextResponse.json({
			data: {
				items,
				count: items.length,
				model: OCR_MODEL,
				usage: {
					inputTokens: response.usage.input_tokens,
					outputTokens: response.usage.output_tokens,
				},
			},
		});
	} catch (err) {
		log.error("OCR 처리 실패", { error: err instanceof Error ? err.message : String(err) });
		return NextResponse.json(
			{ error: "스크린샷 분석에 실패했습니다. 다시 시도해주세요." },
			{ status: 500 },
		);
	}
}
