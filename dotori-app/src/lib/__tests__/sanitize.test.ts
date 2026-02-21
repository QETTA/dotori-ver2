import { describe, it, expect } from "vitest";
import { stripHtml, sanitizeString, sanitizeContent, sanitizeSearchQuery } from "../sanitize";

describe("sanitize", () => {
  describe("stripHtml", () => {
    it("removes HTML tags", () => {
      expect(stripHtml("<script>alert(1)</script>hello")).toBe("hello");
      expect(stripHtml("<b>굵게</b>")).toBe("굵게");
      expect(stripHtml("<b>bold</b>")).toBe("bold");
      expect(stripHtml("no tags")).toBe("no tags");
    });
  });

  describe("sanitizeString", () => {
    it("trims and collapses whitespace", () => {
      expect(sanitizeString("  hello   world  ")).toBe("hello world");
    });
    it("strips HTML and trims", () => {
      expect(sanitizeString("<b>test</b>  input")).toBe("test input");
    });
  });

  describe("sanitizeContent", () => {
    it("preserves single newlines", () => {
      expect(sanitizeContent("line1\nline2")).toBe("line1\nline2");
    });
    it("limits consecutive newlines to 2", () => {
      expect(sanitizeContent("a\n\n\n\nb")).toBe("a\n\nb");
    });
  });

  describe("sanitizeSearchQuery", () => {
    it("truncates to 100 characters", () => {
      const long = "a".repeat(200);
      expect(sanitizeSearchQuery(long).length).toBe(100);
    });
  });
});
