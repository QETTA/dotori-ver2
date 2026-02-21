/**
 * 솔라피(Solapi) 알림톡 발송 유틸리티 (서버 전용)
 * Phase 3에서 비즈메시지 대행사 계약 후 활성화
 */

import dbConnect from "@/lib/db";
import AlimtalkLog from "@/models/AlimtalkLog";
import { log } from "@/lib/logger";

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || "";
const SOLAPI_SECRET = process.env.SOLAPI_API_SECRET || "";
const KAKAO_SENDER_KEY = process.env.KAKAO_SENDER_KEY || "";
const SENDER_PHONE = process.env.SENDER_PHONE || "";

export interface AlimtalkParams {
	to: string; // 수신자 전화번호 (01012345678)
	templateId: string; // 카카오 승인 템플릿 코드
	variables: Record<string, string>; // 치환 변수
}

export interface AlimtalkResult {
	success: boolean;
	messageId?: string;
	error?: string;
}

/**
 * 알림톡 발송 (솔라피 v4 API)
 */
export async function sendAlimtalk({
	to,
	templateId,
	variables,
	userId,
}: AlimtalkParams & { userId?: string }): Promise<AlimtalkResult> {
	if (!SOLAPI_API_KEY || !SOLAPI_SECRET || !KAKAO_SENDER_KEY) {
		log.warn("솔라피 환경변수가 설정되지 않았습니다");
		return { success: false, error: "솔라피 미설정" };
	}

	try {
		const { createHmac } = await import("crypto");
		const date = new Date().toISOString();
		const salt = crypto.randomUUID();
		const signature = createHmac("sha256", SOLAPI_SECRET)
			.update(date + salt)
			.digest("hex");

		const response = await fetch(
			"https://api.solapi.com/messages/v4/send",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`,
				},
				body: JSON.stringify({
					messages: [
						{
							to,
							from: SENDER_PHONE,
							kakaoOptions: {
								pfId: KAKAO_SENDER_KEY,
								templateId,
								variables,
							},
						},
					],
				}),
			},
		);

		const data = await response.json();

		if (!response.ok) {
			const result: AlimtalkResult = {
				success: false,
				error: data.errorMessage || `HTTP ${response.status}`,
			};
			await logAlimtalk({ userId, templateId, phone: to, variables, result });
			return result;
		}

		const result: AlimtalkResult = {
			success: true,
			messageId: data.groupId,
		};
		await logAlimtalk({ userId, templateId, phone: to, variables, result });
		return result;
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "알림톡 발송 실패";
		const result: AlimtalkResult = { success: false, error: message };
		await logAlimtalk({ userId, templateId, phone: to, variables, result });
		return result;
	}
}

/** AlimtalkLog DB에 발송 결과 기록 */
async function logAlimtalk(params: {
	userId?: string;
	templateId: string;
	phone: string;
	variables: Record<string, string>;
	result: AlimtalkResult;
}) {
	try {
		await dbConnect();
		await AlimtalkLog.create({
			userId: params.userId || undefined,
			templateId: params.templateId,
			phone: params.phone,
			status: params.result.success ? "sent" : "failed",
			solapiMsgId: params.result.messageId,
			errorMsg: params.result.error,
			variables: params.variables,
		});
	} catch (logErr) {
		log.error("알림톡 DB 로깅 실패", { error: logErr instanceof Error ? logErr.message : String(logErr) });
	}
}
