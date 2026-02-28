import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/* ─── Hoisted Mocks ─── */
const {
	authMock,
	dbConnectMock,
	postFindMock,
	facilityFindOneMock,
	facilityEstimatedDocMock,
	facilityFindMock,
	userFindByIdMock,
	alertCountMock,
	waitlistCountMock,
	waitlistFindMock,
	esignDocCountMock,
} = vi.hoisted(() => ({
	authMock: vi.fn(),
	dbConnectMock: vi.fn(),
	postFindMock: vi.fn(),
	facilityFindOneMock: vi.fn(),
	facilityEstimatedDocMock: vi.fn(),
	facilityFindMock: vi.fn(),
	userFindByIdMock: vi.fn(),
	alertCountMock: vi.fn(),
	waitlistCountMock: vi.fn(),
	waitlistFindMock: vi.fn(),
	esignDocCountMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/db", () => ({ default: dbConnectMock }));

vi.mock("@/models/Post", () => ({
	default: {
		find: () => ({
			select: () => ({
				populate: () => ({
					sort: () => ({
						limit: () => ({
							lean: () => ({
								exec: postFindMock,
							}),
						}),
					}),
				}),
			}),
		}),
	},
}));

vi.mock("@/models/Facility", () => ({
	default: {
		findOne: () => ({
			sort: () => ({
				select: () => ({
					lean: () => ({
						exec: facilityFindOneMock,
					}),
				}),
			}),
		}),
		estimatedDocumentCount: facilityEstimatedDocMock,
		find: () => ({
			select: () => ({
				sort: () => ({
					limit: () => ({
						lean: () => ({
							exec: facilityFindMock,
						}),
					}),
				}),
			}),
			limit: () => ({
				lean: () => ({
					exec: facilityFindMock,
				}),
			}),
		}),
	},
}));

vi.mock("@/models/User", () => ({
	default: {
		findById: () => ({
			lean: () => ({
				catch: userFindByIdMock,
			}),
		}),
	},
}));

vi.mock("@/models/Alert", () => ({
	default: {
		countDocuments: alertCountMock,
	},
}));

vi.mock("@/models/Waitlist", () => ({
	default: {
		countDocuments: waitlistCountMock,
		find: () => ({
			populate: () => ({
				sort: () => ({
					limit: () => ({
						lean: () => ({
							exec: waitlistFindMock,
						}),
					}),
				}),
			}),
		}),
	},
}));

vi.mock("@/models/ESignatureDocument", () => ({
	default: {
		countDocuments: esignDocCountMock,
	},
}));

vi.mock("@/lib/rate-limit", () => ({
	relaxedLimiter: { check: () => null },
}));

vi.mock("@/lib/dto", () => ({
	toFacilityDTO: (f: Record<string, unknown>) => ({ id: String(f._id || f.id || ""), name: f.name }),
	toPostDTO: (p: Record<string, unknown>) => ({ id: String(p._id || p.id || ""), content: p.content }),
}));

vi.mock("@/lib/logger", () => ({
	log: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), withRequestId: () => ({ warn: vi.fn(), error: vi.fn(), info: vi.fn() }) },
}));

function ensureCryptoRandomUUID(): void {
	if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") return;
	(globalThis as typeof globalThis & { crypto: Crypto }).crypto = {
		randomUUID: () => "00000000-0000-4000-8000-000000000000",
	} as Crypto;
}

beforeEach(() => {
	vi.clearAllMocks();
	authMock.mockResolvedValue(null);
	dbConnectMock.mockResolvedValue(undefined);
	postFindMock.mockResolvedValue([]);
	facilityFindOneMock.mockResolvedValue(null);
	facilityEstimatedDocMock.mockResolvedValue(20027);
	facilityFindMock.mockResolvedValue([]);
	userFindByIdMock.mockReturnValue(null);
	alertCountMock.mockResolvedValue(0);
	waitlistCountMock.mockResolvedValue(0);
	waitlistFindMock.mockResolvedValue([]);
	esignDocCountMock.mockResolvedValue(0);
});

describe("/api/home", () => {
	it("returns default data for unauthenticated request", async () => {
		ensureCryptoRandomUUID();
		const { GET } = await import("@/app/api/home/route");
		const req = new NextRequest("http://localhost/api/home");
		const res = await GET(req);
		const json = await res.json();

		expect(res.status).toBe(200);
		expect(json.data.user).toBeNull();
		expect(json.data.nearbyFacilities).toEqual([]);
		expect(json.data.hotPosts).toEqual([]);
		expect(json.data.totalFacilities).toBe(20027);
	});

	it("returns user data with region filter for authenticated user", async () => {
		ensureCryptoRandomUUID();
		authMock.mockResolvedValueOnce({ user: { id: "user1" } });
		userFindByIdMock.mockReturnValueOnce({
			_id: "user1",
			nickname: "테스트맘",
			region: { sido: "서울특별시", sigungu: "강남구" },
			interests: [],
			children: [],
			plan: "free",
			gpsVerified: false,
			onboardingCompleted: true,
		});

		const { GET } = await import("@/app/api/home/route");
		const req = new NextRequest("http://localhost/api/home");
		const res = await GET(req);
		const json = await res.json();

		expect(res.status).toBe(200);
		expect(json.data.user.nickname).toBe("테스트맘");
		expect(json.data.user.region.sido).toBe("서울특별시");
	});

	it("returns interestFacilities when user has interests", async () => {
		ensureCryptoRandomUUID();
		authMock.mockResolvedValueOnce({ user: { id: "user2" } });
		userFindByIdMock.mockReturnValueOnce({
			_id: "user2",
			nickname: "관심맘",
			region: { sido: "서울특별시" },
			interests: ["fac1", "fac2"],
			children: [],
			plan: "free",
			gpsVerified: false,
			onboardingCompleted: true,
		});
		// 실행 순서: interests query(find().limit()...) → nearby query(find().select()...)
		facilityFindMock.mockResolvedValueOnce([{ _id: "fac1", name: "관심시설" }]); // interests (1st call)
		facilityFindMock.mockResolvedValueOnce([]); // nearby (2nd call)

		const { GET } = await import("@/app/api/home/route");
		const req = new NextRequest("http://localhost/api/home");
		const res = await GET(req);
		const json = await res.json();

		expect(res.status).toBe(200);
		expect(json.data.user.nickname).toBe("관심맘");
		expect(json.data.interestFacilities).toHaveLength(1);
		expect(json.data.interestFacilities[0].name).toBe("관심시설");
	});

	it("returns waitlist data when user has active waitlist", async () => {
		ensureCryptoRandomUUID();
		authMock.mockResolvedValueOnce({ user: { id: "user3" } });
		userFindByIdMock.mockReturnValueOnce({
			_id: "user3",
			nickname: "대기맘",
			region: {},
			interests: [],
			children: [],
			plan: "free",
			gpsVerified: false,
			onboardingCompleted: true,
		});
		waitlistCountMock.mockResolvedValueOnce(2);
		waitlistFindMock.mockResolvedValueOnce([
			{ position: 3, facilityId: { name: "행복어린이집" } },
		]);

		const { GET } = await import("@/app/api/home/route");
		const req = new NextRequest("http://localhost/api/home");
		const res = await GET(req);
		const json = await res.json();

		expect(res.status).toBe(200);
		expect(json.data.waitlistCount).toBe(2);
		expect(json.data.bestWaitlistPosition).toBe(3);
		expect(json.data.waitlistFacilityName).toBe("행복어린이집");
	});

	it("returns documentCount for authenticated user", async () => {
		ensureCryptoRandomUUID();
		authMock.mockResolvedValueOnce({ user: { id: "user4" } });
		userFindByIdMock.mockReturnValueOnce({
			_id: "user4",
			nickname: "서류맘",
			region: {},
			interests: [],
			children: [],
			plan: "free",
			gpsVerified: false,
			onboardingCompleted: true,
		});
		esignDocCountMock.mockResolvedValueOnce(5);

		const { GET } = await import("@/app/api/home/route");
		const req = new NextRequest("http://localhost/api/home");
		const res = await GET(req);
		const json = await res.json();

		expect(res.status).toBe(200);
		expect(json.data.documentCount).toBe(5);
	});

	it("handles partial DB failure with fallback values", async () => {
		ensureCryptoRandomUUID();
		postFindMock.mockRejectedValueOnce(new Error("DB error"));

		const { GET } = await import("@/app/api/home/route");
		const req = new NextRequest("http://localhost/api/home");
		const res = await GET(req);
		const json = await res.json();

		expect(res.status).toBe(200);
		expect(json.data.hotPosts).toEqual([]);
	});

	it("reflects estimatedDocumentCount in totalFacilities", async () => {
		ensureCryptoRandomUUID();
		facilityEstimatedDocMock.mockResolvedValueOnce(35000);

		const { GET } = await import("@/app/api/home/route");
		const req = new NextRequest("http://localhost/api/home");
		const res = await GET(req);
		const json = await res.json();

		expect(res.status).toBe(200);
		expect(json.data.totalFacilities).toBe(35000);
	});

	it("returns hotPosts when posts exist", async () => {
		ensureCryptoRandomUUID();
		postFindMock.mockResolvedValueOnce([
			{ _id: "p1", content: "인기글1", likes: 10 },
			{ _id: "p2", content: "인기글2", likes: 5 },
		]);

		const { GET } = await import("@/app/api/home/route");
		const req = new NextRequest("http://localhost/api/home");
		const res = await GET(req);
		const json = await res.json();

		expect(res.status).toBe(200);
		expect(json.data.hotPosts).toHaveLength(2);
	});
});
