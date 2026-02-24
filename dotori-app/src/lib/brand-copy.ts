export const copy = {
	auth: {
		login: {
			titleTagline: "이동 고민 전문 AI, 토리",
			titleMain: "반편성 불만·교사 교체·빈자리, 도토리 하나로",
			subtitle: "전국 20,000+ 어린이집 데이터",
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
			chat: "토리챗",
			community: "이웃",
			my: "마이",
		},
	},
	chat: {
		panelTitle: "이동 고민이라면 뭐든 물어보세요",
		panelDescription: "반편성, 교사 교체, 빈자리까지 토리가 함께 정리해드려요.",
		placeholder: "어린이집 고민을 말씀해주세요",
		suggestions: ["우리 동네 추천해줘", "국공립 비교해줘", "입소 전략 짜줘"],
	},
} as const;
