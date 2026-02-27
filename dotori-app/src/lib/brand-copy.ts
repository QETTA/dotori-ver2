export const copy = {
	auth: {
		login: {
			titleTagline: "이동 고민 전문 AI, 토리",
			titleMain: "반편성 불만·교사 교체·빈자리, 도토리 하나로",
			subtitle: "전국 20,000+ 어린이집·유치원 데이터",
			cardHint: "1초면 시작돼요. 카카오로 바로 이용하세요.",
			quickHint: "카카오 계정으로 1초 만에 시작",
			guestBrowse: "로그인 없이 둘러보기",
			termsPrefix: "로그인 시",
			termsService: "서비스 이용약관",
			termsPrivacy: "개인정보처리방침",
			termsSuffix: "에 동의합니다",
		},
		error: {
			loginBlocked: "로그인이 잠깐 막혔어요",
			loginFailedTitle: "로그인 중 문제가 발생했어요",
			loginFailedDesc:
				"잠시 후 다시 시도해주세요. 계속되면 홈으로 이동해 다시 로그인해보세요.",
			retry: "다시 시도",
			goHome: "홈으로",
			persistentIssue: "문제가 계속되면 앱을 새로고침하거나, 잠시 뒤 다시 시도해주세요.",
		},
		errors: {
			oauthSignin: "카카오 로그인 연결에 문제가 있어요. 잠시 후 다시 시도해주세요.",
			oauthCallback: "카카오 로그인 연결에 문제가 있어요. 잠시 후 다시 시도해주세요.",
			default: "로그인에 실패했어요. 다시 시도해주세요.",
		},
	},
	global: {
		error: {
			title: "문제가 발생했어요",
			description: "앱에 오류가 발생했습니다. 다시 시도해주세요.",
			retry: "다시 시도",
		},
	},
	emptyState: {
		default: {
			title: "아직 데이터가 없어요",
			description: "표시할 정보가 아직 없어요. 잠시 후 다시 확인해 주세요.",
			eyebrow: "도토리 안내",
		},
		search: {
			eyebrow: "검색 결과 없음",
			description: "검색어 또는 조건을 조금 바꾸면 원하는 결과를 더 쉽게 찾을 수 있어요.",
		},
		transfer: {
			eyebrow: "이동 조건 안내",
			description:
				"요청하신 이동 조건에 맞는 시설을 찾지 못했어요. 지역·정렬·필터를 조정해 다시 찾아볼까요?",
		},
	},
	errorState: {
		default: {
			eyebrow: "일시적 오류",
			title: "문제가 발생했어요",
			detail: "잠시 후 다시 시도해 주세요.",
			action: "다시 시도",
		},
		network: {
			eyebrow: "네트워크 확인 필요",
			title: "연결이 불안정해요",
			detail: "인터넷 연결 상태를 확인한 뒤 다시 시도해 주세요.",
			action: "다시 시도",
		},
		notfound: {
			eyebrow: "페이지를 찾을 수 없음",
			title: "요청하신 페이지를 찾지 못했어요",
			detail: "요청하신 페이지를 찾지 못했어요. 경로를 다시 확인해 주세요.",
			action: "뒤로 가기",
		},
	},
	navigation: {
		tabs: {
			home: "홈",
			explore: "탐색",
			chat: "토리톡",
			community: "이웃",
			my: "마이",
		},
	},
	chat: {
		panelTitle: "토리톡으로 이동 전략을 바로 정리해요",
		panelDescription: "어린이집·유치원 반편성, 교사 교체, 빈자리까지 핵심만 빠르게 안내해드려요.",
		placeholder: "예) 반편성 바뀌었는데 지금 옮기는 게 좋을까?",
		suggestions: ["우리 동네 추천해줘", "국공립 비교해줘", "유치원 찾아줘", "입소 전략 짜줘"],
		emptyGuide: "어린이집·유치원 이동 고민을 AI가 분석해드려요",
		quickReplies: ["유보통합이 뭐야?", "유치원도 찾아줘", "우리 동네 추천해줘", "입소 전략 짜줘"],
	},
	landing: {
		badge: "2026 유보통합 대응",
		badgeSub: "어린이집·유치원 통합 검색",
		heroTitle: "지금 다니는 곳,\n정말 괜찮으신가요?",
		heroSub: "어린이집·유치원 이동 고민부터 입소 서류까지, 10분이면 끝나요",
		funnelTitle: "2~3시간 걸리던 일, 10분이면 끝",
		funnelSub: "어린이집·유치원 탐색부터 전자서명까지 한 번에",
		reviewTitle: "이미 많은 부모님이 이용하고 있어요",
		reviewSub: "도토리로 시설 이동을 결정한 후기",
		stats: {
			facilities: "연동 시설",
			regions: "분석 범위",
			speed: "응답 속도",
		},
	},
	home: {
		heroSubtitle: "지금 다니는 곳, 바꿀 때가 됐나요?",
		briefingTitle: "오늘 이동 판단",
		funnelGuide: "내 이동 진행 상황",
	},
	explore: {
		searchPlaceholder: "어린이집·유치원 통합 검색",
		emptyNearby: "주변에 어린이집·유치원이 없어요",
		categoryBadge: {
			daycare: "어린이집",
			kindergarten: "유치원",
		},
	},
	facility: {
		funnelLabel: "이 시설로 진행하기",
		funnelSteps: ["관심 등록", "TO예측 확인", "견학 신청", "서류 시작"],
	},
	onboarding: {
		welcome: "이동을 고민 중이시군요!",
		welcomeSub: "도토리가 최적의 시설을 찾아드릴게요",
		categoryPrompt: "어린이집? 유치원? 둘 다?",
	},
	funnel: {
		tagline: "풀퍼널 10분 완결",
		steps: ["탐색", "TO예측", "견학신청", "전자서명"],
		timeCompare: "2~3시간 → 10분",
	},
} as const;
