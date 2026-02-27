import { describe, it, expect } from "vitest";
import { chatMessageSchema, waitlistCreateSchema, objectIdSchema } from "../validations";

describe("validations", () => {
  describe("objectIdSchema", () => {
    it("accepts valid ObjectIds", () => {
      expect(objectIdSchema.safeParse("507f1f77bcf86cd799439011").success).toBe(true);
    });
    it("rejects invalid ObjectIds", () => {
      expect(objectIdSchema.safeParse("invalid").success).toBe(false);
      expect(objectIdSchema.safeParse("").success).toBe(false);
    });
  });

  describe("chatMessageSchema", () => {
    it("accepts valid messages", () => {
      expect(chatMessageSchema.safeParse({ message: "hello" }).success).toBe(true);
    });
    it("rejects empty messages", () => {
      expect(chatMessageSchema.safeParse({ message: "" }).success).toBe(false);
    });
    it("rejects messages over 2000 chars", () => {
      expect(chatMessageSchema.safeParse({ message: "a".repeat(2001) }).success).toBe(false);
    });
  });

  describe("waitlistCreateSchema", () => {
    it("accepts valid waitlist data", () => {
      const result = waitlistCreateSchema.safeParse({
        facilityId: "507f1f77bcf86cd799439011",
        childName: "김도토리",
        childBirthDate: "2023-05-15",
      });
      expect(result.success).toBe(true);
    });
    it("rejects invalid dates", () => {
      const result = waitlistCreateSchema.safeParse({
        facilityId: "507f1f77bcf86cd799439011",
        childName: "김도토리",
        childBirthDate: "not-a-date",
      });
      expect(result.success).toBe(false);
    });
  });
});
