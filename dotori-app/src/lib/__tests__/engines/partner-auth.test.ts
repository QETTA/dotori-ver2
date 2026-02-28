import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

import {
	generateApiKey,
	hashApiKey,
	verifyApiKey,
	checkRateLimit,
	logApiUsage,
	getUsageStats,
	createPartner,
	regenerateApiKey,
	PartnerNotFoundError,
} from "@/lib/engines/partner-auth";
import { TIER_RATE_LIMITS } from "@/models/Partner";

/* ─── Mocks ─── */

const mockPartnerFindOne = vi.fn();
const mockPartnerFindByIdAndUpdate = vi.fn();
const mockPartnerCreate = vi.fn();

vi.mock("@/models/Partner", async () => {
	const actual = await vi.importActual<typeof import("@/models/Partner")>("@/models/Partner");
	return {
		...actual,
		default: {
			findOne: (...args: unknown[]) => ({ lean: () => mockPartnerFindOne(...args) }),
			findByIdAndUpdate: (...args: unknown[]) => mockPartnerFindByIdAndUpdate(...args),
			create: (...args: unknown[]) => mockPartnerCreate(...args),
		},
	};
});

const mockUsageLogCountDocuments = vi.fn();
const mockUsageLogAggregate = vi.fn();
const mockUsageLogCreate = vi.fn();

vi.mock("@/models/ApiUsageLog", () => ({
	default: {
		countDocuments: (...args: unknown[]) => mockUsageLogCountDocuments(...args),
		aggregate: (...args: unknown[]) => mockUsageLogAggregate(...args),
		create: (...args: unknown[]) => mockUsageLogCreate(...args),
	},
}));

vi.mock("@/lib/config/api", () => ({
	API_CONFIG: {
		PARTNER: {
			apiKeyBytes: 32,
			apiKeyPrefixLength: 8,
			usageLogRetentionDays: 90,
		},
	},
}));

beforeEach(() => {
	vi.clearAllMocks();
});

/* ─── Unit Tests (순수 함수) ─── */

describe("partner-auth engine", () => {
	describe("generateApiKey", () => {
		it("generates a key with rawKey, hash, and prefix", () => {
			const key = generateApiKey();
			expect(key.rawKey).toBeDefined();
			expect(key.hash).toBeDefined();
			expect(key.prefix).toBeDefined();
			expect(key.rawKey.length).toBe(64); // 32 bytes hex
			expect(key.hash.length).toBe(64); // SHA-256 hex
			expect(key.prefix.length).toBe(8);
		});

		it("generates unique keys each time", () => {
			const key1 = generateApiKey();
			const key2 = generateApiKey();
			expect(key1.rawKey).not.toBe(key2.rawKey);
			expect(key1.hash).not.toBe(key2.hash);
		});

		it("prefix matches rawKey start", () => {
			const key = generateApiKey();
			expect(key.rawKey.startsWith(key.prefix)).toBe(true);
		});

		it("10 calls produce 10 unique keys (ENG-PA-VAL-001)", () => {
			const keys = new Set<string>();
			for (let i = 0; i < 10; i++) {
				keys.add(generateApiKey().rawKey);
			}
			expect(keys.size).toBe(10);
		});
	});

	describe("hashApiKey", () => {
		it("produces deterministic SHA-256 hash", () => {
			const rawKey = "test-key-12345";
			const hash1 = hashApiKey(rawKey);
			const hash2 = hashApiKey(rawKey);
			expect(hash1).toBe(hash2);
			expect(hash1.length).toBe(64);
		});

		it("different keys produce different hashes", () => {
			const hash1 = hashApiKey("key-a");
			const hash2 = hashApiKey("key-b");
			expect(hash1).not.toBe(hash2);
		});

		it("hash matches generateApiKey hash for same key", () => {
			const { rawKey, hash } = generateApiKey();
			expect(hashApiKey(rawKey)).toBe(hash);
		});

		it("handles empty string (ENG-PA-BND-001)", () => {
			const hash = hashApiKey("");
			expect(hash).toMatch(/^[0-9a-f]{64}$/);
		});

		it("handles very long string (ENG-PA-BND-002)", () => {
			const longKey = "a".repeat(10_000);
			const hash = hashApiKey(longKey);
			expect(hash).toMatch(/^[0-9a-f]{64}$/);
		});
	});

	describe("TIER_RATE_LIMITS", () => {
		it("defines limits for all tiers", () => {
			expect(TIER_RATE_LIMITS.free).toBe(100);
			expect(TIER_RATE_LIMITS.basic).toBe(1_000);
			expect(TIER_RATE_LIMITS.pro).toBe(10_000);
			expect(TIER_RATE_LIMITS.enterprise).toBe(1_000_000);
		});

		it("tiers are ordered by limit", () => {
			expect(TIER_RATE_LIMITS.free).toBeLessThan(TIER_RATE_LIMITS.basic);
			expect(TIER_RATE_LIMITS.basic).toBeLessThan(TIER_RATE_LIMITS.pro);
			expect(TIER_RATE_LIMITS.pro).toBeLessThan(TIER_RATE_LIMITS.enterprise);
		});

		it("all limits are positive integers", () => {
			for (const limit of Object.values(TIER_RATE_LIMITS)) {
				expect(limit).toBeGreaterThan(0);
				expect(Number.isInteger(limit)).toBe(true);
			}
		});
	});

	describe("API key format", () => {
		it("rawKey is hexadecimal string", () => {
			const { rawKey } = generateApiKey();
			expect(rawKey).toMatch(/^[0-9a-f]+$/);
		});

		it("hash is hexadecimal string", () => {
			const { hash } = generateApiKey();
			expect(hash).toMatch(/^[0-9a-f]+$/);
		});
	});

	describe("PartnerNotFoundError", () => {
		it("has correct name and default message", () => {
			const error = new PartnerNotFoundError();
			expect(error.name).toBe("PartnerNotFoundError");
			expect(error.message).toBe("파트너를 찾을 수 없습니다");
			expect(error).toBeInstanceOf(Error);
		});

		it("accepts custom message", () => {
			const error = new PartnerNotFoundError("custom msg");
			expect(error.message).toBe("custom msg");
		});
	});

	/* ─── Integration Tests (Mongoose mock) ─── */

	describe("verifyApiKey (integration)", () => {
		it("returns partner for valid active key (ENG-PA-OK-006)", async () => {
			const rawKey = "valid-test-key-abc123";
			const expectedHash = hashApiKey(rawKey);
			const mockPartner = { _id: "p1", name: "TestCo", isActive: true, tier: "free" };
			mockPartnerFindOne.mockResolvedValue(mockPartner);

			const result = await verifyApiKey(rawKey);
			expect(result).toEqual(mockPartner);
			expect(mockPartnerFindOne).toHaveBeenCalledWith({
				apiKeyHash: expectedHash,
				isActive: true,
			});
		});

		it("returns null for unregistered key (ENG-PA-ERR-001)", async () => {
			mockPartnerFindOne.mockResolvedValue(null);

			const result = await verifyApiKey("invalid-key");
			expect(result).toBeNull();
		});

		it("returns null for inactive partner (ENG-PA-ERR-002)", async () => {
			// findOne with isActive:true won't find inactive partner
			mockPartnerFindOne.mockResolvedValue(null);

			const result = await verifyApiKey("deactivated-key");
			expect(result).toBeNull();
		});
	});

	describe("checkRateLimit (integration)", () => {
		it("allows when under limit (ENG-PA-OK-007)", async () => {
			mockUsageLogCountDocuments.mockResolvedValue(50);

			const result = await checkRateLimit("partner1", "free");
			expect(result.allowed).toBe(true);
			expect(result.limit).toBe(100);
			expect(result.remaining).toBe(50);
			expect(result.resetAt).toBeInstanceOf(Date);

			// Verify filter includes partnerId and timestamp range
			const filter = mockUsageLogCountDocuments.mock.calls[0][0];
			expect(filter.partnerId).toBe("partner1");
			expect(filter.timestamp.$gte).toBeInstanceOf(Date);
			expect(filter.timestamp.$lt).toBeInstanceOf(Date);
		});

		it("blocks at exact limit (ENG-PA-BND-003)", async () => {
			mockUsageLogCountDocuments.mockResolvedValue(100);

			const result = await checkRateLimit("partner1", "free");
			expect(result.allowed).toBe(false);
			expect(result.remaining).toBe(0);
		});

		it("allows at limit-1 (ENG-PA-BND-004)", async () => {
			mockUsageLogCountDocuments.mockResolvedValue(99);

			const result = await checkRateLimit("partner1", "free");
			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(1);
		});

		it("enterprise handles high usage (ENG-PA-OK-008)", async () => {
			mockUsageLogCountDocuments.mockResolvedValue(999_999);

			const result = await checkRateLimit("partner1", "enterprise");
			expect(result.allowed).toBe(true);
			expect(result.remaining).toBe(1);
			expect(result.limit).toBe(1_000_000);
		});

		it("resetAt is end of current day (ENG-PA-ST-001)", async () => {
			mockUsageLogCountDocuments.mockResolvedValue(0);

			const result = await checkRateLimit("partner1", "free");
			const now = new Date();
			const expectedReset = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

			// resetAt should be start of tomorrow (= end of today)
			expect(result.resetAt.getTime()).toBe(expectedReset.getTime());
		});
	});

	describe("logApiUsage (integration)", () => {
		it("creates usage log entry (ENG-PA-OK-009)", async () => {
			mockUsageLogCreate.mockResolvedValue({});

			await logApiUsage({
				partnerId: "partner1",
				endpoint: "/api/facilities",
				method: "GET",
				statusCode: 200,
				responseMs: 45,
			});

			expect(mockUsageLogCreate).toHaveBeenCalledTimes(1);
			const callArgs = mockUsageLogCreate.mock.calls[0][0];
			expect(callArgs.partnerId).toBe("partner1");
			expect(callArgs.endpoint).toBe("/api/facilities");
			expect(callArgs.method).toBe("GET");
			expect(callArgs.statusCode).toBe(200);
			expect(callArgs.responseMs).toBe(45);
			expect(callArgs.timestamp).toBeInstanceOf(Date);
		});
	});

	describe("getUsageStats (integration)", () => {
		const partnerId = "507f1f77bcf86cd799439011";

		it("returns aggregated stats (ENG-PA-OK-010)", async () => {
			mockUsageLogAggregate
				.mockResolvedValueOnce([
					{ _id: "2026-02-27", count: 50 },
					{ _id: "2026-02-28", count: 30 },
				])
				.mockResolvedValueOnce([{ _id: "2026-02", count: 80 }])
				.mockResolvedValueOnce([{ totalRequests: 80, avgResponseMs: 42.5 }]);

			const stats = await getUsageStats(partnerId, 30);

			expect(stats.daily).toHaveLength(2);
			expect(stats.daily[0]).toEqual({ date: "2026-02-27", count: 50 });
			expect(stats.monthly).toHaveLength(1);
			expect(stats.totalRequests).toBe(80);
			expect(stats.avgResponseMs).toBe(43); // Math.round(42.5)
		});

		it("returns zeros when no data (ENG-PA-BND-005)", async () => {
			mockUsageLogAggregate
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([]);

			const stats = await getUsageStats(partnerId);

			expect(stats.daily).toHaveLength(0);
			expect(stats.monthly).toHaveLength(0);
			expect(stats.totalRequests).toBe(0);
			expect(stats.avgResponseMs).toBe(0);
		});

		it("uses ObjectId for aggregation (ENG-PA-ERR-003 regression)", async () => {
			mockUsageLogAggregate
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([])
				.mockResolvedValueOnce([]);

			await getUsageStats(partnerId, 7);

			// All 3 aggregate calls should use ObjectId in $match
			for (const call of mockUsageLogAggregate.mock.calls) {
				const pipeline = call[0];
				const matchStage = pipeline[0];
				expect(matchStage.$match.partnerId).toBeInstanceOf(mongoose.Types.ObjectId);
			}
		});
	});

	describe("createPartner (integration)", () => {
		it("creates partner with default free tier (ENG-PA-OK-011)", async () => {
			const mockCreated = {
				_id: "newPartner1",
				name: "TestCo",
				tier: "free",
				rateLimit: 100,
			};
			mockPartnerCreate.mockResolvedValue(mockCreated);

			const result = await createPartner({
				name: "TestCo",
				contactEmail: "test@example.com",
			});

			expect(result.partner).toEqual(mockCreated);
			expect(result.rawApiKey).toBeDefined();
			expect(result.rawApiKey.length).toBe(64);

			const createCall = mockPartnerCreate.mock.calls[0][0];
			expect(createCall.name).toBe("TestCo");
			expect(createCall.contactEmail).toBe("test@example.com");
			expect(createCall.tier).toBe("free");
			expect(createCall.rateLimit).toBe(100);
			expect(createCall.apiKeyHash).toMatch(/^[0-9a-f]{64}$/);
			expect(createCall.apiKeyPrefix.length).toBe(8);
		});

		it("creates partner with specified tier (ENG-PA-OK-012)", async () => {
			mockPartnerCreate.mockResolvedValue({ _id: "p2", tier: "pro" });

			const result = await createPartner({
				name: "ProCo",
				contactEmail: "pro@example.com",
				tier: "pro",
			});

			const createCall = mockPartnerCreate.mock.calls[0][0];
			expect(createCall.tier).toBe("pro");
			expect(createCall.rateLimit).toBe(10_000);
			expect(result.rawApiKey).toBeDefined();
		});

		it("handles optional contactPhone (ENG-PA-BND-006)", async () => {
			mockPartnerCreate.mockResolvedValue({ _id: "p3" });

			await createPartner({
				name: "NoPh",
				contactEmail: "no@phone.com",
				contactPhone: "010-1234-5678",
			});

			const createCall = mockPartnerCreate.mock.calls[0][0];
			expect(createCall.contactPhone).toBe("010-1234-5678");
		});
	});

	describe("regenerateApiKey (integration)", () => {
		it("regenerates key for existing partner (ENG-PA-OK-013)", async () => {
			mockPartnerFindByIdAndUpdate.mockResolvedValue({
				_id: "partner1",
				apiKeyPrefix: "newprefi",
			});

			const result = await regenerateApiKey("partner1");
			expect(result.rawApiKey).toBeDefined();
			expect(result.rawApiKey.length).toBe(64);
			expect(result.prefix.length).toBe(8);

			expect(mockPartnerFindByIdAndUpdate).toHaveBeenCalledWith(
				"partner1",
				expect.objectContaining({
					$set: expect.objectContaining({
						apiKeyHash: expect.stringMatching(/^[0-9a-f]{64}$/),
						apiKeyPrefix: expect.any(String),
					}),
				}),
				{ new: true },
			);
		});

		it("throws PartnerNotFoundError for missing partner (ENG-PA-ERR-004)", async () => {
			mockPartnerFindByIdAndUpdate.mockResolvedValue(null);

			await expect(regenerateApiKey("nonexistent")).rejects.toThrow(PartnerNotFoundError);
		});
	});
});
