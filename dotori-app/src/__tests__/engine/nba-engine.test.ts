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
});
