import { describe, expect, it } from "vitest";
import { classifyIntent } from "@/lib/engine/intent-classifier";
import { toFacilityDTO } from "@/lib/dto";

describe("smoke imports", () => {
	it("imports core modules", () => {
		expect(typeof classifyIntent).toBe("function");
		expect(typeof toFacilityDTO).toBe("function");
	});
});
