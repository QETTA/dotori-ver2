/**
 * Claude AI 래퍼 (서버 전용)
 * 토리챗의 자연어 응답 생성에 사용
 */

import Anthropic from "@anthropic-ai/sdk";
import { log } from "@/lib/logger";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "claude-sonnet-4-6";
const AI_TIMEOUT_MS = 15_000;

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
	if (!ANTHROPIC_API_KEY) {
		log.warn("ANTHROPIC_API_KEY가 설정되지 않았습니다");
		return null;
	}
	if (!client) {
		client = new Anthropic({
			apiKey: ANTHROPIC_API_KEY,
			timeout: AI_TIMEOUT_MS,
		});
	}
	return client;
}

/* ── 시스템 프롬프트 (도메인 전문성 + 응답 가이드라인) ── */

const SYSTEM_PROMPT = `당신은 "토리", 도토리 앱의 어린이집·유치원 AI 어시스턴트입니다.

## 정체성
- 한국 보육시설 전문가. 아이사랑포털(childcare.go.kr), 보건복지부 보육정책 기반 지식.
- 부모의 관점에서 따뜻하고 전문적인 반말체로 대화.
- 이름: 토리 (도토리의 마스코트)

## 응답 규칙
1. **간결성**: 3~5문장 이내. 핵심만 전달.
2. **데이터 인용**: 제공된 시설 데이터의 수치(정원/현원/대기/평점/평가등급)를 반드시 인용.
3. **다음 행동 제안**: 항상 사용자가 할 수 있는 다음 단계를 1~2개 제안.
4. **출처 명시**: 데이터가 있으면 "(아이사랑 기준)" 또는 "(보건복지부 기준)" 표기.
5. **확실하지 않으면**: "정확한 정보는 시설에 직접 확인이 필요해요"라고 안내.
6. **이모지**: 최소 사용 (문장 끝 1개 정도만).

## 시즌별 안내 (현재 ${new Date().getFullYear()}년 ${new Date().getMonth() + 1}월)
- 1~2월: 입소 결과 발표 시기. 대기 순번 변동 안내.
- 3월: 신학기 시작. 적응 기간, 준비물 안내.
- 4~9월: 수시 입소 안내. TO 발생 시 빠른 신청 권유.
- 10~12월: 다음 해 3월 입소 신청 시즌. 아이사랑포털 신청 안내.

## 어린이집 유형별 특징
- 국공립: 정부 운영, 보육료 저렴, 경쟁 치열. 맞벌이 가산점.
- 민간: 다양한 프로그램, 비용 다양. 평가인증 확인 중요.
- 가정: 소규모(20명 이하), 영아에게 유리. 가정적 분위기.
- 직장: 직장 내 설치, 출퇴근 편의. 재직자 우선.
- 협동: 부모 참여형, 교육 철학 공유.

## 데이터가 없을 때
시설 데이터가 제공되지 않았으면 일반적인 보육 지식으로 답변하되,
"탐색 페이지에서 직접 검색해보는 것도 좋겠어요"라고 안내.`;

/* ── 토큰 예산 (인텐트별 차등) ── */

const TOKEN_BUDGETS: Record<string, number> = {
	recommend: 400,
	transfer: 500,
	compare: 500,
	explain: 600,
	status: 300,
	knowledge: 700,
	checklist: 400,
	general: 350,
};

export interface ClaudeResponse {
	content: string;
	success: boolean;
	/** AI 응답 지연시간 (ms) */
	latencyMs?: number;
}

export interface ChatContext {
	facilities?: Array<{
		name: string;
		type: string;
		status: string;
		capacity: { total: number; current: number; waiting: number };
		rating: number;
		address: string;
		features: string[];
		evaluationGrade?: string | null;
	}>;
	previousMessages?: Array<{ role: string; content: string }>;
	userProfile?: {
		nickname?: string;
		children?: Array<{ name: string; birthDate: string }>;
		region?: { sido: string; sigungu: string };
	};
	/** 대기 현황 등 시스템 컨텍스트 (사용자 입력과 분리하여 인젝션 방지) */
	statusInfo?: string;
	/** 인텐트 기반 토큰 예산 제어 */
	intent?: string;
}

export async function generateChatResponse(
	userMessage: string,
	context?: ChatContext,
): Promise<ClaudeResponse> {
	const ai = getClient();
	if (!ai) {
		return { content: "", success: false };
	}

	const startTime = Date.now();

	try {
		// Build context message
		let contextInfo = "";

		if (context?.userProfile) {
			const { nickname, children, region } = context.userProfile;
			contextInfo += `\n[사용자 정보]\n`;
			if (nickname) contextInfo += `- 닉네임: ${nickname}\n`;
			if (region?.sigungu)
				contextInfo += `- 지역: ${region.sido} ${region.sigungu}\n`;
			if (children?.length) {
				for (const child of children) {
					const age = getChildAge(child.birthDate);
					contextInfo += `- 아이: ${child.name} (${age})\n`;
				}
			}
		}

		if (context?.statusInfo) {
			contextInfo += `\n[시스템 현황 데이터]\n${context.statusInfo}\n`;
		}

		if (context?.facilities?.length) {
			contextInfo += `\n[검색된 시설 데이터 — 아이사랑 기준]\n`;
			for (const f of context.facilities) {
				const toCount = f.capacity.total - f.capacity.current;
				const statusLabel =
					f.status === "available"
						? "입소 가능"
						: f.status === "waiting"
							? `대기 ${f.capacity.waiting}명`
							: "정원 마감";
				const grade = f.evaluationGrade
					? `, 평가인증 ${f.evaluationGrade}등급`
					: "";
				contextInfo += `- ${f.name} (${f.type}, ${statusLabel}, 정원 ${f.capacity.total}명/현원 ${f.capacity.current}명, 평점 ${f.rating}${grade})\n`;
				contextInfo += `  주소: ${f.address}\n`;
				if (toCount > 0 && f.status === "available") {
					contextInfo += `  → 여석 ${toCount}자리\n`;
				}
				if (f.features.length > 0) {
					contextInfo += `  → 특징: ${f.features.join(", ")}\n`;
				}
			}
		}

		// Build messages
		const messages: Array<{
			role: "user" | "assistant";
			content: string;
		}> = [];

		// Include previous messages for context (last 4)
		if (context?.previousMessages?.length) {
			for (const msg of context.previousMessages.slice(-4)) {
				messages.push({
					role: msg.role === "user" ? "user" : "assistant",
					content: msg.content,
				});
			}
		}

		// Sanitize user message: strip structural markers to prevent prompt injection
		const sanitizedUserMessage = userMessage.replace(
			/\[(?:사용자 정보|사용자 질문|검색된 시설|시스템|대기 현황|체크리스트)[^\]]*\]/g,
			"",
		).trim();

		// Current user message with context (context as system-side data, user input clearly separated)
		const fullMessage = contextInfo
			? `${contextInfo}\n---\n${sanitizedUserMessage}`
			: sanitizedUserMessage;

		messages.push({ role: "user", content: fullMessage });

		// Intent-based token budget
		const maxTokens =
			TOKEN_BUDGETS[context?.intent || "general"] || 400;

		const response = await ai.messages.create({
			model: AI_MODEL,
			max_tokens: maxTokens,
			system: [
				{
					type: "text",
					text: SYSTEM_PROMPT,
					cache_control: { type: "ephemeral" },
				},
			],
			messages,
		});

		const textBlock = response.content.find((b) => b.type === "text");
		const content = textBlock?.type === "text" ? textBlock.text : "";
		const latencyMs = Date.now() - startTime;

		if (process.env.NODE_ENV !== "production") {
			log.debug("Claude AI response", {
				intent: context?.intent || "general",
				latencyMs,
				inputTokens: response.usage?.input_tokens,
				outputTokens: response.usage?.output_tokens,
			});
		}

		return { content, success: true, latencyMs };
	} catch (err) {
		const latencyMs = Date.now() - startTime;
		const errorMsg =
			err instanceof Error ? err.message : "Unknown error";
		log.error("Claude API 호출 실패", { latencyMs, error: errorMsg });
		return { content: "", success: false, latencyMs };
	}
}

function getChildAge(birthDate: string): string {
	const birth = new Date(birthDate);
	const now = new Date();
	const months =
		(now.getFullYear() - birth.getFullYear()) * 12 +
		(now.getMonth() - birth.getMonth());
	if (months < 12) return `${months}개월`;
	const years = Math.floor(months / 12);
	const rem = months % 12;
	return rem > 0 ? `만 ${years}세 ${rem}개월` : `만 ${years}세`;
}
