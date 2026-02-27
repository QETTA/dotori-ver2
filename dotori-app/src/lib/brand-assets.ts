/**
 * Dotori Brand Assets — SVG 경로 레지스트리
 * /public/brand/ 폴더의 21개 SVG를 타입 안전하게 참조합니다.
 *
 * 어떤 에셋을 써야 할지 모를 때는 BRAND_GUIDE를 참고하세요.
 */

export const BRAND = {
	// ── 심볼 (도토리 아이콘만, 텍스트 없음) ──

	/** 앱 내부 소형 아이콘, SourceChip, 워터마크 등 — 가장 범용 심볼 */
	symbol: "/brand/dotori-symbol.svg",
	/** 기업/B2B 문서용 심볼 (차분한 톤) */
	symbolCorporate: "/brand/dotori-symbol-corporate.svg",
	/** 다크 배경 위에서 사용하는 흑백 심볼 */
	symbolMonoDark: "/brand/dotori-symbol-mono-dark.svg",
	/** 어두운 배경 위에서 사용하는 흰색 심볼 (다크모드 헤더 등) */
	symbolMonoWhite: "/brand/dotori-symbol-mono-white.svg",

	// ── 로고 락업 (심볼 + 워드마크 조합) ──

	/** 가로형 로고 — 넓은 공간, 영문 워드마크 */
	lockupHorizontal: "/brand/dotori-lockup-horizontal.svg",
	/** 가로형 로고 — 한국어 워드마크 ★ 앱 헤더/네비게이션 기본 */
	lockupHorizontalKr: "/brand/dotori-lockup-horizontal-kr.svg",
	/** 가로형 로고 — 기업/투자 자료용 */
	lockupCorporate: "/brand/dotori-lockup-corporate.svg",
	/** 세로 정렬 로고 — 스퀘어 공간 (OG 이미지 등) */
	lockupStacked: "/brand/dotori-lockup-stacked.svg",
	/** 세로 정렬 로고 — 기업/투자 자료용 */
	lockupStackedCorp: "/brand/dotori-lockup-stacked-corporate.svg",

	// ── 앱 아이콘 ──

	/** 따뜻한 브라운 그라데이션 앱 아이콘 ★ 스플래시/온보딩 기본 */
	appIconWarm: "/brand/dotori-app-icon-warm.svg",
	/** 다크 앱 아이콘 (다크모드 온보딩, 앱스토어 다크 배경) */
	appIconDark: "/brand/dotori-app-icon-dark.svg",
	/** 단순화된 앱 아이콘 (소형 표시, 알림 뱃지 등) */
	appIconSimple: "/brand/dotori-app-icon-simplified.svg",

	// ── 파비콘 ──

	/** 브라우저 탭 파비콘 */
	favicon: "/brand/dotori-favicon.svg",

	// ── 마케팅 / 소셜 ──

	/** OG 이미지 (링크 공유 시 미리보기) */
	ogImage: "/brand/dotori-og-image.svg",
	/** 소셜 프로필 — 그라데이션 배경 버전 */
	socialGradient: "/brand/dotori-social-profile-gradient.svg",
	/** 소셜 프로필 — 크림 배경 버전 */
	socialCream: "/brand/dotori-social-profile-cream.svg",
	/** 이메일 서명 */
	emailSignature: "/brand/dotori-email-signature.svg",

	// ── UI 상태 / 장식 ──

	/** 배경 워터마크 — aria-hidden, opacity 0.04~0.06 권장 */
	watermark: "/brand/dotori-watermark.svg",
	/** 빈 상태 일러스트 (검색 결과 없음, 목록 비어있음 등) */
	emptyState: "/brand/dotori-empty-state.svg",
	/** 에러 상태 일러스트 (네트워크 오류, 데이터 로드 실패 등) */
	errorState: "/brand/dotori-error-state.svg",
} as const;

/**
 * 상황별 권장 에셋 가이드
 *
 * @example
 * // 앱 내부 소형 아이콘
 * <img src={BRAND_GUIDE.inApp} alt="" aria-hidden="true" className="h-7 w-7" />
 *
 * // 다크모드 헤더
 * <img src={isDark ? BRAND_GUIDE.darkBg : BRAND_GUIDE.header} alt="도토리" />
 */
export const BRAND_GUIDE = {
	/** 앱 내부 소형 아이콘 (SourceChip, 브리핑 카드 등) */
	inApp:      BRAND.symbol,
	/** 앱 헤더/네비게이션 로고 (한국어 워드마크) */
	header:     BRAND.lockupHorizontalKr,
	/** 스플래시 / 온보딩 대형 아이콘 */
	splash:     BRAND.appIconWarm,
	/** 다크 배경 위 심볼 (다크모드 헤더, 다크 온보딩) */
	darkBg:     BRAND.symbolMonoWhite,
	/** 빈 상태 화면 */
	emptyState: BRAND.emptyState,
	/** 에러 화면 */
	errorState: BRAND.errorState,
	/** 배경 워터마크 (opacity 낮게 사용) */
	watermark:  BRAND.watermark,
} as const;

/**
 * 페이지 타입 → 추천 에셋 매핑
 *
 * @example
 * const { watermark, icon } = BRAND_CONTEXT.home
 * <BrandWatermark />
 * <img src={icon} ... />
 */
export const BRAND_CONTEXT = {
	home:       { watermark: BRAND.watermark, icon: BRAND.symbol },
	explore:    { empty: BRAND.emptyState, icon: BRAND.symbol },
	my:         { empty: BRAND.emptyState, icon: BRAND.symbol },
	community:  { empty: BRAND.emptyState, icon: BRAND.appIconWarm },
	facility:   { icon: BRAND.symbol, error: BRAND.errorState },
	chat:       { icon: BRAND.symbol },
	landing:    { lockup: BRAND.lockupHorizontalKr, watermark: BRAND.watermark },
	login:      { splash: BRAND.appIconWarm },
	onboarding: { splash: BRAND.appIconWarm },
	error:      { illustration: BRAND.errorState },
	notFound:   { illustration: BRAND.errorState },
} as const;
