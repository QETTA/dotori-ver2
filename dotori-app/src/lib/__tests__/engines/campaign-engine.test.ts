import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TRIGGER_DESCRIPTIONS } from "@/lib/engines/trigger-engine";

/* ─── Mocks ─── */

const mockFacilityCountDocuments = vi.fn();
vi.mock("@/models/Facility", () => ({
	default: {
		countDocuments: (...args: unknown[]) => mockFacilityCountDocuments(...args),
	},
}));

const mockUserFind = vi.fn();
vi.mock("@/models/User", () => ({
	default: {
		find: (...args: unknown[]) => ({
			select: () => ({
				limit: () => ({
					lean: () => mockUserFind(...args),
				}),
			}),
		}),
	},
}));

const mockCampaignCreate = vi.fn();
const mockCampaignFindById = vi.fn();
const mockCampaignFindByIdAndUpdate = vi.fn();
const mockCampaignFind = vi.fn();
const mockCampaignCountDocuments = vi.fn();

vi.mock("@/models/Campaign", async () => {
	const actual = await vi.importActual<typeof import("@/models/Campaign")>("@/models/Campaign");
	return {
		...actual,
		default: {
			create: (...args: unknown[]) => mockCampaignCreate(...args),
			findById: (...args: unknown[]) => mockCampaignFindById(...args),
			findByIdAndUpdate: (...args: unknown[]) => mockCampaignFindByIdAndUpdate(...args),
			find: (...args: unknown[]) => ({
				sort: () => ({
					skip: () => ({
						limit: () => ({
							lean: () => mockCampaignFind(...args),
						}),
					}),
				}),
			}),
			countDocuments: (...args: unknown[]) => mockCampaignCountDocuments(...args),
		},
	};
});

const mockEventAggregate = vi.fn();
const mockEventCreate = vi.fn();
const mockEventInsertMany = vi.fn();

vi.mock("@/models/CampaignEvent", () => ({
	default: {
		aggregate: (...args: unknown[]) => mockEventAggregate(...args),
		create: (...args: unknown[]) => mockEventCreate(...args),
		insertMany: (...args: unknown[]) => mockEventInsertMany(...args),
	},
}));

beforeEach(() => {
	vi.clearAllMocks();
});

afterEach(() => {
	vi.useRealTimers();
});

/* ─── Lazy imports ─── */

async function importTrigger() {
	return import("@/lib/engines/trigger-engine");
}

async function importCampaign() {
	return import("@/lib/engines/campaign-engine");
}

describe("campaign/trigger engine", () => {
	/* ─── Constants (기존) ─── */

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

	/* ─── Integration: Trigger Engine ─── */

	describe("detectTriggers (integration)", () => {
		it("detects graduation trigger in February (ENG-CT-OK-001)", async () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2026-02-15"));

			const { detectTriggers } = await importTrigger();
			mockFacilityCountDocuments.mockResolvedValue(0);

			const triggers = await detectTriggers();
			const graduation = triggers.find((t) => t.triggerId === "graduation");
			expect(graduation).toBeDefined();
			expect(graduation!.metadata.description).toContain("졸업/진급");

			vi.useRealTimers();
		});

		it("detects both graduation and seasonal in March (ENG-CT-OK-002)", async () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2026-03-01"));

			const { detectTriggers } = await importTrigger();
			mockFacilityCountDocuments.mockResolvedValue(0);

			const triggers = await detectTriggers();
			const triggerIds = triggers.map((t) => t.triggerId);
			expect(triggerIds).toContain("graduation");
			expect(triggerIds).toContain("seasonal_admission");

			vi.useRealTimers();
		});

		it("detects seasonal_admission in September (ENG-CT-OK-003)", async () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2026-09-10"));

			const { detectTriggers } = await importTrigger();
			mockFacilityCountDocuments.mockResolvedValue(0);

			const triggers = await detectTriggers();
			const seasonal = triggers.find((t) => t.triggerId === "seasonal_admission");
			expect(seasonal).toBeDefined();
			expect(seasonal!.metadata.season).toBe("fall");

			vi.useRealTimers();
		});

		it("returns no triggers in July with no vacancies (ENG-CT-BND-001)", async () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2026-07-15"));

			const { detectTriggers } = await importTrigger();
			mockFacilityCountDocuments.mockResolvedValue(0);

			const triggers = await detectTriggers();
			expect(triggers).toHaveLength(0);

			vi.useRealTimers();
		});

		it("detects vacancy trigger when facilities have openings (ENG-CT-OK-004)", async () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date("2026-07-15")); // Non-seasonal month

			const { detectTriggers } = await importTrigger();
			mockFacilityCountDocuments.mockResolvedValue(25);

			const triggers = await detectTriggers();
			const vacancy = triggers.find((t) => t.triggerId === "vacancy");
			expect(vacancy).toBeDefined();
			expect(vacancy!.metadata.facilitiesWithVacancy).toBe(25);

			vi.useRealTimers();
		});
	});

	describe("matchUsersForTrigger (integration)", () => {
		it("matches all users for 전국 audience (ENG-CT-OK-005)", async () => {
			const { matchUsersForTrigger } = await importTrigger();
			const mockUsers = [
				{
					_id: "u1",
					nickname: "UserA",
					region: { sido: "서울특별시", sigungu: "강남구" },
					children: [{}],
				},
			];
			mockUserFind.mockResolvedValue(mockUsers);

			const matched = await matchUsersForTrigger({
				triggerId: "graduation",
				audience: { regions: ["전국"] },
			});

			expect(matched).toHaveLength(1);
			expect(matched[0].userId).toBe("u1");
			expect(matched[0].matchReason).toBe("졸업/진급 시즌 대상");
			// Should NOT pass region filter when regions=["전국"]
			const findCall = mockUserFind.mock.calls[0][0];
			expect(findCall["region.sido"]).toBeUndefined();
		});

		it("applies region filter (ENG-CT-OK-006)", async () => {
			const { matchUsersForTrigger } = await importTrigger();
			mockUserFind.mockResolvedValue([]);

			await matchUsersForTrigger({
				triggerId: "vacancy",
				audience: { regions: ["서울특별시"] },
			});

			const findCall = mockUserFind.mock.calls[0][0];
			expect(findCall["region.sido"]).toEqual({ $in: ["서울특별시"] });
		});

		it("applies child age range filter (ENG-CT-OK-007)", async () => {
			const { matchUsersForTrigger } = await importTrigger();
			mockUserFind.mockResolvedValue([]);

			await matchUsersForTrigger({
				triggerId: "graduation",
				audience: { childAgeRange: { min: 3, max: 5 } },
			});

			const findCall = mockUserFind.mock.calls[0][0];
			expect(findCall["children.birthDate"]).toBeDefined();
			expect(findCall["children.birthDate"].$gte).toBeDefined();
			expect(findCall["children.birthDate"].$lte).toBeDefined();
		});

		it("returns empty array when no match (ENG-CT-BND-002)", async () => {
			const { matchUsersForTrigger } = await importTrigger();
			mockUserFind.mockResolvedValue([]);

			const matched = await matchUsersForTrigger({
				triggerId: "relocation",
				audience: { regions: ["세종특별자치시"] },
			});

			expect(matched).toHaveLength(0);
		});

		it("handles users without children array (ENG-CT-BND-003)", async () => {
			const { matchUsersForTrigger } = await importTrigger();
			mockUserFind.mockResolvedValue([
				{ _id: "u2", nickname: "NoKids", region: { sido: "서울", sigungu: "종로" }, children: undefined },
			]);

			const matched = await matchUsersForTrigger({
				triggerId: "vacancy",
				audience: {},
			});

			expect(matched[0].childCount).toBe(0);
		});
	});

	/* ─── Integration: Campaign Engine ─── */

	describe("createCampaign (integration)", () => {
		it("creates campaign with draft status (ENG-CT-OK-008)", async () => {
			const { createCampaign } = await importCampaign();
			const mockCamp = {
				_id: "camp1",
				name: "졸업 캠페인",
				status: "draft",
			};
			mockCampaignCreate.mockResolvedValue(mockCamp);

			const result = await createCampaign({
				name: "졸업 캠페인",
				triggerId: "graduation",
				audience: { regions: ["서울특별시"] },
				schedule: { startDate: "2026-03-01" },
				messageTemplate: "졸업 시즌입니다!",
			});

			expect(result).toEqual(mockCamp);
			const createCall = mockCampaignCreate.mock.calls[0][0];
			expect(createCall.status).toBe("draft");
			expect(createCall.schedule.startDate).toBeInstanceOf(Date);
		});
	});

	describe("updateCampaignStatus (integration)", () => {
		it("transitions draft → active (ENG-CT-ST-001)", async () => {
			const { updateCampaignStatus } = await importCampaign();
			const mockResult = { _id: "camp1", status: "active" };
			mockCampaignFindByIdAndUpdate.mockResolvedValue(mockResult);

			const result = await updateCampaignStatus("camp1", "active");
			expect(result).toEqual(mockResult);
			expect(mockCampaignFindByIdAndUpdate).toHaveBeenCalledWith(
				"camp1",
				{ $set: { status: "active" } },
				{ new: true },
			);
		});

		it("transitions active → paused (ENG-CT-ST-002)", async () => {
			const { updateCampaignStatus } = await importCampaign();
			mockCampaignFindByIdAndUpdate.mockResolvedValue({ status: "paused" });

			const result = await updateCampaignStatus("camp1", "paused");
			expect(result!.status).toBe("paused");
		});

		it("returns null for non-existent campaign (ENG-CT-ERR-001)", async () => {
			const { updateCampaignStatus } = await importCampaign();
			mockCampaignFindByIdAndUpdate.mockResolvedValue(null);

			const result = await updateCampaignStatus("nonexistent", "active");
			expect(result).toBeNull();
		});
	});

	describe("executeCampaign (integration)", () => {
		it("executes active campaign and records events (ENG-CT-OK-009)", async () => {
			const { executeCampaign } = await importCampaign();
			const mockCamp = {
				_id: "camp1",
				status: "active",
				triggerId: "graduation",
				audience: { regions: ["전국"] },
			};

			// findById returns lean object (no .lean needed in this mock)
			mockCampaignFindById.mockResolvedValue(mockCamp);
			// matchUsersForTrigger calls User.find
			mockUserFind.mockResolvedValue([
				{ _id: "u1", nickname: "A", region: { sido: "서울", sigungu: "강남" }, children: [] },
				{ _id: "u2", nickname: "B", region: { sido: "부산", sigungu: "해운대" }, children: [{}] },
			]);
			mockEventInsertMany.mockResolvedValue([]);
			mockCampaignFindByIdAndUpdate.mockResolvedValue({});

			const result = await executeCampaign("camp1");
			expect(result.matched).toBe(2);
			expect(result.sent).toBe(2);
			expect(mockEventInsertMany).toHaveBeenCalledTimes(1);
			expect(mockCampaignFindByIdAndUpdate).toHaveBeenCalledWith("camp1", {
				$inc: { "kpi.reach": 2 },
			});
		});

		it("skips non-active campaign (ENG-CT-ERR-002)", async () => {
			const { executeCampaign } = await importCampaign();
			mockCampaignFindById.mockResolvedValue({ _id: "camp2", status: "draft" });

			const result = await executeCampaign("camp2");
			expect(result.matched).toBe(0);
			expect(result.sent).toBe(0);
		});

		it("handles zero matched users (ENG-CT-BND-004)", async () => {
			const { executeCampaign } = await importCampaign();
			mockCampaignFindById.mockResolvedValue({
				_id: "camp3",
				status: "active",
				triggerId: "relocation",
				audience: { regions: ["세종"] },
			});
			mockUserFind.mockResolvedValue([]);
			mockCampaignFindByIdAndUpdate.mockResolvedValue({});

			const result = await executeCampaign("camp3");
			expect(result.matched).toBe(0);
			expect(result.sent).toBe(0);
			expect(mockEventInsertMany).not.toHaveBeenCalled();
		});
	});

	describe("getCampaignAnalytics (integration)", () => {
		it("returns KPI with rates (ENG-CT-OK-010)", async () => {
			const { getCampaignAnalytics } = await importCampaign();
			const mockCamp = {
				_id: "camp1",
				name: "Test",
				status: "active",
				kpi: { reach: 100, clicks: 0, conversions: 0 },
			};
			// findById().lean() chain
			mockCampaignFindById.mockReturnValue({
				lean: () => Promise.resolve(mockCamp),
			});
			mockEventAggregate.mockResolvedValue([
				{ _id: "delivered", count: 80 },
				{ _id: "clicked", count: 20 },
				{ _id: "converted", count: 5 },
				{ _id: "failed", count: 2 },
			]);

			const result = await getCampaignAnalytics("camp1");
			expect(result).toBeDefined();
			expect(result!.reach).toBe(100);
			expect(result!.delivered).toBe(80);
			expect(result!.clicked).toBe(20);
			expect(result!.converted).toBe(5);
			expect(result!.failed).toBe(2);
			expect(result!.deliveryRate).toBe(0.8);
			expect(result!.clickRate).toBe(0.25);
			expect(result!.conversionRate).toBe(0.25);
		});

		it("returns zero rates for empty campaign (ENG-CT-BND-005)", async () => {
			const { getCampaignAnalytics } = await importCampaign();
			mockCampaignFindById.mockReturnValue({
				lean: () => Promise.resolve({
					_id: "camp2",
					name: "Empty",
					status: "draft",
					kpi: { reach: 0 },
				}),
			});
			mockEventAggregate.mockResolvedValue([]);

			const result = await getCampaignAnalytics("camp2");
			expect(result!.reach).toBe(0);
			expect(result!.deliveryRate).toBe(0);
			expect(result!.clickRate).toBe(0);
			expect(result!.conversionRate).toBe(0);
		});

		it("returns null for non-existent campaign (ENG-CT-ERR-003)", async () => {
			const { getCampaignAnalytics } = await importCampaign();
			mockCampaignFindById.mockReturnValue({
				lean: () => Promise.resolve(null),
			});

			const result = await getCampaignAnalytics("nonexistent");
			expect(result).toBeNull();
		});
	});

	describe("recordCampaignEvent (integration)", () => {
		it("records clicked event and updates kpi.clicks (ENG-CT-OK-011)", async () => {
			const { recordCampaignEvent } = await importCampaign();
			mockEventCreate.mockResolvedValue({});
			mockCampaignFindByIdAndUpdate.mockResolvedValue({});

			await recordCampaignEvent({
				campaignId: "camp1",
				userId: "u1",
				action: "clicked",
			});

			expect(mockEventCreate).toHaveBeenCalledTimes(1);
			expect(mockCampaignFindByIdAndUpdate).toHaveBeenCalledWith("camp1", {
				$inc: { "kpi.clicks": 1 },
			});
		});

		it("records converted event and updates kpi.conversions (ENG-CT-OK-012)", async () => {
			const { recordCampaignEvent } = await importCampaign();
			mockEventCreate.mockResolvedValue({});
			mockCampaignFindByIdAndUpdate.mockResolvedValue({});

			await recordCampaignEvent({
				campaignId: "camp1",
				userId: "u2",
				action: "converted",
			});

			expect(mockCampaignFindByIdAndUpdate).toHaveBeenCalledWith("camp1", {
				$inc: { "kpi.conversions": 1 },
			});
		});

		it("records sent event without KPI update (ENG-CT-OK-013)", async () => {
			const { recordCampaignEvent } = await importCampaign();
			mockEventCreate.mockResolvedValue({});

			await recordCampaignEvent({
				campaignId: "camp1",
				userId: "u3",
				action: "sent",
			});

			expect(mockEventCreate).toHaveBeenCalledTimes(1);
			expect(mockCampaignFindByIdAndUpdate).not.toHaveBeenCalled();
		});

		it("records failed event without KPI update (ENG-CT-OK-014)", async () => {
			const { recordCampaignEvent } = await importCampaign();
			mockEventCreate.mockResolvedValue({});

			await recordCampaignEvent({
				campaignId: "camp1",
				userId: "u4",
				action: "failed",
			});

			expect(mockEventCreate).toHaveBeenCalledTimes(1);
			expect(mockCampaignFindByIdAndUpdate).not.toHaveBeenCalled();
		});
	});

	describe("listCampaigns (integration)", () => {
		it("returns filtered campaigns (ENG-CT-OK-014)", async () => {
			const { listCampaigns } = await importCampaign();
			const mockCamps = [{ _id: "c1", name: "Active", status: "active" }];
			mockCampaignFind.mockResolvedValue(mockCamps);
			mockCampaignCountDocuments.mockResolvedValue(1);

			const result = await listCampaigns({ status: "active" });
			expect(result.data).toHaveLength(1);
			expect(result.total).toBe(1);
		});

		it("uses default pagination (ENG-CT-BND-006)", async () => {
			const { listCampaigns } = await importCampaign();
			mockCampaignFind.mockResolvedValue([]);
			mockCampaignCountDocuments.mockResolvedValue(0);

			const result = await listCampaigns({});
			expect(result.data).toHaveLength(0);
			expect(result.total).toBe(0);
		});
	});
});
