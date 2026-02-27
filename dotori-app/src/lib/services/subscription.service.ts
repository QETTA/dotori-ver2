/**
 * Subscription 서비스 레이어
 */
import mongoose from "mongoose";
import Subscription, {
	type ISubscription,
	type SubscriptionPlan,
	type SubscriptionStatus,
} from "@/models/Subscription";
import User from "@/models/User";
import { ApiError, NotFoundError } from "@/lib/api-handler";
import { API_CONFIG } from "@/lib/config/api";

export type SubscriptionRecord = Omit<
	ISubscription,
	keyof mongoose.Document
> & {
	_id: mongoose.Types.ObjectId;
};

export interface CreateSubscriptionInput {
	userId: string;
	plan: SubscriptionPlan;
	paymentMethod?: string;
	amount?: number;
}

function validateObjectId(id: string, label: string): void {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new ApiError(`유효하지 않은 ${label}입니다`, 400);
	}
}

function addMonths(date: Date, months: number): Date {
	const result = new Date(date);
	result.setMonth(result.getMonth() + months);
	return result;
}

/**
 * 구독 생성 — 기존 active 구독 자동 만료
 * TODO: Toss Payments 연동 시 결제 검증 추가
 */
export async function create(
	input: CreateSubscriptionInput,
): Promise<SubscriptionRecord> {
	validateObjectId(input.userId, "사용자 ID");

	// 기존 active 구독 만료
	await Subscription.updateMany(
		{ userId: input.userId, status: "active" },
		{ $set: { status: "expired" } },
	);

	const startedAt = new Date();
	const expiresAt = addMonths(
		startedAt,
		API_CONFIG.SUBSCRIPTION.defaultPeriodMonths,
	);

	const subscription = await Subscription.create({
		userId: input.userId,
		plan: input.plan,
		status: "active" as SubscriptionStatus,
		startedAt,
		expiresAt,
		paymentMethod: input.paymentMethod,
		amount: input.amount ?? 0,
	});

	// User plan 동기화
	await User.findByIdAndUpdate(
		input.userId,
		{ $set: { plan: input.plan } },
		{ runValidators: false },
	);

	return subscription.toObject() as SubscriptionRecord;
}

/**
 * 활성 구독 조회
 */
export async function getActive(
	userId: string,
): Promise<SubscriptionRecord | null> {
	validateObjectId(userId, "사용자 ID");

	const sub = (await Subscription.findOne({
		userId,
		status: "active",
	})
		.sort({ startedAt: -1 })
		.lean()
		.exec()) as SubscriptionRecord | null;

	return sub;
}

/**
 * 구독 상세 조회
 */
export async function findById(
	id: string,
	userId: string,
): Promise<SubscriptionRecord> {
	validateObjectId(id, "구독 ID");
	validateObjectId(userId, "사용자 ID");

	const sub = (await Subscription.findById(id)
		.lean()
		.exec()) as SubscriptionRecord | null;

	if (!sub) {
		throw new NotFoundError("구독을 찾을 수 없습니다");
	}
	if (String(sub.userId) !== userId) {
		throw new ApiError("이 구독에 접근할 권한이 없습니다", 403);
	}
	return sub;
}

/**
 * 구독 해지 (즉시 만료가 아닌 기간 종료 후 해지)
 */
export async function cancel(
	id: string,
	userId: string,
): Promise<SubscriptionRecord> {
	const sub = await findById(id, userId);

	if (sub.status !== "active") {
		throw new ApiError("활성 구독만 해지할 수 있습니다", 400);
	}

	const updated = (await Subscription.findByIdAndUpdate(
		id,
		{ $set: { status: "cancelled" as SubscriptionStatus } },
		{ new: true },
	)
		.lean()
		.exec()) as SubscriptionRecord | null;

	if (!updated) {
		throw new NotFoundError("구독을 찾을 수 없습니다");
	}

	// User plan을 free로 다운그레이드
	await User.findByIdAndUpdate(
		userId,
		{ $set: { plan: "free" } },
		{ runValidators: false },
	);

	return updated;
}

/**
 * 만료 구독 자동 처리 (크론용)
 * active 상태이면서 expiresAt이 지난 구독 → expired + User plan 다운그레이드
 */
export async function checkExpired(): Promise<number> {
	const now = new Date();
	const expiredSubs = await Subscription.find({
		status: "active",
		expiresAt: { $lt: now },
	})
		.select("_id userId")
		.lean<{ _id: mongoose.Types.ObjectId; userId: mongoose.Types.ObjectId }[]>();

	if (expiredSubs.length === 0) return 0;

	const ids = expiredSubs.map((s) => s._id);
	const userIds = [...new Set(expiredSubs.map((s) => String(s.userId)))];

	await Subscription.updateMany(
		{ _id: { $in: ids } },
		{ $set: { status: "expired" } },
	);

	// 아직 다른 active 구독이 없는 사용자만 free로 다운그레이드
	for (const uid of userIds) {
		const hasOtherActive = await Subscription.exists({
			userId: uid,
			status: "active",
		});
		if (!hasOtherActive) {
			await User.findByIdAndUpdate(
				uid,
				{ $set: { plan: "free" } },
				{ runValidators: false },
			);
		}
	}

	return expiredSubs.length;
}

export const subscriptionService = {
	create,
	getActive,
	findById,
	cancel,
	checkExpired,
};
