import { describe, it, expect, vi, beforeEach } from "vitest";

import {
	generateApiKey,
	hashApiKey,
} from "@/lib/engines/partner-auth";
import { TIER_RATE_LIMITS } from "@/models/Partner";

describe("partner-auth engine", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

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
});
