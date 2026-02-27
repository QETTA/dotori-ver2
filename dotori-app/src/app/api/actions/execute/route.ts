import { NextResponse } from "next/server";
import { withApiHandler, NotFoundError, ApiError } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import { actionExecuteSchema } from "@/lib/validations";
import { executeAction } from "@/lib/engine/action-executor";
import ActionExecution from "@/models/ActionExecution";
import ActionIntent from "@/models/ActionIntent";

export const POST = withApiHandler(async (_req, { userId, body }) => {
	const { intentId } = body;

	const intent = await ActionIntent.findOne({
		_id: intentId,
		userId,
		status: "pending",
	});

	if (!intent) {
		throw new NotFoundError("유효한 인텐트를 찾을 수 없습니다");
	}

	if (intent.expiresAt < new Date()) {
		await ActionIntent.findByIdAndUpdate(intentId, {
			status: "expired",
		});
		throw new ApiError("인텐트가 만료되었습니다. 다시 시도해주세요.", 410);
	}

	// Idempotency: atomically claim the execution slot BEFORE executing
	const idempotencyKey = `${userId}-${intentId}`;
	const existingExecution =
		await ActionExecution.findOne({ idempotencyKey });
	if (existingExecution?.result && !("pending" in existingExecution.result)) {
		return NextResponse.json({ data: existingExecution.result });
	}
	// Another request is already executing this action
	if (existingExecution?.result && "pending" in existingExecution.result) {
		throw new ApiError("이 요청은 이미 처리 중입니다", 409);
	}

	// Claim slot atomically (will throw on duplicate key if another request got here first)
	if (!existingExecution) {
		try {
			await ActionExecution.create({
				intentId,
				userId,
				actionType: intent.actionType,
				result: { success: false, pending: true },
				idempotencyKey,
			});
		} catch {
			// Duplicate key = another request already claimed this execution
			const existing = await ActionExecution.findOne({ idempotencyKey });
			if (existing && !("pending" in (existing.result || {}))) {
				return NextResponse.json({ data: existing.result });
			}
			throw new ApiError("이 요청은 이미 처리 중입니다", 409);
		}
	}

	// Only one request reaches here — execute the action
	let result: { success: boolean; data?: unknown; error?: string };
	try {
		result = await executeAction(intent);
	} catch (err) {
		// Clean up orphaned execution so user can retry
		await ActionExecution.deleteOne({ idempotencyKey });
		throw err;
	}

	// Only mark intent as "confirmed" on success; leave "pending" on failure for retry
	await Promise.all([
		ActionIntent.findByIdAndUpdate(intentId, {
			status: result.success ? "confirmed" : "pending",
		}),
		ActionExecution.findOneAndUpdate(
			{ idempotencyKey },
			{ result },
		),
	]);

	if (!result.success) {
		// Delete execution record on failure so user can retry
		await ActionExecution.deleteOne({ idempotencyKey });
		throw new ApiError(result.error || "요청을 처리할 수 없습니다", 422, {
			code: "UNPROCESSABLE_ENTITY",
		});
	}

	return NextResponse.json({ data: result }, { status: 201 });
}, { auth: true, schema: actionExecuteSchema, rateLimiter: standardLimiter });
