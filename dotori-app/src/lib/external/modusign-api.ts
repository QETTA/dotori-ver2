/**
 * 모두싸인 API 스캐폴드
 *
 * 환경변수: MODUSIGN_API_KEY, MODUSIGN_API_SECRET
 * 미설정 시 스텁 응답 + 경고 로그.
 * 서킷 브레이커 연동.
 *
 * 패턴: kindergarten-api.ts 동일
 */
import { log } from "@/lib/logger";

const MODUSIGN_API_KEY = process.env.MODUSIGN_API_KEY || "";
const MODUSIGN_API_SECRET = process.env.MODUSIGN_API_SECRET || "";
const MODUSIGN_BASE_URL = process.env.MODUSIGN_BASE_URL || "https://api.modusign.co.kr";

export interface ModusignDocument {
	id: string;
	title: string;
	status: "draft" | "pending" | "signed" | "expired" | "cancelled";
	signedAt?: string;
	fileUrl?: string;
}

/**
 * 모두싸인 환경변수 설정 여부 확인
 */
export function isModusignConfigured(): boolean {
	return Boolean(MODUSIGN_API_KEY && MODUSIGN_API_SECRET);
}

/**
 * 모두싸인 문서 생성
 */
export async function createDocument(params: {
	title: string;
	signerEmail: string;
	signerName: string;
	fileBase64?: string;
}): Promise<ModusignDocument> {
	if (!isModusignConfigured()) {
		log.warn("모두싸인 API 미설정 — 스텁 응답 반환");
		return {
			id: `stub-${Date.now()}`,
			title: params.title,
			status: "draft",
		};
	}

	let breaker: { execute: <T>(fn: () => Promise<T>, fallback?: T) => Promise<T> } | undefined;
	try {
		const mod = await import("@/lib/external/circuit-breakers");
		breaker = mod.modusignBreaker;
	} catch {
		// circuit-breakers not available yet
	}

	const doFetch = async (): Promise<ModusignDocument> => {
		const response = await fetch(`${MODUSIGN_BASE_URL}/documents`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${MODUSIGN_API_KEY}`,
				"X-API-Secret": MODUSIGN_API_SECRET,
			},
			body: JSON.stringify({
				title: params.title,
				signers: [
					{
						email: params.signerEmail,
						name: params.signerName,
					},
				],
				file: params.fileBase64 || undefined,
			}),
			signal: AbortSignal.timeout(30_000),
		});

		if (!response.ok) {
			throw new Error(`모두싸인 API 오류: HTTP ${response.status}`);
		}

		const data = await response.json();
		return {
			id: data.id,
			title: data.title,
			status: data.status || "draft",
		};
	};

	if (breaker) {
		return breaker.execute(doFetch);
	}
	return doFetch();
}

/**
 * 모두싸인 문서 상태 조회
 */
export async function getDocumentStatus(
	documentId: string,
): Promise<ModusignDocument> {
	if (!isModusignConfigured()) {
		log.warn("모두싸인 API 미설정 — 스텁 응답 반환");
		return {
			id: documentId,
			title: "",
			status: "draft",
		};
	}

	const response = await fetch(
		`${MODUSIGN_BASE_URL}/documents/${documentId}`,
		{
			headers: {
				Authorization: `Bearer ${MODUSIGN_API_KEY}`,
				"X-API-Secret": MODUSIGN_API_SECRET,
			},
			signal: AbortSignal.timeout(30_000),
		},
	);

	if (!response.ok) {
		throw new Error(`모두싸인 API 오류: HTTP ${response.status}`);
	}

	const data = await response.json();
	return {
		id: data.id,
		title: data.title,
		status: data.status,
		signedAt: data.signedAt,
		fileUrl: data.fileUrl,
	};
}

/**
 * 모두싸인 서명 완료 PDF 다운로드
 */
export async function getSignedPdf(
	documentId: string,
): Promise<Uint8Array | null> {
	if (!isModusignConfigured()) {
		log.warn("모두싸인 API 미설정 — null 반환");
		return null;
	}

	const response = await fetch(
		`${MODUSIGN_BASE_URL}/documents/${documentId}/file`,
		{
			headers: {
				Authorization: `Bearer ${MODUSIGN_API_KEY}`,
				"X-API-Secret": MODUSIGN_API_SECRET,
			},
			signal: AbortSignal.timeout(60_000),
		},
	);

	if (!response.ok) {
		throw new Error(`모두싸인 PDF 다운로드 실패: HTTP ${response.status}`);
	}

	const buffer = await response.arrayBuffer();
	return new Uint8Array(buffer);
}
