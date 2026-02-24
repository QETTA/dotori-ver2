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
} as const;
