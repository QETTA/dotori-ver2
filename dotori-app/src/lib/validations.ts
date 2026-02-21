/**
 * Zod validation schemas for API input parsing.
 * Centralized to ensure consistent validation across all routes.
 *
 * Note: Using Zod 4 API — `error`/`message` params, not `required_error`.
 */
import { NextResponse } from "next/server";
import { z } from "zod";

// --- Shared primitives ---

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "유효하지 않은 ID 형식입니다");
export const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이어야 합니다");

// --- Chat ---

export const chatMessageSchema = z.object({
	message: z
		.string({ error: "message는 필수입니다" })
		.min(1, "message는 필수입니다")
		.max(2000, "메시지는 2000자 이내로 입력해주세요"),
});

// --- Actions ---

/** facilityId: 단일 ObjectId 또는 쉼표 구분 다중 ObjectId (generate_report용) */
const facilityIdSchema = z.string().regex(
	/^[a-f\d]{24}(,[a-f\d]{24})*$/i,
	"유효하지 않은 시설 ID 형식입니다",
);

export const actionIntentSchema = z.object({
	actionType: z.enum(
		["register_interest", "apply_waiting", "set_alert", "generate_report", "generate_checklist"],
		{ error: "유효하지 않은 액션 타입입니다" },
	),
	params: z.object({
		facilityId: facilityIdSchema,
		childName: z.string().max(50).optional(),
		childBirthDate: dateStringSchema.optional(),
	}),
});

export const actionExecuteSchema = z.object({
	intentId: objectIdSchema,
});

// --- Waitlist ---

export const waitlistCreateSchema = z.object({
	facilityId: objectIdSchema,
	childName: z
		.string({ error: "아이 이름은 필수입니다" })
		.min(1, "아이 이름은 필수입니다")
		.max(50, "아이 이름은 50자 이내여야 합니다"),
	childBirthDate: dateStringSchema,
});

export const waitlistUpdateSchema = z.object({
	status: z.enum(["pending", "confirmed", "cancelled"]).optional(),
	checklist: z
		.array(
			z.object({
				docName: z.string(),
				checked: z.boolean(),
			}),
		)
		.optional(),
});

// --- Community ---

export const commentCreateSchema = z.object({
	content: z
		.string({ error: "댓글 내용은 필수입니다" })
		.min(1, "댓글 내용은 필수입니다")
		.transform((v) => v.slice(0, 2000)),
});

export const communityPostCreateSchema = z.object({
	content: z
		.string({ error: "내용을 입력해주세요" })
		.min(1, "내용을 입력해주세요")
		.max(5000, "내용은 5000자 이내여야 합니다"),
	category: z.enum(["question", "review", "info"], {
		error: "유효하지 않은 카테고리입니다",
	}),
	facilityTags: z.array(z.string()).max(5).optional(),
});

// --- Alerts ---

export const alertCreateSchema = z.object({
	facilityId: objectIdSchema,
	type: z.enum(
		[
			"vacancy",
			"waitlist_change",
			"review",
			"transfer_vacancy",
			"class_assignment",
			"teacher_change",
		],
		{
		error: "유효하지 않은 알림 타입입니다",
		},
	),
	condition: z.record(z.string(), z.unknown()).optional(),
	channels: z
		.array(z.enum(["push", "kakao", "email"]))
		.min(1, "최소 1개 채널을 선택해주세요")
		.optional(),
});

// --- User interests ---

export const interestSchema = z.object({
	facilityId: objectIdSchema,
});

// --- Helper: safe parse + 400 response ---

export function parseBody<T>(
	schema: z.ZodType<T>,
	data: unknown,
): { success: true; data: T } | { success: false; response: NextResponse } {
	const result = schema.safeParse(data);
	if (result.success) {
		return { success: true, data: result.data };
	}

	const firstError = result.error.issues[0];
	return {
		success: false,
		response: NextResponse.json(
			{ error: firstError?.message || "입력값이 올바르지 않습니다" },
			{ status: 400 },
		),
	};
}
