import { describe, expect, it } from "@jest/globals";
import {
	generateNBAs as generateNBA,
	type NBAContext,
} from "@/lib/engine/nba-engine";

const baseUser = {
	id: "user1",
	nickname: "테스트맘",
	children: [
		{
			id: "c1",
			name: "도토리",
			birthDate: "2023-01-15",
			gender: "male" as const,
		},
	],
	region: { sido: "서울특별시", sigungu: "강남구", dong: "역삼동" },
	interests: [],
	gpsVerified: false,
	plan: "free" as const,
	onboardingCompleted: true,
} satisfies NonNullable<NBAContext["user"]>;

describe("generateNBA", () => {
	it("includes 아이 등록 NBA when child profile is not registered", () => {
		const ctx: NBAContext = {
			user: { ...baseUser, onboardingCompleted: false, children: [] },
			interestFacilities: [],
			alertCount: 0,
			waitlistCount: 0,
		};

		const result = generateNBA(ctx);

		expect(
			result.some(
				(item) =>
					item.title.includes("프로필") && item.action?.label.includes("등록"),
			),
		).toBe(true);
	});

	it("includes 빈자리 알림 NBA when user has transfer intent signals", () => {
		const ctx: NBAContext = {
			user: baseUser,
			interestFacilities: [
				{
					id: "f1",
					name: "해오름어린이집",
					type: "국공립",
					status: "available",
					address: "서울시 강남구",
					lat: 37.4952,
					lng: 127.0266,
					capacity: { total: 30, current: 22, waiting: 1 },
					features: [],
					rating: 4.5,
					reviewCount: 10,
					lastSyncedAt: new Date().toISOString(),
				},
			],
			alertCount: 1,
			waitlistCount: 1,
		};

		const result = generateNBA(ctx);
		const vacancyNba = result.find((item) => item.id.startsWith("vacancy_"));

		expect(vacancyNba).toBeDefined();
		expect(vacancyNba?.title).toContain("빈자리");
	});

	it("includes 시설 비교 성격의 NBA when user already has interest facilities", () => {
		const ctx: NBAContext = {
			user: {
				...baseUser,
				children: [
					{
						id: "c2",
						name: "유아반아이",
						birthDate: "2021-01-10",
						gender: "female",
					},
				],
			},
			interestFacilities: [
				{
					id: "f2",
					name: "푸른어린이집",
					type: "민간",
					status: "waiting",
					address: "서울시 강남구",
					lat: 37.496,
					lng: 127.03,
					capacity: { total: 40, current: 40, waiting: 6 },
					features: [],
					rating: 4.1,
					reviewCount: 14,
					lastSyncedAt: new Date().toISOString(),
				},
			],
			alertCount: 1,
			waitlistCount: 0,
		};

		const result = generateNBA(ctx);

		expect(
			result.some((item) =>
				`${item.title} ${item.description} ${item.action?.href ?? ""}`.includes(
					"비교",
				),
			),
		).toBe(true);
	});

	it("returns default NBA without crashing for a user object with nullable-like fields", () => {
		const nullableLikeUser = {
			id: null,
			nickname: null,
			children: null,
			region: null,
			interests: null,
			gpsVerified: null,
			plan: null,
			onboardingCompleted: null,
		} as unknown as NonNullable<NBAContext["user"]>;

		const ctx: NBAContext = {
			user: nullableLikeUser,
			interestFacilities: [],
			alertCount: 0,
			waitlistCount: 0,
		};

		expect(() => generateNBA(ctx)).not.toThrow();
		const result = generateNBA(ctx);

		expect(result.length).toBeGreaterThan(0);
		expect(result[0].id).toBe("onboarding_incomplete");
	});

	it("includes waitlist-check NBA when user has pending waitlist information", () => {
		const ctx: NBAContext = {
			user: baseUser,
			interestFacilities: [],
			alertCount: 0,
			waitlistCount: 1,
			bestWaitlistPosition: 4,
			waitlistFacilityName: "해오름어린이집",
		};

		const result = generateNBA(ctx);
		const waitlistNba = result.find((item) => item.id === "waitlist_position");

		expect(waitlistNba).toBeDefined();
		expect(
			`${waitlistNba?.title ?? ""} ${waitlistNba?.description ?? ""} ${waitlistNba?.action?.label ?? ""}`,
		).toContain("대기");
	});

	it("includes alert-check style NBA when alertCount is positive", () => {
		const ctx: NBAContext = {
			user: baseUser,
			interestFacilities: [
				{
					id: "f-alert",
					name: "새싹어린이집",
					type: "국공립",
					status: "available",
					address: "서울시 강남구",
					lat: 37.494,
					lng: 127.024,
					capacity: { total: 28, current: 20, waiting: 0 },
					features: [],
					rating: 4.4,
					reviewCount: 11,
					lastSyncedAt: new Date().toISOString(),
				},
			],
			alertCount: 2,
			waitlistCount: 0,
		};

		const result = generateNBA(ctx);

		expect(
			result.some(
				(item) =>
					item.id.startsWith("vacancy_") &&
					`${item.title} ${item.action?.label ?? ""}`.includes("확인"),
			),
		).toBe(true);
	});
});
