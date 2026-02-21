import { describe, it, expect } from "vitest";
import { classifyIntent } from "../intent-classifier";

describe("classifyIntent", () => {
  it("classifies recommendation queries", () => {
    expect(classifyIntent("강남구 국공립 추천해줘")).toBe("recommend");
    expect(classifyIntent("근처 좋은 어린이집 찾아줘")).toBe("recommend");
    expect(classifyIntent("우리 동네 빈자리 있는 곳")).toBe("recommend");
  });

  it("classifies comparison queries", () => {
    expect(classifyIntent("두 곳 비교해줘")).toBe("compare");
    expect(classifyIntent("어디가 더 좋아?")).toBe("compare");
  });

  it("classifies explanation queries", () => {
    expect(classifyIntent("이 어린이집 뭐야")).toBe("explain");
    expect(classifyIntent("해오름 어린이집 설명해줘")).toBe("explain");
  });

  it("classifies status queries", () => {
    expect(classifyIntent("내 대기 순번 알려줘")).toBe("status");
    expect(classifyIntent("대기 현황 알려줘")).toBe("status");
  });

  it("classifies checklist queries", () => {
    expect(classifyIntent("입소 준비물 뭐야")).toBe("checklist");
    expect(classifyIntent("서류 뭐 챙겨야 해?")).toBe("checklist");
  });

  it("falls back to general", () => {
    expect(classifyIntent("안녕하세요")).toBe("general");
    expect(classifyIntent("감사합니다")).toBe("general");
  });

  it("uses context for disambiguation", () => {
    const context = {
      previousMessages: [
        { role: "assistant", content: "서초구 어린이집 3곳을 찾았어요!" },
      ],
    };
    expect(classifyIntent("여기 어떤 곳이야?", context)).toBe("explain");
  });
});
