import { describe, expect, it } from "@jest/globals";
import { toFacilityDTO } from "@/lib/dto";

type FacilityDocument = Parameters<typeof toFacilityDTO>[0];

const buildFacilityDocument = (overrides: Partial<FacilityDocument> = {}): FacilityDocument => ({
	_id: "facility-1",
	name: "강남유치원",
	type: "국공립",
	status: "available",
	address: "서울특별시 강남구",
	capacity: {
		total: 30,
		current: 24,
		waiting: 3,
	},
	features: ["영어", "낮잠"],
	rating: 4.3,
	reviewCount: 12,
	dataQuality: {
		score: 80,
		missing: ["사진"],
	},
	...overrides,
});

describe("toFacilityDTO", () => {
	it("omits premium when premium.isActive is false", () => {
		const facility = toFacilityDTO(
			buildFacilityDocument({
				premium: {
					isActive: false,
					plan: "basic",
					startDate: "2026-01-01T00:00:00.000Z",
					endDate: "2026-12-31T23:59:59.999Z",
					features: ["공지"],
					sortBoost: 4,
					verifiedAt: "2026-02-01T00:00:00.000Z",
					contactPerson: "담당자",
					contactPhone: "010-0000-0000",
					contactEmail: "manager@example.com",
				},
			}),
		);

		expect(facility).not.toHaveProperty("premium");
	});

	it("includes premium when premium.isActive is true", () => {
		const facility = toFacilityDTO(
			buildFacilityDocument({
				premium: {
					isActive: true,
					plan: "pro",
					startDate: "2026-01-01T00:00:00.000Z",
					endDate: "2026-12-31T23:59:59.999Z",
					features: ["우선순위"],
					sortBoost: 5,
					verifiedAt: "2026-02-01T00:00:00.000Z",
				},
			}),
		);

		expect(facility).toHaveProperty("premium");
		expect(facility.premium).toMatchObject({
			isActive: true,
			plan: "pro",
			sortBoost: 5,
			features: ["우선순위"],
		});
	});

	it("omits premium when premium is missing", () => {
		const facility = toFacilityDTO(buildFacilityDocument());
		expect(facility).not.toHaveProperty("premium");
	});
});
