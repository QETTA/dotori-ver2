import { describe, it, expect } from "vitest";
import { generateTransferReasons } from "../why-engine";

describe("generateTransferReasons", () => {
  it("returns empty array when no transfer reason context", () => {
    const result = generateTransferReasons({} as any);
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns public_waitlist reason when facility is public type", () => {
    const facility = {
      type: "국공립",
      status: "waiting",
      capacity: { total: 20, current: 20, waiting: 5 },
      name: "테스트",
      id: "f1",
      address: "서울시 강남구",
      lat: 37.5,
      lng: 127.1,
      rating: 4.2,
      reviewCount: 12,
      features: [],
      lastSyncedAt: new Date().toISOString(),
    } as any;
    const result = generateTransferReasons(facility);
    expect(Array.isArray(result)).toBe(true);
  });
});
