import { describe, expect, it } from "vitest";
import { toFacilityDTO, toPostDTO, toTOPredictionDTO, toChildProfile } from "@/lib/dto";

/* ─── Helpers ─── */

type FacilityDocument = Parameters<typeof toFacilityDTO>[0];

const buildFacilityDocument = (overrides: Partial<FacilityDocument> = {}): FacilityDocument => ({
	_id: "facility-1",
	name: "강남유치원",
	type: "국공립",
	status: "available",
	address: "서울특별시 강남구",
	capacity: { total: 30, current: 24, waiting: 3 },
	features: ["영어", "낮잠"],
	rating: 4.3,
	reviewCount: 12,
	dataQuality: { score: 80, missing: ["사진"] },
	...overrides,
});

/* ─── toFacilityDTO ─── */

describe("toFacilityDTO", () => {
	/* ── ID 매핑 ── */

	it("_id → id 문자열 변환", () => {
		expect(toFacilityDTO(buildFacilityDocument({ _id: "abc123" })).id).toBe("abc123");
	});

	it("_id 없으면 id 필드 사용", () => {
		expect(toFacilityDTO(buildFacilityDocument({ _id: undefined, id: "fallback-id" })).id).toBe("fallback-id");
	});

	/* ── 좌표 ── */

	it("location.coordinates [lng, lat] → lat, lng 역매핑", () => {
		const f = toFacilityDTO(buildFacilityDocument({ location: { coordinates: [127.05, 37.50] } }));
		expect(f.lng).toBe(127.05);
		expect(f.lat).toBe(37.50);
	});

	it("location 없으면 lat=0, lng=0", () => {
		const f = toFacilityDTO(buildFacilityDocument());
		expect(f.lat).toBe(0);
		expect(f.lng).toBe(0);
	});

	/* ── 거리 ── */

	it("distanceMeters 파라미터 우선 적용 → formatDistance 결과", () => {
		expect(toFacilityDTO(buildFacilityDocument(), 1500).distance).toBe("1.5km");
	});

	it("distanceMeters 없고 doc.distance 있으면 doc.distance 사용", () => {
		expect(toFacilityDTO(buildFacilityDocument({ distance: 500 })).distance).toBe("500m");
	});

	it("거리 정보 없으면 distance undefined", () => {
		expect(toFacilityDTO(buildFacilityDocument()).distance).toBeUndefined();
	});

	/* ── Premium ── */

	it("premium.isActive=true → premium 객체 포함, plan/features/sortBoost 정확", () => {
		const f = toFacilityDTO(buildFacilityDocument({
			premium: {
				isActive: true,
				plan: "pro",
				features: ["우선순위", "리포트"],
				sortBoost: 5,
				verifiedAt: "2026-02-01T00:00:00.000Z",
				startDate: "2026-01-01T00:00:00.000Z",
				endDate: "2026-12-31T23:59:59.999Z",
			},
		}));
		expect(f.premium).toBeDefined();
		expect(f.premium!.isActive).toBe(true);
		expect(f.premium!.plan).toBe("pro");
		expect(f.premium!.features).toEqual(["우선순위", "리포트"]);
		expect(f.premium!.sortBoost).toBe(5);
		expect(f.premium!.verifiedAt).toBe("2026-02-01T00:00:00.000Z");
		expect(f.isPremium).toBe(true);
	});

	it("premium.isActive=false → premium 프로퍼티 없음", () => {
		const f = toFacilityDTO(buildFacilityDocument({
			premium: { isActive: false, plan: "basic", features: [], sortBoost: 0 },
		}));
		expect(f).not.toHaveProperty("premium");
		expect(f.isPremium).toBe(false);
	});

	it("premium 필드 자체가 없으면 → premium 프로퍼티 없음", () => {
		const f = toFacilityDTO(buildFacilityDocument());
		expect(f).not.toHaveProperty("premium");
	});

	/* ── premiumProfile ── */

	it("premiumProfile 있으면 directorMessage/photos 등 매핑", () => {
		const f = toFacilityDTO(buildFacilityDocument({
			premiumProfile: {
				directorMessage: "환영합니다",
				photos: ["a.jpg", "b.jpg"],
				programs: ["영어", "수학"],
				highlights: ["넓은 운동장"],
				contactNote: "평일 09-18시",
			},
		}));
		expect(f.premiumProfile).toEqual({
			directorMessage: "환영합니다",
			photos: ["a.jpg", "b.jpg"],
			programs: ["영어", "수학"],
			highlights: ["넓은 운동장"],
			contactNote: "평일 09-18시",
		});
	});

	it("premiumProfile 없으면 undefined", () => {
		expect(toFacilityDTO(buildFacilityDocument()).premiumProfile).toBeUndefined();
	});

	/* ── 날짜 변환 ── */

	it("Date 타입 lastSyncedAt → ISO 문자열", () => {
		const date = new Date("2026-02-15T10:00:00.000Z");
		const f = toFacilityDTO(buildFacilityDocument({ lastSyncedAt: date }));
		expect(f.lastSyncedAt).toBe("2026-02-15T10:00:00.000Z");
	});

	it("문자열 lastSyncedAt → 그대로 통과", () => {
		const f = toFacilityDTO(buildFacilityDocument({ lastSyncedAt: "2026-01-01T00:00:00Z" }));
		expect(f.lastSyncedAt).toBe("2026-01-01T00:00:00Z");
	});

	/* ── 기본값 ── */

	it("features undefined → 빈 배열", () => {
		expect(toFacilityDTO(buildFacilityDocument({ features: undefined })).features).toEqual([]);
	});

	it("rating/reviewCount undefined → 0", () => {
		const f = toFacilityDTO(buildFacilityDocument({ rating: undefined, reviewCount: undefined }));
		expect(f.rating).toBe(0);
		expect(f.reviewCount).toBe(0);
	});

	it("images undefined → 빈 배열", () => {
		expect(toFacilityDTO(buildFacilityDocument({ images: undefined })).images).toEqual([]);
	});

	/* ── dataQuality ── */

	it("dataQuality 있으면 score/missing 매핑", () => {
		const f = toFacilityDTO(buildFacilityDocument({ dataQuality: { score: 90, missing: ["전화번호"] } }));
		expect(f.dataQuality).toEqual({ score: 90, missing: ["전화번호"], updatedAt: undefined });
	});

	it("dataQuality.updatedAt Date → ISO 문자열 변환", () => {
		const d = new Date("2026-02-20T08:00:00.000Z");
		const f = toFacilityDTO(buildFacilityDocument({ dataQuality: { score: 80, missing: [], updatedAt: d } }));
		expect(f.dataQuality!.updatedAt).toBe("2026-02-20T08:00:00.000Z");
	});

	it("dataQuality.updatedAt 문자열 → 그대로 통과", () => {
		const f = toFacilityDTO(buildFacilityDocument({ dataQuality: { score: 80, missing: [], updatedAt: "2026-01-01" } }));
		expect(f.dataQuality!.updatedAt).toBe("2026-01-01");
	});

	it("dataQuality 없으면 undefined", () => {
		expect(toFacilityDTO(buildFacilityDocument({ dataQuality: undefined })).dataQuality).toBeUndefined();
	});

	/* ── distanceMeters 우선순위 ── */

	it("distanceMeters와 doc.distance 동시 존재 → distanceMeters 우선", () => {
		const f = toFacilityDTO(buildFacilityDocument({ distance: 500 }), 1500);
		expect(f.distance).toBe("1.5km"); // distanceMeters=1500 우선, doc.distance=500 무시
	});

	/* ── toIsoDate fallback 동작 ── */

	it("lastSyncedAt undefined → 빈 문자열 (String(undefined ?? ''))", () => {
		const f = toFacilityDTO(buildFacilityDocument({ lastSyncedAt: undefined }));
		expect(f.lastSyncedAt).toBe("");
	});

	it("createdAt Date → ISO 변환", () => {
		const d = new Date("2026-01-15T09:00:00.000Z");
		const f = toFacilityDTO(buildFacilityDocument({ createdAt: d }));
		expect(f.createdAt).toBe("2026-01-15T09:00:00.000Z");
	});

	it("updatedAt Date → ISO 변환", () => {
		const d = new Date("2026-02-20T12:00:00.000Z");
		const f = toFacilityDTO(buildFacilityDocument({ updatedAt: d }));
		expect(f.updatedAt).toBe("2026-02-20T12:00:00.000Z");
	});

	it("premiumExpiresAt Date → ISO 변환", () => {
		const d = new Date("2026-12-31T23:59:59.000Z");
		const f = toFacilityDTO(buildFacilityDocument({ premiumExpiresAt: d }));
		expect(f.premiumExpiresAt).toBe("2026-12-31T23:59:59.000Z");
	});

	it("premiumExpiresAt 문자열 → 그대로 통과", () => {
		const f = toFacilityDTO(buildFacilityDocument({ premiumExpiresAt: "2026-12-31" }));
		expect(f.premiumExpiresAt).toBe("2026-12-31");
	});

	it("premium.verifiedAt Date → toIsoDate로 ISO 변환", () => {
		const d = new Date("2026-02-01T00:00:00.000Z");
		const f = toFacilityDTO(buildFacilityDocument({
			premium: { isActive: true, plan: "pro", features: [], sortBoost: 0, verifiedAt: d },
		}));
		expect(f.premium!.verifiedAt).toBe("2026-02-01T00:00:00.000Z");
	});

	it("premium.verifiedAt 없으면 undefined", () => {
		const f = toFacilityDTO(buildFacilityDocument({
			premium: { isActive: true, plan: "basic", features: [], sortBoost: 0 },
		}));
		expect(f.premium!.verifiedAt).toBeUndefined();
	});

	/* ── toIsoDate fallback: 잘못된 입력 → 현재 시각 ── */

	it("toIsoDate: 빈 문자열 verifiedAt → ternary에서 undefined (falsy 분기)", () => {
		// "" is falsy → `doc.premium.verifiedAt ? toIsoDate(...) : undefined` → undefined
		const f = toFacilityDTO(buildFacilityDocument({
			premium: { isActive: true, plan: "basic", features: [], sortBoost: 0, verifiedAt: "" },
		}));
		expect(f.premium!.verifiedAt).toBeUndefined();
	});

	it("toIsoDate: 유효하지 않은 문자열 → 현재 시각 fallback", () => {
		const before = new Date().toISOString();
		const f = toFacilityDTO(buildFacilityDocument({
			premium: { isActive: true, plan: "basic", features: [], sortBoost: 0, verifiedAt: "invalid-date-string" },
		}));
		const after = new Date().toISOString();
		// "invalid-date-string" is truthy → toIsoDate 진입 → new Date("invalid-date-string") = Invalid Date
		// Number.isFinite(NaN) = false → fallback: new Date().toISOString()
		expect(f.premium!.verifiedAt! >= before).toBe(true);
		expect(f.premium!.verifiedAt! <= after).toBe(true);
	});

	it("toIsoDate: Invalid Date 객체 → 현재 시각 fallback", () => {
		const before = new Date().toISOString();
		const f = toFacilityDTO(buildFacilityDocument({
			premium: { isActive: true, plan: "basic", features: [], sortBoost: 0, verifiedAt: new Date("invalid") },
		}));
		const after = new Date().toISOString();
		expect(f.premium!.verifiedAt! >= before).toBe(true);
		expect(f.premium!.verifiedAt! <= after).toBe(true);
	});

	/* ── 기타 필드 매핑 ── */

	it("website = homepage 미러링", () => {
		const f = toFacilityDTO(buildFacilityDocument({ homepage: "https://example.com" }));
		expect(f.website).toBe("https://example.com");
		expect(f.homepage).toBe("https://example.com");
	});

	it("kakaoPlaceUrl 빈 문자열 → undefined (falsy 필터링)", () => {
		const f = toFacilityDTO(buildFacilityDocument({ kakaoPlaceUrl: "", kakaoPlaceId: "" }));
		expect(f.kakaoPlaceUrl).toBeUndefined();
		expect(f.kakaoPlaceId).toBeUndefined();
	});

	it("region 객체 그대로 통과", () => {
		const region = { sido: "서울특별시", sigungu: "강남구", dong: "역삼동" };
		const f = toFacilityDTO(buildFacilityDocument({ region }));
		expect(f.region).toEqual(region);
	});
});

/* ─── toPostDTO ─── */

describe("toPostDTO", () => {
	it("기본 필드 매핑: id, content, category", () => {
		const p = toPostDTO({ _id: "post-1", content: "테스트", category: "info" });
		expect(p.id).toBe("post-1");
		expect(p.content).toBe("테스트");
		expect(p.category).toBe("info");
	});

	it("author 필드 우선: nickname/verified 직접 매핑", () => {
		const p = toPostDTO({
			_id: "p1",
			content: "글",
			category: "feedback",
			author: { nickname: "도토리맘", name: "김철수", verified: true, image: "av.jpg" },
		});
		expect(p.author.nickname).toBe("도토리맘");
		expect(p.author.verified).toBe(true);
	});

	it("author 없고 populated authorId → authorId에서 추출", () => {
		const p = toPostDTO({
			_id: "p2",
			content: "글",
			category: "question",
			authorId: { _id: "u1", name: "홍길동", nickname: "길동이", image: "face.jpg", gpsVerified: true },
		});
		expect(p.author.nickname).toBe("길동이");
		expect(p.author.avatar).toBe("face.jpg");
		expect(p.author.verified).toBe(true);
		expect(p.authorId).toBe("u1"); // _id에서 문자열 변환
	});

	it("author도 authorId도 없으면 → 익명, verified=false", () => {
		const p = toPostDTO({ _id: "p3", content: "글", category: "review" });
		expect(p.author.nickname).toBe("익명");
		expect(p.author.verified).toBe(false);
	});

	it("authorId가 문자열(비 populated) → authorId 그대로 반환", () => {
		const p = toPostDTO({
			_id: "p4",
			content: "글",
			category: "info",
			authorId: "raw-user-id-string",
		});
		expect(p.authorId).toBe("raw-user-id-string");
		// populatedAuthorId는 null이므로 author fallback → 익명
		expect(p.author.nickname).toBe("익명");
	});

	it("likes/commentCount 기본값 0", () => {
		const p = toPostDTO({ _id: "p", content: "c", category: "info" });
		expect(p.likes).toBe(0);
		expect(p.commentCount).toBe(0);
	});

	it("likes/commentCount 명시적 값 유지", () => {
		const p = toPostDTO({ _id: "p", content: "c", category: "info", likes: 42, commentCount: 7 });
		expect(p.likes).toBe(42);
		expect(p.commentCount).toBe(7);
	});

	it("likedBy 문자열 배열로 변환", () => {
		const p = toPostDTO({ _id: "p", content: "c", category: "info", likedBy: ["u1", "u2"] });
		expect(p.likedBy).toEqual(["u1", "u2"]);
	});

	it("likedBy 없으면 빈 배열", () => {
		expect(toPostDTO({ _id: "p", content: "c", category: "info" }).likedBy).toEqual([]);
	});

	it("facilityTags 기본값 빈 배열", () => {
		expect(toPostDTO({ _id: "p", content: "c", category: "info" }).facilityTags).toEqual([]);
	});

	it("Date createdAt → ISO 문자열", () => {
		const d = new Date("2026-02-15T10:00:00.000Z");
		const p = toPostDTO({ _id: "p", content: "c", category: "info", createdAt: d });
		expect(p.createdAt).toBe("2026-02-15T10:00:00.000Z");
	});

	it("문자열 createdAt → 그대로 통과", () => {
		const p = toPostDTO({ _id: "p", content: "c", category: "info", createdAt: "2026-01-01" });
		expect(p.createdAt).toBe("2026-01-01");
	});
});

/* ─── toTOPredictionDTO ─── */

describe("toTOPredictionDTO", () => {
	it("전체 필드 정확한 매핑", () => {
		const r = toTOPredictionDTO(
			{
				_id: "pred-1",
				facilityId: "fac-1",
				overallScore: 75,
				predictedVacancies: 3,
				confidence: "high",
				byAgeClass: [
					{ className: "만0세", currentVacancy: 1, predictedVacancy: 2, confidence: "medium" },
					{ className: "만1세", currentVacancy: 5, predictedVacancy: 4, confidence: "high" },
				],
				factors: [
					{ name: "주간추세", impact: 2, description: "증가" },
					{ name: "계절보정", impact: -1, description: "안정기" },
				],
				calculatedAt: new Date("2026-02-15T10:00:00.000Z"),
				validUntil: new Date("2026-02-22T10:00:00.000Z"),
			},
			"해오름어린이집",
		);

		expect(r.facilityId).toBe("fac-1");
		expect(r.facilityName).toBe("해오름어린이집");
		expect(r.overallScore).toBe(75);
		expect(r.predictedVacancies).toBe(3);
		expect(r.confidence).toBe("high");
		// byAgeClass
		expect(r.byAgeClass).toHaveLength(2);
		expect(r.byAgeClass[0]).toEqual({ className: "만0세", currentVacancy: 1, predictedVacancy: 2, confidence: "medium" });
		expect(r.byAgeClass[1]).toEqual({ className: "만1세", currentVacancy: 5, predictedVacancy: 4, confidence: "high" });
		// factors
		expect(r.factors).toHaveLength(2);
		expect(r.factors[0]).toEqual({ name: "주간추세", impact: 2, description: "증가" });
		// 날짜
		expect(r.calculatedAt).toBe("2026-02-15T10:00:00.000Z");
		expect(r.validUntil).toBe("2026-02-22T10:00:00.000Z");
	});

	it("문자열 날짜 → 그대로 통과 (Date 아닌 경우)", () => {
		const r = toTOPredictionDTO(
			{
				facilityId: "fac-2",
				overallScore: 50,
				predictedVacancies: 1,
				confidence: "low",
				byAgeClass: [],
				factors: [],
				calculatedAt: "2026-02-15T10:00:00.000Z",
				validUntil: "2026-02-22T10:00:00.000Z",
			},
			"무지개",
		);
		expect(r.calculatedAt).toBe("2026-02-15T10:00:00.000Z");
		expect(r.validUntil).toBe("2026-02-22T10:00:00.000Z");
	});

	it("빈 byAgeClass/factors → 빈 배열", () => {
		const r = toTOPredictionDTO(
			{
				facilityId: "fac-3",
				overallScore: 0,
				predictedVacancies: 0,
				confidence: "low",
				byAgeClass: [],
				factors: [],
				calculatedAt: "2026-01-01",
				validUntil: "2026-01-08",
			},
			"시설",
		);
		expect(r.byAgeClass).toEqual([]);
		expect(r.factors).toEqual([]);
	});
});

/* ─── toChildProfile ─── */

describe("toChildProfile", () => {
	it("null → null", () => {
		expect(toChildProfile(null)).toBeNull();
	});

	it("undefined → null", () => {
		expect(toChildProfile(undefined)).toBeNull();
	});

	it("정상 입력 → 모든 필드 정확 매핑", () => {
		const r = toChildProfile({ _id: "child-1", name: "도토리", birthDate: "2024-06-15", gender: "female" });
		expect(r).toEqual({
			id: "child-1",
			name: "도토리",
			birthDate: "2024-06-15",
			gender: "female",
			specialNeeds: undefined,
		});
	});

	it("gender: 'male' → 'male'", () => {
		expect(toChildProfile({ name: "아", birthDate: "2025-01-01", gender: "male" })!.gender).toBe("male");
	});

	it("gender: 'other' → 'unspecified' (유효하지 않은 값)", () => {
		expect(toChildProfile({ name: "아", birthDate: "2025-01-01", gender: "other" })!.gender).toBe("unspecified");
	});

	it("gender 없음 → 'unspecified'", () => {
		expect(toChildProfile({ name: "아", birthDate: "2025-01-01" })!.gender).toBe("unspecified");
	});

	it("specialNeeds 배열 → 문자열 배열로 변환", () => {
		const r = toChildProfile({ name: "아", birthDate: "2025-01-01", specialNeeds: ["ADHD", 123] });
		expect(r!.specialNeeds).toEqual(["ADHD", "123"]);
	});

	it("specialNeeds 비배열 → undefined", () => {
		expect(toChildProfile({ name: "아", birthDate: "2025-01-01", specialNeeds: "단일값" })!.specialNeeds).toBeUndefined();
	});

	it("_id 없고 id 있으면 id 사용", () => {
		expect(toChildProfile({ id: "child-2", name: "참깨", birthDate: "2024-01-01" })!.id).toBe("child-2");
	});

	it("_id도 id도 없으면 빈 문자열", () => {
		expect(toChildProfile({ name: "아", birthDate: "2025-01-01" })!.id).toBe("");
	});

	it("빈 객체 → 모든 필드 빈 문자열 + unspecified", () => {
		const r = toChildProfile({});
		expect(r).toEqual({ id: "", name: "", birthDate: "", gender: "unspecified", specialNeeds: undefined });
	});
});
