import type { Facility, NBAItem, UserProfile, ChildProfile } from "@/types/dotori";
import { getChildAgeMonths, formatAge, getClassAge } from "./child-age-utils";

export type { NBAItem };

export interface NBAContext {
	user: UserProfile | null;
	interestFacilities: Facility[];
	alertCount: number;
	waitlistCount: number;
	/** 대기 신청 중 가장 빠른 순번 (없으면 undefined) */
	bestWaitlistPosition?: number;
	/** 대기 중인 시설 이름 (첫 번째) */
	waitlistFacilityName?: string;
}

interface NBARule {
	id: string;
	condition: (ctx: NBAContext) => boolean;
	priority: number;
	generate: (ctx: NBAContext) => NBAItem;
}

/** 가장 어린 아이 */
function youngestChild(children: ChildProfile[]): ChildProfile | null {
	if (children.length === 0) return null;
	return children.reduce((youngest, child) =>
		new Date(child.birthDate) > new Date(youngest.birthDate) ? child : youngest,
	);
}

/** 첫 번째 아이(최상위 기준) */
function firstChild(children: ChildProfile[]): ChildProfile | null {
	if (children.length === 0) return null;
	return children[0];
}

function getChildDisplayName(children: ChildProfile[]): string {
	const child = firstChild(children);
	if (!child) return "자녀";
	const name = child.name?.trim();
	const suffix = children.length > 1 ? "(첫째 기준)" : "";
	return `${name || "자녀"}${suffix}`;
}

function getChildSubject(children: ChildProfile[]): string {
	const name = getChildDisplayName(children);
	return name.startsWith("자녀") ? `${name}가` : `${name}이(가)`;
}

/** 입소 신청 시즌 판별 (10~12월: 내년 3월 입소 신청 시기) */
function isEnrollmentSeason(): boolean {
	const month = new Date().getMonth(); // 0-indexed
	return month >= 9 && month <= 11; // 10월~12월
}

/** 입소 대기 시즌 판별 (1~2월: 결과 발표 대기 시기) */
function isWaitingSeason(): boolean {
	const month = new Date().getMonth();
	return month <= 1; // 1월~2월
}

/** 입소 시작 시즌 판별 (3월) */
function isEnrollmentStartMonth(): boolean {
	return new Date().getMonth() === 2; // 3월
}

/* ── 규칙 정의 ── */

const rules: NBARule[] = [
	// ── 최우선: 온보딩 미완료 ──
	{
		id: "onboarding_incomplete",
		priority: 100,
		condition: (ctx) => !!ctx.user && !ctx.user.onboardingCompleted,
		generate: () => ({
			id: "onboarding_incomplete",
			title: "프로필을 완성해보세요",
			description: "아이 정보를 등록하면 맞춤 입소 전략을 받을 수 있어요",
			action: { label: "등록하기", href: "/onboarding" },
			priority: 100,
		}),
	},

	// ── 관심 시설 TO 발생 (아이 이름 포함) ──
	{
		id: "vacancy_alert",
		priority: 95,
		condition: (ctx) =>
			ctx.interestFacilities.some((f) => f.status === "available"),
		generate: (ctx) => {
			const facility = ctx.interestFacilities.find(
				(f) => f.status === "available",
			);
			if (!facility) {
				return {
					id: "vacancy_generic",
					title: "관심 시설에 빈자리가 있어요!",
					description: "지금 바로 확인하고 신청하세요",
					action: { label: "확인하기", href: "/my/interests" },
					priority: 95,
				};
			}
			const childMsg = getChildSubject(ctx.user?.children || []);
			return {
				id: `vacancy_${facility.id}`,
				title: `${facility.name}에 빈자리가 생겼어요!`,
				description: `${childMsg} 갈 수 있는 자리가 생겼어요. 서둘러 확인하세요`,
				action: {
					label: "바로 확인",
					href: `/facility/${facility.id}`,
				},
				priority: 95,
			};
		},
	},

	// ── 대기 순번 알림 (실제 순번 포함) ──
	{
		id: "waitlist_position",
		priority: 88,
		condition: (ctx) =>
			ctx.waitlistCount > 0 && ctx.bestWaitlistPosition !== undefined,
		generate: (ctx) => {
			const pos = ctx.bestWaitlistPosition!;
			const facilityName = ctx.waitlistFacilityName || "시설";
			const waitlistMessage =
				pos <= 3
					? "곧 입소 연락이 올 수 있어요! 미리 서류를 준비하세요"
					: pos <= 10
						? "대기 순번이 가까워지고 있어요. 입소 의향을 다시 확인해두세요"
						: "대기 중인 시설 현황을 정기적으로 확인해보세요";
			const desc =
				`${facilityName} ${waitlistMessage}`;
			return {
				id: "waitlist_position",
				title:
					pos <= 3
						? `대기 순번 ${pos}번째 — 거의 다 왔어요!`
						: `대기 현황을 확인하세요`,
				description: desc,
				action: { label: "대기 현황", href: "/my/waitlist" },
				priority: 88,
			};
		},
	},

	// ── 입소 신청 시즌 안내 (10~12월) ──
	{
		id: "enrollment_season",
		priority: 85,
		condition: (ctx) => {
			if (!ctx.user?.onboardingCompleted) return false;
			if (!isEnrollmentSeason()) return false;
			const child = youngestChild(ctx.user.children);
			if (!child) return false;
			// 내년 3월 1일 기준으로 0~5세인 아이만
			const nextMarch = new Date(new Date().getFullYear() + 1, 2, 1);
			const ageMonths = getChildAgeMonths(child.birthDate, nextMarch);
			return ageMonths >= 0 && ageMonths < 72;
		},
		generate: (ctx) => {
			const child = youngestChild(ctx.user!.children)!;
			const nextYear = new Date().getFullYear() + 1;
			const { className } = getClassAge(child.birthDate, nextYear);
			const childLabel = getChildDisplayName(ctx.user!.children);
			return {
				id: "enrollment_season",
				title: `${nextYear}년 3월 입소 신청 시즌이에요`,
				description: `${childLabel}은(는) ${className} 대상이에요. 아이사랑에서 입소 신청을 준비하세요`,
				action: { label: "입소 전략 보기", href: "/chat?prompt=입소전략" },
				priority: 85,
			};
		},
	},

	// ── 입소 대기 시즌 안내 (1~2월) ──
	{
		id: "waiting_season",
		priority: 82,
		condition: (ctx) => {
			if (!ctx.user?.onboardingCompleted) return false;
			if (!isWaitingSeason()) return false;
			return ctx.waitlistCount > 0;
		},
		generate: () => ({
			id: "waiting_season",
			title: "입소 결과 발표 시기예요",
			description:
				"대기 순번 변동이 있을 수 있어요. 알림을 켜두면 바로 알려드릴게요",
			action: { label: "알림 설정", href: "/my/settings" },
			priority: 82,
		}),
	},

	// ── 3월 입소 시작 ──
	{
		id: "enrollment_start",
		priority: 80,
		condition: (ctx) => {
			if (!ctx.user?.onboardingCompleted) return false;
			return isEnrollmentStartMonth() && ctx.waitlistCount > 0;
		},
		generate: () => ({
			id: "enrollment_start",
			title: "3월 신학기가 시작되었어요",
			description:
				"입소 확정 여부를 확인하고, TO가 생기면 바로 알려드릴게요",
			action: { label: "대기 현황", href: "/my/waitlist" },
			priority: 80,
		}),
	},

		{
			id: "class_assignment_season",
			priority: 90,
			condition: () => {
				const month = new Date().getMonth(); // 0-indexed
				return month === 2; // 3월
			},
		generate: () => ({
			id: "class_assignment_season",
			title: "반편성 결과 발표 시즌이에요",
			description:
				"마음에 안 드신다면 지금이 이동 골든타임! 빈자리 있는 시설을 바로 확인해보세요.",
			action: { label: "빈자리 탐색", href: "/explore" },
			priority: 90,
		}),
	},

		{
			id: "orientation_season",
			priority: 85,
			condition: () => {
				const month = new Date().getMonth();
				return month === 1; // 2월
			},
		generate: () => ({
			id: "orientation_season",
			title: "설명회 다녀오셨나요?",
			description:
				"기대와 달랐다면 지금 다른 시설도 살펴보세요. 2월이 연중 이동이 가장 많은 달이에요.",
			action: { label: "시설 탐색", href: "/explore" },
			priority: 85,
		}),
	},

	// ── 아이 나이 기반 시설 유형 추천 ──
	{
		id: "age_based_recommend",
		priority: 75,
		condition: (ctx) => {
			if (!ctx.user?.onboardingCompleted) return false;
			if (ctx.interestFacilities.length > 2) return false; // 이미 충분히 탐색한 경우 스킵
			const child = youngestChild(ctx.user.children);
			if (!child) return false;
			return getChildAgeMonths(child.birthDate) >= 0;
		},
		generate: (ctx) => {
			const child = youngestChild(ctx.user!.children)!;
			const months = getChildAgeMonths(child.birthDate);
			const age = formatAge(months);
			const childLabel = getChildDisplayName(ctx.user!.children);
			let suggestion: string;
			let prompt: string;

			if (months < 12) {
				suggestion =
					"영아 전문 가정어린이집이나 국공립을 추천해요";
				prompt = "영아 가정어린이집 추천";
			} else if (months < 24) {
				suggestion = "1세반 정원이 넉넉한 시설을 찾아볼까요?";
				prompt = "1세반 추천";
			} else if (months < 36) {
				suggestion = "2세반은 경쟁이 치열해요. 미리 대기 신청을 권해요";
				prompt = "2세반 대기전략";
			} else {
				suggestion = "유아반은 선택지가 넓어요. 프로그램 비교를 추천해요";
				prompt = "유아반 프로그램 비교";
			}

			return {
				id: "age_based_recommend",
				title: `${childLabel} (${age}) 맞춤 추천`,
				description: suggestion,
				action: {
					label: "토리에게 물어보기",
					href: `/chat?prompt=${encodeURIComponent(prompt)}`,
				},
				priority: 75,
			};
		},
	},

	// ── 관심 시설 미등록 ──
	{
		id: "no_interests",
		priority: 70,
		condition: (ctx) =>
			!!ctx.user &&
			ctx.user.onboardingCompleted &&
			ctx.interestFacilities.length === 0,
		generate: (ctx) => {
			const child = youngestChild(ctx.user!.children);
			const region = ctx.user!.region?.sigungu || "우리 동네";
			const childLabel = getChildDisplayName(ctx.user!.children);
			const desc = child
				? `${region}에서 ${childLabel}에게 맞는 어린이집을 찾아보세요`
				: `${region} 어린이집을 탐색하고 관심 등록하세요`;
			return {
				id: "no_interests",
				title: "관심 시설을 등록해보세요",
				description: desc,
				action: { label: "탐색하기", href: "/explore" },
				priority: 70,
			};
		},
	},

	// ── 대기 신청은 했지만 알림 미설정 ──
	{
		id: "no_alerts",
		priority: 60,
		condition: (ctx) =>
			!!ctx.user && ctx.user.onboardingCompleted && ctx.interestFacilities.length > 0 && ctx.alertCount === 0,
		generate: () => ({
			id: "no_alerts",
			title: "알림을 설정해보세요",
			description: "빈자리가 생기면 바로 알려드려요",
			action: { label: "설정하기", href: "/my/settings" },
			priority: 60,
		}),
	},

	{
		id: "login_prompt_transfer",
		priority: 30,
		condition: (ctx) => !ctx.user,
		generate: () => ({
			id: "login_prompt_transfer",
			title: "이동 알림 받으려면 로그인하세요",
			description: "관심 시설에 자리가 나면 즉시 알려드려요.",
			action: { label: "카카오 로그인", href: "/login" },
			priority: 30,
		}),
	},

	// ── 주간 리포트 ──
	{
		id: "weekly_report",
		priority: 30,
		condition: (ctx) => !!ctx.user && ctx.user.onboardingCompleted,
		generate: (ctx) => {
			const region = ctx.user!.region?.sigungu;
			const title = region
				? `${region} 이번 주 어린이집 현황`
				: "이번 주 어린이집 현황";
			return {
				id: "weekly_report",
				title,
				description: "토리에게 이번 주 변동 사항을 물어보세요",
				action: { label: "물어보기", href: "/chat" },
				priority: 30,
			};
		},
	},
];

const loginNBA: NBAItem = {
	id: "login_cta",
	title: "로그인하고 맞춤 추천 받기",
	description: "카카오로 간편하게 시작하세요",
	action: { label: "로그인", href: "/login" },
	priority: 50,
};

export function generateNBAs(ctx: NBAContext): NBAItem[] {
	if (!ctx.user) {
		return [loginNBA];
	}

	return rules
		.filter((rule) => rule.condition(ctx))
		.sort((a, b) => b.priority - a.priority)
		.slice(0, 3)
		.map((rule) => rule.generate(ctx));
}
