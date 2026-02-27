import { describe, it, expect, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ default: vi.fn() }));
vi.mock("@/lib/logger", () => ({
	log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { toFacilityDTO } from "@/lib/dto";

describe("facility.service", () => {
	describe("toFacilityDTO", () => {
		const baseFacility = {
			_id: "507f1f77bcf86cd799439011",
			name: "도토리 어린이집",
			type: "국공립",
			status: "available",
			address: "서울특별시 강남구 역삼동 123",
			capacity: { total: 100, current: 80, waiting: 5 },
			location: { coordinates: [127.0495, 37.5011] as [number, number] },
		};

		it("transforms _id to id string", () => {
			const dto = toFacilityDTO(baseFacility);
			expect(dto.id).toBe("507f1f77bcf86cd799439011");
		});

		it("transforms GeoJSON [lng, lat] to lat, lng", () => {
			const dto = toFacilityDTO(baseFacility);
			expect(dto.lat).toBeCloseTo(37.5011);
			expect(dto.lng).toBeCloseTo(127.0495);
		});

		it("returns 0,0 when no coordinates", () => {
			const dto = toFacilityDTO({ ...baseFacility, location: undefined });
			expect(dto.lat).toBe(0);
			expect(dto.lng).toBe(0);
		});

		it("formats distance from meters", () => {
			const dto = toFacilityDTO(baseFacility, 1500);
			expect(dto.distance).toBeTruthy();
			// formatDistance should return something like "1.5km"
			expect(typeof dto.distance).toBe("string");
		});

		it("preserves capacity object", () => {
			const dto = toFacilityDTO(baseFacility);
			expect(dto.capacity.total).toBe(100);
			expect(dto.capacity.current).toBe(80);
			expect(dto.capacity.waiting).toBe(5);
		});

		it("defaults features to empty array", () => {
			const dto = toFacilityDTO(baseFacility);
			expect(dto.features).toEqual([]);
		});

		it("defaults rating and reviewCount to 0", () => {
			const dto = toFacilityDTO(baseFacility);
			expect(dto.rating).toBe(0);
			expect(dto.reviewCount).toBe(0);
		});

		it("handles premium facility", () => {
			const premiumFacility = {
				...baseFacility,
				isPremium: true,
				premium: {
					isActive: true,
					plan: "pro" as const,
					features: ["우선노출", "상세분석"],
					sortBoost: 10,
				},
			};
			const dto = toFacilityDTO(premiumFacility);
			expect(dto.isPremium).toBe(true);
			expect(dto.premium?.isActive).toBe(true);
			expect(dto.premium?.plan).toBe("pro");
		});

		it("handles Date lastSyncedAt", () => {
			const date = new Date("2026-01-15T10:00:00Z");
			const dto = toFacilityDTO({ ...baseFacility, lastSyncedAt: date });
			expect(dto.lastSyncedAt).toBe("2026-01-15T10:00:00.000Z");
		});

		it("handles string lastSyncedAt", () => {
			const dto = toFacilityDTO({
				...baseFacility,
				lastSyncedAt: "2026-01-15T10:00:00Z",
			});
			expect(dto.lastSyncedAt).toBe("2026-01-15T10:00:00Z");
		});
	});
});
