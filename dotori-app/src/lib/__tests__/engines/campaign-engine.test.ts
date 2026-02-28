import { describe, it, expect } from "vitest";
import { TRIGGER_DESCRIPTIONS } from "@/lib/engines/trigger-engine";

describe("campaign/trigger engine", () => {
	describe("TRIGGER_DESCRIPTIONS", () => {
		it("defines all 7 trigger types", () => {
			const triggerIds = Object.keys(TRIGGER_DESCRIPTIONS);
			expect(triggerIds).toHaveLength(7);
		});

		it("includes graduation trigger", () => {
			expect(TRIGGER_DESCRIPTIONS.graduation).toBeDefined();
			expect(TRIGGER_DESCRIPTIONS.graduation.name).toBe("졸업/진급");
			expect(TRIGGER_DESCRIPTIONS.graduation.frequency).toBe("매년 2~3월");
		});

		it("includes relocation trigger", () => {
			expect(TRIGGER_DESCRIPTIONS.relocation).toBeDefined();
			expect(TRIGGER_DESCRIPTIONS.relocation.name).toBe("직장/거주지 이동");
		});

		it("includes vacancy trigger", () => {
			expect(TRIGGER_DESCRIPTIONS.vacancy).toBeDefined();
			expect(TRIGGER_DESCRIPTIONS.vacancy.name).toBe("빈자리 발생");
		});

		it("includes evaluation_change trigger", () => {
			expect(TRIGGER_DESCRIPTIONS.evaluation_change).toBeDefined();
			expect(TRIGGER_DESCRIPTIONS.evaluation_change.name).toBe("시설 평가 변경");
		});

		it("includes policy_change trigger", () => {
			expect(TRIGGER_DESCRIPTIONS.policy_change).toBeDefined();
			expect(TRIGGER_DESCRIPTIONS.policy_change.name).toBe("정책 변경");
		});

		it("includes seasonal_admission trigger", () => {
			expect(TRIGGER_DESCRIPTIONS.seasonal_admission).toBeDefined();
			expect(TRIGGER_DESCRIPTIONS.seasonal_admission.name).toBe("계절 입소");
		});

		it("includes sibling_priority trigger", () => {
			expect(TRIGGER_DESCRIPTIONS.sibling_priority).toBeDefined();
			expect(TRIGGER_DESCRIPTIONS.sibling_priority.name).toBe("형제 입소 우선순위");
		});

		it("all triggers have required fields", () => {
			for (const trigger of Object.values(TRIGGER_DESCRIPTIONS)) {
				expect(trigger.name).toBeTruthy();
				expect(trigger.description).toBeTruthy();
				expect(trigger.frequency).toBeTruthy();
			}
		});

		it("trigger IDs match expected enum values", () => {
			const expectedIds = [
				"graduation",
				"relocation",
				"vacancy",
				"evaluation_change",
				"policy_change",
				"seasonal_admission",
				"sibling_priority",
			];
			expect(Object.keys(TRIGGER_DESCRIPTIONS).sort()).toEqual(expectedIds.sort());
		});
	});

	describe("campaign status flow", () => {
		it("valid statuses", () => {
			const validStatuses = ["draft", "active", "paused", "completed", "archived"];
			expect(validStatuses).toHaveLength(5);
		});

		it("valid event actions", () => {
			const validActions = ["sent", "delivered", "clicked", "converted", "failed"];
			expect(validActions).toHaveLength(5);
		});
	});
});
