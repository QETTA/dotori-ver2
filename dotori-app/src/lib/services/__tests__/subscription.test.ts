import { beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";

const mockSubscriptionFind = vi.fn();
const mockSubscriptionUpdateMany = vi.fn();
const mockSubscriptionExists = vi.fn();
const mockSubscriptionCreate = vi.fn();
const mockSubscriptionDeleteOne = vi.fn();
const mockSubscriptionFindOne = vi.fn();
const mockSubscriptionFindById = vi.fn();
const mockSubscriptionFindByIdAndUpdate = vi.fn();
const mockUserFindByIdAndUpdate = vi.fn();

vi.mock("@/lib/api-handler", () => {
	class MockApiError extends Error {
		status: number;

		constructor(message: string, status: number) {
			super(message);
			this.status = status;
		}
	}

	class MockNotFoundError extends MockApiError {
		constructor(message = "리소스를 찾을 수 없습니다") {
			super(message, 404);
		}
	}

	return {
		ApiError: MockApiError,
		NotFoundError: MockNotFoundError,
	};
});

vi.mock("@/models/Subscription", () => ({
	default: {
		find: (...args: unknown[]) => mockSubscriptionFind(...args),
		updateMany: (...args: unknown[]) => mockSubscriptionUpdateMany(...args),
		exists: (...args: unknown[]) => mockSubscriptionExists(...args),
		create: (...args: unknown[]) => mockSubscriptionCreate(...args),
		deleteOne: (...args: unknown[]) => mockSubscriptionDeleteOne(...args),
		findOne: (...args: unknown[]) => mockSubscriptionFindOne(...args),
		findById: (...args: unknown[]) => mockSubscriptionFindById(...args),
		findByIdAndUpdate: (...args: unknown[]) => mockSubscriptionFindByIdAndUpdate(...args),
	},
}));

vi.mock("@/models/User", () => ({
	default: {
		findByIdAndUpdate: (...args: unknown[]) => mockUserFindByIdAndUpdate(...args),
	},
}));

import {
	cancel,
	checkExpired,
	create,
	findById,
	getActive,
} from "../subscription.service";

const ADMIN_USER_ID = "507f1f77bcf86cd799439011";
const TARGET_USER_ID = "507f1f77bcf86cd799439012";
const SUBSCRIPTION_ID = "507f1f77bcf86cd799439013";

function buildSubscriptionDoc(
	userId: string,
	plan: "premium" | "partner",
) {
	return {
		toObject: () => ({
			_id: "507f1f77bcf86cd799439099",
			userId,
			plan,
			status: "active",
			startedAt: new Date("2026-01-01T00:00:00.000Z"),
			expiresAt: new Date("2026-02-01T00:00:00.000Z"),
			amount: 0,
		}),
	};
}

function buildLeanExecQuery<T>(value: T) {
	const exec = vi.fn().mockResolvedValue(value);
	const lean = vi.fn().mockReturnValue({ exec });
	return { lean, exec };
}

function buildSortLeanExecQuery<T>(value: T) {
	const query = buildLeanExecQuery(value);
	const sort = vi.fn().mockReturnValue({ lean: query.lean });
	return { sort, ...query };
}

describe("subscription.service create", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSubscriptionUpdateMany.mockResolvedValue({ modifiedCount: 1 });
		mockSubscriptionFind.mockReturnValue({
			select: vi.fn().mockReturnValue({
				lean: vi.fn().mockResolvedValue([]),
			}),
		});
		mockSubscriptionCreate.mockImplementation(
			(payload: { userId: string; plan: "premium" | "partner" }) => Promise.resolve(
				buildSubscriptionDoc(payload.userId, payload.plan),
			),
		);
		mockSubscriptionDeleteOne.mockResolvedValue({ deletedCount: 1 });
		mockUserFindByIdAndUpdate.mockResolvedValue({ _id: TARGET_USER_ID });
	});

	it("rejects invalid userId with ApiError 400 even when targetUserId exists", async () => {
		let caught: unknown;
		try {
			await create({
				userId: "invalid-user-id",
				targetUserId: TARGET_USER_ID,
				plan: "premium",
			});
		} catch (error) {
			caught = error;
		}

		expect(caught).toBeInstanceOf(Error);
		expect(caught).toMatchObject({
			status: 400,
			message: "유효하지 않은 사용자 ID입니다",
		});
		expect(mockSubscriptionUpdateMany).not.toHaveBeenCalled();
		expect(mockSubscriptionCreate).not.toHaveBeenCalled();
		expect(mockUserFindByIdAndUpdate).not.toHaveBeenCalled();
	});

	it("rejects invalid targetUserId with ApiError 400", async () => {
		let caught: unknown;
		try {
			await create({
				userId: ADMIN_USER_ID,
				targetUserId: "",
				plan: "premium",
			});
		} catch (error) {
			caught = error;
		}

		expect(caught).toBeInstanceOf(Error);
		expect(caught).toMatchObject({
			status: 400,
			message: "유효하지 않은 대상 사용자 ID입니다",
		});
		expect(mockSubscriptionUpdateMany).not.toHaveBeenCalled();
		expect(mockSubscriptionCreate).not.toHaveBeenCalled();
		expect(mockUserFindByIdAndUpdate).not.toHaveBeenCalled();
	});

	it("expires existing active subscriptions before creating a new subscription", async () => {
		await create({
			userId: ADMIN_USER_ID,
			targetUserId: TARGET_USER_ID,
			plan: "premium",
		});

		expect(mockSubscriptionUpdateMany).toHaveBeenCalledTimes(1);
		expect(mockSubscriptionCreate).toHaveBeenCalledTimes(1);
		expect(mockSubscriptionUpdateMany).toHaveBeenCalledWith(
			{ userId: TARGET_USER_ID, status: "active" },
			{ $set: { status: "expired" } },
		);
		expect(mockSubscriptionCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: TARGET_USER_ID,
				plan: "premium",
				status: "active",
			}),
		);
		const [updateOrder] = mockSubscriptionUpdateMany.mock.invocationCallOrder;
		const [createOrder] = mockSubscriptionCreate.mock.invocationCallOrder;
		expect(updateOrder).toBeLessThan(createOrder);
	});

	it("syncs user plan update after create", async () => {
		await create({
			userId: ADMIN_USER_ID,
			targetUserId: TARGET_USER_ID,
			plan: "partner",
		});

		expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith(
			TARGET_USER_ID,
			{ $set: { plan: "partner" } },
			{ runValidators: false },
		);
	});

	it("does not update user plan when subscription create fails", async () => {
		mockSubscriptionCreate.mockRejectedValueOnce(new Error("create failed"));

		await expect(
			create({
				userId: ADMIN_USER_ID,
				targetUserId: TARGET_USER_ID,
				plan: "partner",
			}),
		).rejects.toThrow("create failed");

		expect(mockUserFindByIdAndUpdate).not.toHaveBeenCalled();
	});

	it("restores previous active subscription when user sync fails after create", async () => {
		const previousActiveId = new mongoose.Types.ObjectId();
		mockSubscriptionFind.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				lean: vi.fn().mockResolvedValue([{ _id: previousActiveId }]),
			}),
		});
		mockSubscriptionCreate.mockResolvedValueOnce({
			_id: "507f1f77bcf86cd799439099",
			toObject: vi.fn().mockReturnValue({
				_id: "507f1f77bcf86cd799439099",
				userId: TARGET_USER_ID,
				plan: "premium",
				status: "active",
			}),
		});
		mockUserFindByIdAndUpdate.mockResolvedValueOnce(null);

		await expect(
			create({
				userId: ADMIN_USER_ID,
				targetUserId: TARGET_USER_ID,
				plan: "premium",
			}),
		).rejects.toMatchObject({
			status: 404,
			message: "구독 대상 사용자를 찾을 수 없습니다",
		});

		expect(mockSubscriptionDeleteOne).toHaveBeenCalledWith({
			_id: "507f1f77bcf86cd799439099",
		});
		expect(mockSubscriptionUpdateMany).toHaveBeenLastCalledWith(
			{ _id: { $in: [previousActiveId] }, status: "expired" },
			{ $set: { status: "active" } },
		);
	});

	it("fails with 500 when rollback itself fails", async () => {
		const previousActiveId = new mongoose.Types.ObjectId();
		mockSubscriptionFind.mockReturnValueOnce({
			select: vi.fn().mockReturnValue({
				lean: vi.fn().mockResolvedValue([{ _id: previousActiveId }]),
			}),
		});
		mockSubscriptionCreate.mockResolvedValueOnce({
			_id: "507f1f77bcf86cd799439099",
			toObject: vi.fn().mockReturnValue({
				_id: "507f1f77bcf86cd799439099",
				userId: TARGET_USER_ID,
				plan: "premium",
				status: "active",
			}),
		});
		mockUserFindByIdAndUpdate.mockResolvedValueOnce(null);
		mockSubscriptionDeleteOne.mockRejectedValueOnce(new Error("rollback delete failed"));

		await expect(
			create({
				userId: ADMIN_USER_ID,
				targetUserId: TARGET_USER_ID,
				plan: "premium",
			}),
		).rejects.toMatchObject({
			status: 500,
			message: "구독 롤백 처리에 실패했습니다. 잠시 후 다시 시도해주세요",
		});
	});

	it("keeps backward-compatible behavior when targetUserId is omitted", async () => {
		await create({
			userId: ADMIN_USER_ID,
			plan: "premium",
		});

		expect(mockSubscriptionUpdateMany).toHaveBeenCalledWith(
			{ userId: ADMIN_USER_ID, status: "active" },
			{ $set: { status: "expired" } },
		);
		expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith(
			ADMIN_USER_ID,
			{ $set: { plan: "premium" } },
			{ runValidators: false },
		);
	});
});

describe("subscription.service getActive", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("rejects invalid userId with ApiError 400", async () => {
		await expect(getActive("invalid-user-id")).rejects.toMatchObject({
			status: 400,
			message: "유효하지 않은 사용자 ID입니다",
		});
		expect(mockSubscriptionFindOne).not.toHaveBeenCalled();
	});

	it("returns latest active subscription", async () => {
		const activeSub = {
			_id: SUBSCRIPTION_ID,
			userId: ADMIN_USER_ID,
			plan: "premium",
			status: "active",
		};
		const query = buildSortLeanExecQuery(activeSub);
		mockSubscriptionFindOne.mockReturnValueOnce({ sort: query.sort });

		const result = await getActive(ADMIN_USER_ID);

		expect(mockSubscriptionFindOne).toHaveBeenCalledWith({
			userId: ADMIN_USER_ID,
			status: "active",
		});
		expect(query.sort).toHaveBeenCalledWith({ startedAt: -1 });
		expect(result).toBe(activeSub);
	});
});

describe("subscription.service findById", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("throws 403 when subscription owner is different", async () => {
		const query = buildLeanExecQuery({
			_id: SUBSCRIPTION_ID,
			userId: TARGET_USER_ID,
			status: "active",
		});
		mockSubscriptionFindById.mockReturnValueOnce({ lean: query.lean });

		await expect(findById(SUBSCRIPTION_ID, ADMIN_USER_ID)).rejects.toMatchObject({
			status: 403,
			message: "이 구독에 접근할 권한이 없습니다",
		});
	});

	it("returns subscription when owner matches", async () => {
		const ownedSub = {
			_id: SUBSCRIPTION_ID,
			userId: ADMIN_USER_ID,
			status: "active",
			plan: "partner",
		};
		const query = buildLeanExecQuery(ownedSub);
		mockSubscriptionFindById.mockReturnValueOnce({ lean: query.lean });

		const result = await findById(SUBSCRIPTION_ID, ADMIN_USER_ID);

		expect(mockSubscriptionFindById).toHaveBeenCalledWith(SUBSCRIPTION_ID);
		expect(result).toBe(ownedSub);
	});
});

describe("subscription.service cancel", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSubscriptionExists.mockResolvedValue(null);
		mockUserFindByIdAndUpdate.mockResolvedValue(null);
	});

	it("throws 400 when cancelling non-active subscription", async () => {
		const query = buildLeanExecQuery({
			_id: SUBSCRIPTION_ID,
			userId: ADMIN_USER_ID,
			status: "expired",
		});
		mockSubscriptionFindById.mockReturnValueOnce({ lean: query.lean });

		await expect(cancel(SUBSCRIPTION_ID, ADMIN_USER_ID)).rejects.toMatchObject({
			status: 400,
			message: "활성 구독만 해지할 수 있습니다",
		});
		expect(mockSubscriptionFindByIdAndUpdate).not.toHaveBeenCalled();
		expect(mockUserFindByIdAndUpdate).not.toHaveBeenCalled();
	});

	it("updates status to cancelled and downgrades user plan", async () => {
		const existingSub = buildLeanExecQuery({
			_id: SUBSCRIPTION_ID,
			userId: ADMIN_USER_ID,
			status: "active",
		});
		const cancelledSub = {
			_id: SUBSCRIPTION_ID,
			userId: ADMIN_USER_ID,
			status: "cancelled",
		};
		const updatedQuery = buildLeanExecQuery(cancelledSub);

		mockSubscriptionFindById.mockReturnValueOnce({ lean: existingSub.lean });
		mockSubscriptionFindByIdAndUpdate.mockReturnValueOnce({
			lean: updatedQuery.lean,
		});

		const result = await cancel(SUBSCRIPTION_ID, ADMIN_USER_ID);

		expect(mockSubscriptionFindByIdAndUpdate).toHaveBeenCalledWith(
			SUBSCRIPTION_ID,
			{ $set: { status: "cancelled" } },
			{ new: true },
		);
		expect(mockSubscriptionExists).toHaveBeenCalledWith({
			userId: ADMIN_USER_ID,
			status: "active",
		});
		expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith(
			ADMIN_USER_ID,
			{ $set: { plan: "free" } },
			{ runValidators: false },
		);
		expect(result).toBe(cancelledSub);
	});

	it("skips user plan downgrade when another active subscription exists", async () => {
		const existingSub = buildLeanExecQuery({
			_id: SUBSCRIPTION_ID,
			userId: ADMIN_USER_ID,
			status: "active",
		});
		const cancelledSub = {
			_id: SUBSCRIPTION_ID,
			userId: ADMIN_USER_ID,
			status: "cancelled",
		};
		const updatedQuery = buildLeanExecQuery(cancelledSub);
		mockSubscriptionFindById.mockReturnValueOnce({ lean: existingSub.lean });
		mockSubscriptionFindByIdAndUpdate.mockReturnValueOnce({
			lean: updatedQuery.lean,
		});
		mockSubscriptionExists.mockResolvedValueOnce({ _id: "active-sub" });

		const result = await cancel(SUBSCRIPTION_ID, ADMIN_USER_ID);

		expect(mockSubscriptionExists).toHaveBeenCalledWith({
			userId: ADMIN_USER_ID,
			status: "active",
		});
		expect(mockUserFindByIdAndUpdate).not.toHaveBeenCalled();
		expect(result).toBe(cancelledSub);
	});
});

describe("subscription.service checkExpired", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSubscriptionUpdateMany.mockResolvedValue({ modifiedCount: 0 });
		mockSubscriptionExists.mockResolvedValue(null);
	});

	it("returns 0 when there are no expired active subscriptions", async () => {
		mockSubscriptionFind.mockReturnValue({
			select: vi.fn().mockReturnValue({
				lean: vi.fn().mockResolvedValue([]),
			}),
		});

		const count = await checkExpired();

		expect(count).toBe(0);
		expect(mockSubscriptionUpdateMany).not.toHaveBeenCalled();
		expect(mockSubscriptionExists).not.toHaveBeenCalled();
		expect(mockUserFindByIdAndUpdate).not.toHaveBeenCalled();
	});

	it("expires subscriptions and skips downgrade when user still has another active subscription", async () => {
		const userToDowngrade = new mongoose.Types.ObjectId();
		const userToSkip = new mongoose.Types.ObjectId();
		const expiredSubIds = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];
		const expiredSubs = [
			{ _id: expiredSubIds[0], userId: userToDowngrade },
			{ _id: expiredSubIds[1], userId: userToSkip },
		];

		mockSubscriptionFind.mockReturnValue({
			select: vi.fn().mockReturnValue({
				lean: vi.fn().mockResolvedValue(expiredSubs),
			}),
		});
		mockSubscriptionExists.mockImplementation(
			async ({ userId }: { userId: string }) => (userId === String(userToSkip) ? { _id: "active" } : null),
		);

		const count = await checkExpired();

		expect(count).toBe(2);
		expect(mockSubscriptionUpdateMany).toHaveBeenCalledWith(
			{ _id: { $in: expiredSubIds } },
			{ $set: { status: "expired" } },
		);
		expect(mockSubscriptionExists).toHaveBeenNthCalledWith(1, {
			userId: String(userToDowngrade),
			status: "active",
		});
		expect(mockSubscriptionExists).toHaveBeenNthCalledWith(2, {
			userId: String(userToSkip),
			status: "active",
		});
		expect(mockUserFindByIdAndUpdate).toHaveBeenCalledTimes(1);
		expect(mockUserFindByIdAndUpdate).toHaveBeenCalledWith(
			String(userToDowngrade),
			{ $set: { plan: "free" } },
			{ runValidators: false },
		);
	});
});
