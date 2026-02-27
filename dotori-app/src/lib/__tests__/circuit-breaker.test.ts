import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({
	log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
	createCircuitBreaker,
	CircuitOpenError,
} from "../circuit-breaker";

describe("circuit-breaker", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("starts in CLOSED state", () => {
		const cb = createCircuitBreaker("test");
		expect(cb.getStatus().state).toBe("CLOSED");
		expect(cb.getStatus().failures).toBe(0);
	});

	it("passes through successful calls", async () => {
		const cb = createCircuitBreaker("test");
		const result = await cb.execute(() => Promise.resolve(42));
		expect(result).toBe(42);
		expect(cb.getStatus().state).toBe("CLOSED");
	});

	it("opens after reaching failure threshold", async () => {
		const cb = createCircuitBreaker("test", { failureThreshold: 3 });
		const fail = () => Promise.reject(new Error("fail"));

		for (let i = 0; i < 3; i++) {
			await expect(cb.execute(fail)).rejects.toThrow("fail");
		}

		expect(cb.getStatus().state).toBe("OPEN");
		expect(cb.getStatus().failures).toBe(3);
	});

	it("rejects calls when OPEN without fallback", async () => {
		const cb = createCircuitBreaker("test", { failureThreshold: 1 });
		await expect(cb.execute(() => Promise.reject(new Error("x")))).rejects.toThrow();

		await expect(cb.execute(() => Promise.resolve(1))).rejects.toThrow(CircuitOpenError);
	});

	it("uses fallback when OPEN", async () => {
		const cb = createCircuitBreaker("test", { failureThreshold: 1 });
		await expect(cb.execute(() => Promise.reject(new Error("x")), [])).resolves.toEqual([]);

		const result = await cb.execute(() => Promise.resolve(1), 0);
		expect(result).toBe(0);
	});

	it("uses fallback on failure in CLOSED state", async () => {
		const cb = createCircuitBreaker("test", { failureThreshold: 5 });
		const result = await cb.execute(() => Promise.reject(new Error("x")), "fallback");
		expect(result).toBe("fallback");
		expect(cb.getStatus().state).toBe("CLOSED");
		expect(cb.getStatus().failures).toBe(1);
	});

	it("transitions OPEN → HALF_OPEN after timeout", async () => {
		const cb = createCircuitBreaker("test", {
			failureThreshold: 1,
			resetTimeoutMs: 10,
		});
		await expect(cb.execute(() => Promise.reject(new Error("x")))).rejects.toThrow();
		expect(cb.getStatus().state).toBe("OPEN");

		// Wait for reset timeout
		await new Promise((r) => setTimeout(r, 15));

		const result = await cb.execute(() => Promise.resolve("ok"));
		expect(result).toBe("ok");
		expect(cb.getStatus().state).toBe("CLOSED");
	});

	it("HALF_OPEN → OPEN on failure", async () => {
		const cb = createCircuitBreaker("test", {
			failureThreshold: 1,
			resetTimeoutMs: 10,
		});
		await expect(cb.execute(() => Promise.reject(new Error("x")))).rejects.toThrow();

		await new Promise((r) => setTimeout(r, 15));

		await expect(cb.execute(() => Promise.reject(new Error("still down")))).rejects.toThrow();
		expect(cb.getStatus().state).toBe("OPEN");
	});

	it("resets to CLOSED state", async () => {
		const cb = createCircuitBreaker("test", { failureThreshold: 1 });
		await expect(cb.execute(() => Promise.reject(new Error("x")))).rejects.toThrow();
		expect(cb.getStatus().state).toBe("OPEN");

		cb.reset();
		expect(cb.getStatus().state).toBe("CLOSED");
		expect(cb.getStatus().failures).toBe(0);
	});

	it("resets failure count on success", async () => {
		const cb = createCircuitBreaker("test", { failureThreshold: 3 });
		await expect(cb.execute(() => Promise.reject(new Error("x")), null)).resolves.toBeNull();
		await expect(cb.execute(() => Promise.reject(new Error("x")), null)).resolves.toBeNull();
		expect(cb.getStatus().failures).toBe(2);

		await cb.execute(() => Promise.resolve("ok"));
		expect(cb.getStatus().failures).toBe(0);
	});

	it("getStatus returns nextRetryAt when OPEN", async () => {
		const cb = createCircuitBreaker("test", {
			failureThreshold: 1,
			resetTimeoutMs: 60_000,
		});
		await expect(cb.execute(() => Promise.reject(new Error("x")))).rejects.toThrow();

		const status = cb.getStatus();
		expect(status.nextRetryAt).not.toBeNull();
		expect(status.lastFailureAt).not.toBeNull();
	});

	it("CircuitOpenError is proper Error subclass", () => {
		const err = new CircuitOpenError("test");
		expect(err).toBeInstanceOf(Error);
		expect(err).toBeInstanceOf(CircuitOpenError);
		expect(err.name).toBe("CircuitOpenError");
	});
});
