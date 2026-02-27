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
import { createApiErrorResponse } from "@/lib/api-error";

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
		return createApiErrorResponse({
			status: 401,
			code: "UNAUTHORIZED",
			message: "인증이 필요합니다",
		});
	}

	if (!ANTHROPIC_API_KEY) {
		return createApiErrorResponse({
			status: 500,
			code: "INTERNAL_ERROR",
			message: "AI 서비스가 설정되지 않았습니다",
		});
	}

	try {
		let formData: FormData;
		try {
			formData = await request.formData();
		} catch {
			return createApiErrorResponse({
				status: 400,
				code: "BAD_REQUEST",
				message: "유효하지 않은 multipart/form-data 요청입니다",
			});
		}

		const imageFile = formData.get("image") as File | null;

		if (!imageFile) {
			return createApiErrorResponse({
				status: 400,
				code: "BAD_REQUEST",
				message: "이미지가 필요합니다",
			});
		}

		// Validate file type
		const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
		if (!allowedTypes.includes(imageFile.type)) {
			return createApiErrorResponse({
				status: 400,
				code: "UNSUPPORTED_MEDIA_TYPE",
				message: "지원하지 않는 이미지 형식입니다 (JPG, PNG, WebP, GIF만 가능)",
			});
		}

		// Validate file size (max 10MB)
		if (imageFile.size > 10 * 1024 * 1024) {
			return createApiErrorResponse({
				status: 413,
				code: "PAYLOAD_TOO_LARGE",
				message: "이미지 크기는 10MB 이하여야 합니다",
			});
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
		return createApiErrorResponse({
			status: 500,
			code: "INTERNAL_ERROR",
			message: "스크린샷 분석에 실패했습니다. 다시 시도해주세요.",
		});
	}
}
