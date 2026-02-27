import { describe, it, expect, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ default: vi.fn() }));
vi.mock("@/lib/logger", () => ({
	log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { isValidTransition } from "../esignature.service";
import { eSignatureTransitionSchema } from "../../validations";

type Status = "draft" | "pending" | "signed" | "submitted" | "expired";

const ALL_STATUSES: Status[] = [
	"draft",
	"pending",
	"signed",
	"submitted",
	"expired",
];

describe("E-Signature 상태전이 전수 테스트", () => {
	const validTransitions: [Status, Status][] = [
		["draft", "pending"],
		["draft", "expired"],
		["pending", "signed"],
		["pending", "expired"],
		["signed", "submitted"],
		["signed", "expired"],
		["submitted", "expired"],
	];

	describe("유효한 전이", () => {
		for (const [from, to] of validTransitions) {
			it(`${from} → ${to} 허용`, () => {
				expect(isValidTransition(from, to)).toBe(true);
			});
		}
	});

	describe("무효한 전이", () => {
		const invalidTransitions: [Status, Status][] = [];

		for (const from of ALL_STATUSES) {
			for (const to of ALL_STATUSES) {
				const isValid = validTransitions.some(
					([f, t]) => f === from && t === to,
				);
				if (!isValid) {
					invalidTransitions.push([from, to]);
				}
			}
		}

		for (const [from, to] of invalidTransitions) {
			it(`${from} → ${to} 거부`, () => {
				expect(isValidTransition(from, to)).toBe(false);
			});
		}
	});

	describe("self-transition 전부 거부", () => {
		for (const status of ALL_STATUSES) {
			it(`${status} → ${status} 거부`, () => {
				expect(isValidTransition(status, status)).toBe(false);
			});
		}
	});

	describe("eSignatureTransitionSchema", () => {
		it("accepts valid from/to pair", () => {
			const result = eSignatureTransitionSchema.safeParse({
				from: "draft",
				to: "pending",
			});
			expect(result.success).toBe(true);
		});

		it("rejects invalid status value", () => {
			const result = eSignatureTransitionSchema.safeParse({
				from: "draft",
				to: "invalid",
			});
			expect(result.success).toBe(false);
		});
	});
});
