import { describe, expect, it } from "vitest";
import mongoose from "mongoose";

/**
 * Schema validation tests — verify Mongoose schema constraints
 * These tests directly validate model schemas without DB connection.
 */

describe("User email format validation", () => {
	it("rejects invalid email format", async () => {
		const User = (await import("@/models/User")).default;
		const doc = new User({
			name: "Test",
			email: "not-an-email",
		});
		const err = doc.validateSync();
		expect(err).toBeDefined();
		expect(err!.errors.email).toBeDefined();
	});

	it("accepts valid email format", async () => {
		const User = (await import("@/models/User")).default;
		const doc = new User({
			name: "Test",
			email: "user@example.com",
		});
		const err = doc.validateSync();
		// email field itself should not have an error
		expect(err?.errors.email).toBeUndefined();
	});

	it("accepts undefined email (optional field)", async () => {
		const User = (await import("@/models/User")).default;
		const doc = new User({
			name: "Test",
		});
		const err = doc.validateSync();
		expect(err?.errors.email).toBeUndefined();
	});
});

describe("Partner contactEmail format validation", () => {
	it("rejects invalid contactEmail format", async () => {
		const Partner = (await import("@/models/Partner")).default;
		const doc = new Partner({
			name: "Test Partner",
			contactEmail: "invalid-email",
			tier: "free",
			apiKeyHash: "a".repeat(64),
			apiKeyPrefix: "abcd1234",
			rateLimit: 100,
		});
		const err = doc.validateSync();
		expect(err).toBeDefined();
		expect(err!.errors.contactEmail).toBeDefined();
	});

	it("accepts valid contactEmail format", async () => {
		const Partner = (await import("@/models/Partner")).default;
		const doc = new Partner({
			name: "Test Partner",
			contactEmail: "partner@example.com",
			tier: "free",
			apiKeyHash: "a".repeat(64),
			apiKeyPrefix: "abcd1234",
			rateLimit: 100,
		});
		const err = doc.validateSync();
		expect(err?.errors.contactEmail).toBeUndefined();
	});
});

describe("Post content length validation", () => {
	it("rejects empty content", async () => {
		const Post = (await import("@/models/Post")).default;
		const doc = new Post({
			authorId: new mongoose.Types.ObjectId(),
			author: { nickname: "Test", verified: false },
			content: "",
			category: "question",
		});
		const err = doc.validateSync();
		expect(err).toBeDefined();
		expect(err!.errors.content).toBeDefined();
	});

	it("rejects content exceeding 5000 characters", async () => {
		const Post = (await import("@/models/Post")).default;
		const doc = new Post({
			authorId: new mongoose.Types.ObjectId(),
			author: { nickname: "Test", verified: false },
			content: "x".repeat(5001),
			category: "question",
		});
		const err = doc.validateSync();
		expect(err).toBeDefined();
		expect(err!.errors.content).toBeDefined();
	});

	it("accepts content within limits", async () => {
		const Post = (await import("@/models/Post")).default;
		const doc = new Post({
			authorId: new mongoose.Types.ObjectId(),
			author: { nickname: "Test", verified: false },
			content: "Valid content",
			category: "question",
		});
		const err = doc.validateSync();
		expect(err?.errors.content).toBeUndefined();
	});
});

describe("Alert minVacancy min:0 validation", () => {
	it("rejects negative minVacancy", async () => {
		const Alert = (await import("@/models/Alert")).default;
		const doc = new Alert({
			userId: new mongoose.Types.ObjectId(),
			facilityId: new mongoose.Types.ObjectId(),
			type: "vacancy",
			condition: { minVacancy: -1 },
			channels: ["push"],
		});
		const err = doc.validateSync();
		expect(err).toBeDefined();
		// Check for nested condition.minVacancy error
		const conditionErrors = Object.keys(err!.errors).filter(
			(k) => k.includes("minVacancy"),
		);
		expect(conditionErrors.length).toBeGreaterThan(0);
	});

	it("accepts zero minVacancy", async () => {
		const Alert = (await import("@/models/Alert")).default;
		const doc = new Alert({
			userId: new mongoose.Types.ObjectId(),
			facilityId: new mongoose.Types.ObjectId(),
			type: "vacancy",
			condition: { minVacancy: 0 },
			channels: ["push"],
		});
		const err = doc.validateSync();
		const conditionErrors = Object.keys(err?.errors ?? {}).filter(
			(k) => k.includes("minVacancy"),
		);
		expect(conditionErrors.length).toBe(0);
	});

	it("accepts positive minVacancy", async () => {
		const Alert = (await import("@/models/Alert")).default;
		const doc = new Alert({
			userId: new mongoose.Types.ObjectId(),
			facilityId: new mongoose.Types.ObjectId(),
			type: "vacancy",
			condition: { minVacancy: 3 },
			channels: ["push"],
		});
		const err = doc.validateSync();
		const conditionErrors = Object.keys(err?.errors ?? {}).filter(
			(k) => k.includes("minVacancy"),
		);
		expect(conditionErrors.length).toBe(0);
	});
});
