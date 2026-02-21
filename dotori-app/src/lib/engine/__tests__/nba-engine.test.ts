import { describe, it, expect } from "vitest";
import { generateNBAs, type NBAContext } from "../nba-engine";

const baseUser = {
  id: "user1",
  nickname: "테스트맘",
  children: [{ id: "c1", name: "도토리", birthDate: "2023-01-15", gender: "male" as const }],
  region: { sido: "서울특별시", sigungu: "강남구", dong: "역삼동" },
  interests: [],
  gpsVerified: false,
  plan: "free" as const,
  onboardingCompleted: true,
};

describe("generateNBAs", () => {
  it("returns login CTA for unauthenticated users", () => {
    const result = generateNBAs({
      user: null,
      interestFacilities: [],
      alertCount: 0,
      waitlistCount: 0,
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("login_cta");
  });

  it("returns onboarding CTA when not completed", () => {
    const ctx: NBAContext = {
      user: { ...baseUser, onboardingCompleted: false },
      interestFacilities: [],
      alertCount: 0,
      waitlistCount: 0,
    };
    const result = generateNBAs(ctx);
    expect(result[0].id).toBe("onboarding_incomplete");
  });

  it("returns child registration CTA first for unregistered user profile", () => {
    const ctx: NBAContext = {
      user: { ...baseUser, onboardingCompleted: false, children: [] },
      interestFacilities: [],
      alertCount: 0,
      waitlistCount: 0,
    };
    const result = generateNBAs(ctx);

    expect(result[0].id).toBe("onboarding_incomplete");
    expect(result[0].title).toContain("프로필");
    expect(result[0].action?.label).toBe("등록하기");
  });

  it("shows vacancy alert when interest facility has availability", () => {
    const ctx: NBAContext = {
      user: baseUser,
      interestFacilities: [
        {
          id: "f1", name: "해오름어린이집", type: "국공립", status: "available",
          address: "서울시 강남구", lat: 37.5, lng: 127.0,
          capacity: { total: 30, current: 28, waiting: 0 },
          features: [], rating: 4.5, reviewCount: 10, lastSyncedAt: new Date().toISOString(),
        },
      ],
      alertCount: 1,
      waitlistCount: 0,
    };
    const result = generateNBAs(ctx);
    expect(result.some((r) => r.id.startsWith("vacancy_"))).toBe(true);
  });

  it("includes vacancy alert for 이동 의향 사용자", () => {
    const ctx: NBAContext = {
      user: baseUser,
      interestFacilities: [
        {
          id: "f3", name: "희망어린이집", type: "국공립", status: "available",
          address: "서울시 서초구", lat: 37.5, lng: 127.01,
          capacity: { total: 30, current: 22, waiting: 2 },
          features: [], rating: 4.3, reviewCount: 2, lastSyncedAt: new Date().toISOString(),
        },
      ],
      alertCount: 2,
      waitlistCount: 1,
    };
    const result = generateNBAs(ctx);

    const vacancy = result.find((item) => item.id.startsWith("vacancy_"));

    expect(vacancy).toBeDefined();
    expect(vacancy?.title).toContain("빈자리");
    expect(result).toContainEqual(vacancy);
  });

  it("returns max 3 NBAs", () => {
    const ctx: NBAContext = {
      user: baseUser,
      interestFacilities: [],
      alertCount: 0,
      waitlistCount: 0,
    };
    const result = generateNBAs(ctx);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  describe("seasonal rules", () => {
    it("shows class assignment alert in March", () => {
      const originalDate = Date;
      global.Date = class extends Date {
        getMonth() {
          return 2;
        }
      } as typeof Date;

      const ctx: NBAContext = {
        user: baseUser,
        interestFacilities: [],
        alertCount: 0,
        waitlistCount: 0,
      };
      try {
        const result = generateNBAs(ctx);
        expect(result.some((n) => n.id === "class_assignment_season")).toBe(true);
      } finally {
        global.Date = originalDate;
      }
    });
  });
});
