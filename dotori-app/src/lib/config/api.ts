/**
 * 중앙화된 API 설정값 — 매직넘버 제거
 *
 * 모든 API 라우트에서 import하여 사용:
 * import { API_CONFIG } from "@/lib/config/api";
 */

export const API_CONFIG = {
	CHAT: {
		/** 채팅 히스토리 최대 메시지 수 */
		maxMessages: 200,
		/** 블록 유지 개수 */
		blocksRetainCount: 20,
		/** 유저당 동시 스트림 수 */
		maxConcurrentStreams: 2,
		/** 최대 재시도 횟수 */
		maxRetries: 2,
		/** AI 모델 */
		model: process.env.AI_MODEL || "claude-sonnet-4-6",
		/** AI 타임아웃 (ms) */
		timeoutMs: 30_000,
		/** AI max_tokens */
		maxTokens: 1500,
	},
	SYNC: {
		/** 이사랑 동기화 배치 크기 */
		batchSize: 5,
	},
	TO_PREDICTION: {
		/** 예측 유효 기간 (일) */
		validityDays: 7,
		/** 배치 처리 크기 */
		batchSize: 100,
		/** 최소 스냅샷 수 */
		minSnapshotsRequired: 3,
		/** 졸업 월 (3월) */
		graduationMonth: 3,
		/** 기본 매력도 점수 */
		defaultAttractivenessScore: 0.5,
		/** 졸업 예측: 전체 효과 월 */
		graduationProximityMonths: [1, 2, 3, 4],
		/** 졸업 예측: 감쇠 월 */
		graduationDecayMonths: [5, 6],
		/** 졸업 예측: 감쇠 계수 */
		graduationDecayFactor: 0.3,
		/** 시설 매력도 (0~1) 가중치 */
		attractiveness: {
			weights: { rating: 0.30, reviewPopularity: 0.15, evaluation: 0.25, premium: 0.10, featureRichness: 0.10, staffRatio: 0.10 },
			reviewCap: 50,
			featureCap: 10,
			idealStaffRatio: 0.25,
		},
		/** 지역 수요 계수 범위 */
		demand: { defaultFactor: 1.0, minFactor: 0.5, maxFactor: 2.0 },
	},
	COMMUNITY: {
		/** 커뮤니티 게시글 카테고리 */
		postCategories: ["question", "review", "info", "feedback"] as const,
	},
	ESIGNATURE: {
		/** 사용자당 최대 서류 수 */
		maxDocs: 50,
		/** 서류 만료 기간 (일) */
		expirationDays: 30,
	},
	SUBSCRIPTION: {
		/** 만료 알림 전 일수 */
		expiryWarningDays: 7,
		/** 기본 구독 기간 (월) */
		defaultPeriodMonths: 1,
	},
	ANALYTICS: {
		/** 개발 모드: 콘솔 출력 */
		devMode: process.env.NODE_ENV === "development",
		/** GA4 Measurement ID */
		ga4MeasurementId: process.env.NEXT_PUBLIC_GA4_ID || "",
	},
	VISIT: {
		/** 사용자당 최대 활성 견학 신청 수 */
		maxActivePerUser: 10,
	},
	REVIEW: {
		/** 사용자당 최대 리뷰 수 */
		maxPerUser: 100,
		/** 리뷰당 최대 이미지 수 */
		maxImages: 5,
	},
	MODUSIGN: {
		/** 모두싸인 API 기본 URL */
		baseUrl: process.env.MODUSIGN_BASE_URL || "https://api.modusign.co.kr",
		/** 모두싸인 타임아웃 (ms) */
		timeoutMs: 30_000,
	},
	CPA: {
		/** CPA 이벤트 TTL (일) */
		retentionDays: 730, // 2년
	},
	FACILITY_STATS: {
		/** 기본 조회 기간 (일) */
		defaultDays: 30,
		/** 최대 조회 기간 (일) */
		maxDays: 365,
	},
} as const;

export type PostCategory = (typeof API_CONFIG.COMMUNITY.postCategories)[number];
