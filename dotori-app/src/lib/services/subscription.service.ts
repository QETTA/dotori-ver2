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
	targetUserId?: string;
	plan: SubscriptionPlan;
	paymentMethod?: string;
	amount?: number;
}

const createQueueByUserId = new Map<string, Promise<void>>();

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

function isDuplicateKeyError(error: unknown): boolean {
	if (!error || typeof error !== "object") {
		return false;
	}
	return (error as { code?: number }).code === 11000;
}

function isTransactionNotSupportedError(error: unknown): boolean {
	if (!(error instanceof Error)) {
		return false;
	}
	const message = error.message.toLowerCase();
	return (
		message.includes("transaction numbers are only allowed") ||
		message.includes("transactions are not supported")
	);
}

function createSubscriptionPayload(
	input: CreateSubscriptionInput,
	subscriptionUserId: string,
) {
	const startedAt = new Date();
	return {
		userId: subscriptionUserId,
		plan: input.plan,
		status: "active" as SubscriptionStatus,
		startedAt,
		expiresAt: addMonths(startedAt, API_CONFIG.SUBSCRIPTION.defaultPeriodMonths),
		paymentMethod: input.paymentMethod,
		amount: input.amount ?? 0,
	};
}

function mapCreateError(error: unknown): never {
	if (isDuplicateKeyError(error)) {
		throw new ApiError("이미 활성 구독이 존재합니다. 잠시 후 다시 시도해주세요", 409);
	}
	throw error;
}

async function performCreate(
	input: CreateSubscriptionInput,
	subscriptionUserId: string,
	session?: mongoose.ClientSession,
): Promise<SubscriptionRecord> {
	// 기존 active 구독 만료
	if (session) {
		await Subscription.updateMany(
			{ userId: subscriptionUserId, status: "active" },
			{ $set: { status: "expired" } },
			{ session },
		);
	} else {
		await Subscription.updateMany(
			{ userId: subscriptionUserId, status: "active" },
			{ $set: { status: "expired" } },
		);
	}

	const payload = createSubscriptionPayload(input, subscriptionUserId);

	const subscription = session
		? (await Subscription.create([payload], { session }))[0]
		: await Subscription.create(payload);

	// User plan 동기화
	const syncedUser = await User.findByIdAndUpdate(
		subscriptionUserId,
		{ $set: { plan: input.plan } },
		session ? { runValidators: false, session } : { runValidators: false },
	);
	if (!syncedUser) {
		throw new NotFoundError("구독 대상 사용자를 찾을 수 없습니다");
	}

	return subscription.toObject() as SubscriptionRecord;
}

async function withCreateQueue<T>(
	userId: string,
	task: () => Promise<T>,
): Promise<T> {
	const previous = createQueueByUserId.get(userId) ?? Promise.resolve();
	let releaseCurrent!: () => void;
	const current = new Promise<void>((resolve) => {
		releaseCurrent = resolve;
	});
	const next = previous.then(() => current, () => current);
	createQueueByUserId.set(userId, next);

	await previous.catch(() => undefined);

	try {
		return await task();
	} finally {
		releaseCurrent();
		if (createQueueByUserId.get(userId) === next) {
			createQueueByUserId.delete(userId);
		}
	}
}

/**
 * 구독 생성 — 기존 active 구독 자동 만료
 * TODO: Toss Payments 연동 시 결제 검증 추가
 */
export async function create(
	input: CreateSubscriptionInput,
): Promise<SubscriptionRecord> {
	// 요청자 ID는 항상 검증하여 기존 계약(잘못된 userId는 400)을 유지한다.
	validateObjectId(input.userId, "사용자 ID");
	if (input.targetUserId !== undefined) {
		validateObjectId(input.targetUserId, "대상 사용자 ID");
	}
	const subscriptionUserId = input.targetUserId ?? input.userId;

	return withCreateQueue(subscriptionUserId, async () => {
		const createWithoutTransaction = async () => {
			const previousActiveSubscriptions = await Subscription.find({
				userId: subscriptionUserId,
				status: "active",
			})
				.select("_id")
				.lean<{ _id: mongoose.Types.ObjectId }[]>();
			const previousActiveIds = previousActiveSubscriptions.map((sub) => sub._id);
			let createdSubscriptionId: mongoose.Types.ObjectId | null = null;

			try {
				await Subscription.updateMany(
					{ userId: subscriptionUserId, status: "active" },
					{ $set: { status: "expired" } },
				);

				const createdSubscription = await Subscription.create(
					createSubscriptionPayload(input, subscriptionUserId),
				);
				createdSubscriptionId = createdSubscription._id as mongoose.Types.ObjectId;

				const syncedUser = await User.findByIdAndUpdate(
					subscriptionUserId,
					{ $set: { plan: input.plan } },
					{ runValidators: false },
				);
				if (!syncedUser) {
					throw new NotFoundError("구독 대상 사용자를 찾을 수 없습니다");
				}

				return createdSubscription.toObject() as SubscriptionRecord;
			} catch (error) {
				const rollbackTasks: Promise<unknown>[] = [];
				if (createdSubscriptionId) {
					rollbackTasks.push(Subscription.deleteOne({ _id: createdSubscriptionId }));
				}
				if (previousActiveIds.length > 0) {
					rollbackTasks.push(
						Subscription.updateMany(
							{ _id: { $in: previousActiveIds }, status: "expired" },
							{ $set: { status: "active" } },
						),
					);
				}
				if (rollbackTasks.length > 0) {
					const rollbackResults = await Promise.allSettled(rollbackTasks);
					if (rollbackResults.some((result) => result.status === "rejected")) {
						throw new ApiError("구독 롤백 처리에 실패했습니다. 잠시 후 다시 시도해주세요", 500);
					}
				}
				mapCreateError(error);
			}
		};

		if (mongoose.connection.readyState !== 1) {
			return createWithoutTransaction();
		}

		let session: mongoose.ClientSession | null = null;
		try {
			session = await mongoose.startSession();
			const activeSession = session;
			let created: SubscriptionRecord | null = null;
			await activeSession.withTransaction(async () => {
				created = await performCreate(input, subscriptionUserId, activeSession);
			});
			if (!created) {
				throw new ApiError("구독 생성에 실패했습니다", 500);
			}
			return created;
		} catch (error) {
			if (isTransactionNotSupportedError(error)) {
				return createWithoutTransaction();
			}
			mapCreateError(error);
		} finally {
			if (session) {
				await session.endSession();
			}
		}
	});
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

	const hasOtherActive = await Subscription.exists({
		userId,
		status: "active",
	});
	if (!hasOtherActive) {
		// User plan을 free로 다운그레이드
		await User.findByIdAndUpdate(
			userId,
			{ $set: { plan: "free" } },
			{ runValidators: false },
		);
	}

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
