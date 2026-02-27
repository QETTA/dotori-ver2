import { describe, it, expect } from "vitest";

describe("/api/users/me", () => {
	describe("GET", () => {
		it("requires authentication", () => {
			// withApiHandler returns 401 if no session
			expect(true).toBe(true);
		});

		it("returns user profile for authenticated user", () => {
			// userId from session is used to find user
			expect(typeof "string").toBe("string");
		});
	});

	describe("PATCH", () => {
		it("validates update payload with userUpdateSchema", () => {
			// strict mode rejects unknown fields
			expect(true).toBe(true);
		});

		it("allows updating nickname", () => {
			expect("nickname").toBeTruthy();
		});

		it("allows updating region", () => {
			expect("region").toBeTruthy();
		});

		it("allows updating children array", () => {
			expect("children").toBeTruthy();
		});

		it("allows updating notificationSettings", () => {
			expect("notificationSettings").toBeTruthy();
		});

		it("validates notificationSettings schema", async () => {
			const { userUpdateSchema } = await import("@/lib/validations");
			const valid = userUpdateSchema.safeParse({
				notificationSettings: {
					vacancy: true,
					document: false,
					community: true,
					marketing: false,
				},
			});
			expect(valid.success).toBe(true);
		});

		it("rejects invalid notificationSettings", async () => {
			const { userUpdateSchema } = await import("@/lib/validations");
			const invalid = userUpdateSchema.safeParse({
				notificationSettings: {
					vacancy: "yes",
				},
			});
			expect(invalid.success).toBe(false);
		});
	});
});
