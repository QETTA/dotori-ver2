/**
 * Review (시설 리뷰/평점) 서비스 레이어
 */
import mongoose from "mongoose";
import Review from "@/models/Review";
import Facility from "@/models/Facility";
import { ApiError, NotFoundError, ForbiddenError, ConflictError } from "@/lib/api-handler";
import { sanitizeContent, sanitizeString } from "@/lib/sanitize";
import { normalizePage, normalizeLimit } from "@/lib/pagination";

export type ReviewRecord = {
	_id: mongoose.Types.ObjectId;
	userId: mongoose.Types.ObjectId;
	facilityId: mongoose.Types.ObjectId;
	rating: number;
	content: string;
	images: string[];
	verified: boolean;
	helpful: mongoose.Types.ObjectId[];
	createdAt: Date;
	updatedAt: Date;
};

export interface ReviewListParams {
	page?: string | number;
	limit?: string | number;
	sort?: "recent" | "rating" | "helpful";
}

export interface ReviewListResult {
	data: ReviewRecord[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export interface CreateReviewInput {
	userId: string;
	facilityId: string;
	rating: number;
	content: string;
	images?: string[];
}

export interface UpdateReviewInput {
	id: string;
	userId: string;
	rating?: number;
	content?: string;
	images?: string[];
}

// --- helpers ---

function validateObjectId(id: string, label: string): void {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new ApiError(`유효하지 않은 ${label}입니다`, 400);
	}
}

async function updateFacilityRating(facilityId: string): Promise<void> {
	const stats = await Review.aggregate([
		{ $match: { facilityId: new mongoose.Types.ObjectId(facilityId) } },
		{
			$group: {
				_id: null,
				avgRating: { $avg: "$rating" },
				count: { $sum: 1 },
			},
		},
	]);

	const avg = stats[0]?.avgRating ?? 0;
	const count = stats[0]?.count ?? 0;

	await Facility.findByIdAndUpdate(facilityId, {
		$set: {
			rating: Math.round(avg * 10) / 10,
			reviewCount: count,
		},
	});
}

// --- 서비스 함수 ---

export async function create(input: CreateReviewInput): Promise<ReviewRecord> {
	validateObjectId(input.userId, "사용자 ID");
	validateObjectId(input.facilityId, "시설 ID");

	const facilityExists = await Facility.exists({ _id: input.facilityId });
	if (!facilityExists) {
		throw new NotFoundError("시설을 찾을 수 없습니다");
	}

	// 중복 체크
	const existing = await Review.findOne({
		userId: input.userId,
		facilityId: input.facilityId,
	}).lean();
	if (existing) {
		throw new ConflictError("이미 해당 시설에 리뷰를 작성했습니다");
	}

	const doc = await Review.create({
		userId: input.userId,
		facilityId: input.facilityId,
		rating: input.rating,
		content: sanitizeContent(input.content),
		images: (input.images ?? []).slice(0, 5).map((url) => sanitizeString(url)),
		verified: false,
	});

	// Facility rating 원자적 갱신
	await updateFacilityRating(input.facilityId);

	return doc.toObject() as unknown as ReviewRecord;
}

export async function listByFacility(
	facilityId: string,
	params: ReviewListParams = {},
): Promise<ReviewListResult> {
	validateObjectId(facilityId, "시설 ID");

	const page = normalizePage(params.page);
	const limit = normalizeLimit(params.limit);
	const skip = (page - 1) * limit;

	const sortOption: Record<string, mongoose.SortOrder> =
		params.sort === "rating"
			? { rating: -1 as -1 }
			: params.sort === "helpful"
				? { helpful: -1 as -1 }
				: { createdAt: -1 as -1 };

	const filter = { facilityId };

	const [data, total] = await Promise.all([
		Review.find(filter)
			.sort(sortOption)
			.skip(skip)
			.limit(limit)
			.lean<ReviewRecord[]>()
			.exec(),
		Review.countDocuments(filter),
	]);

	return {
		data,
		pagination: {
			page,
			limit,
			total,
			totalPages: total === 0 ? 0 : Math.ceil(total / limit),
		},
	};
}

export async function update(input: UpdateReviewInput): Promise<ReviewRecord> {
	validateObjectId(input.id, "리뷰 ID");
	validateObjectId(input.userId, "사용자 ID");

	const review = await Review.findById(input.id);
	if (!review) {
		throw new NotFoundError("리뷰를 찾을 수 없습니다");
	}
	if (String(review.userId) !== input.userId) {
		throw new ForbiddenError("본인의 리뷰만 수정할 수 있습니다");
	}

	if (input.rating !== undefined) {
		review.rating = input.rating;
	}
	if (input.content !== undefined) {
		review.content = sanitizeContent(input.content);
	}
	if (input.images !== undefined) {
		review.images = input.images.slice(0, 5).map((url) => sanitizeString(url));
	}

	const saved = await review.save();

	// rating 재집계
	await updateFacilityRating(String(review.facilityId));

	return saved.toObject() as unknown as ReviewRecord;
}

export async function deleteById(
	id: string,
	userId: string,
): Promise<boolean> {
	validateObjectId(id, "리뷰 ID");
	validateObjectId(userId, "사용자 ID");

	const review = await Review.findById(id)
		.select("userId facilityId")
		.lean<{ userId: mongoose.Types.ObjectId; facilityId: mongoose.Types.ObjectId }>()
		.exec();
	if (!review) {
		throw new NotFoundError("리뷰를 찾을 수 없습니다");
	}
	if (String(review.userId) !== userId) {
		throw new ForbiddenError("본인의 리뷰만 삭제할 수 있습니다");
	}

	await Review.findByIdAndDelete(id);

	// rating 재집계
	await updateFacilityRating(String(review.facilityId));

	return true;
}

export async function toggleHelpful(
	id: string,
	userId: string,
): Promise<{ helpfulCount: number }> {
	validateObjectId(id, "리뷰 ID");
	validateObjectId(userId, "사용자 ID");

	// 이미 helpful 눌렀으면 해제, 아니면 추가
	const review = await Review.findById(id).lean<ReviewRecord | null>().exec();
	if (!review) {
		throw new NotFoundError("리뷰를 찾을 수 없습니다");
	}

	const alreadyHelpful = review.helpful.some(
		(uid) => String(uid) === userId,
	);

	const updated = alreadyHelpful
		? await Review.findByIdAndUpdate(
				id,
				{ $pull: { helpful: userId } },
				{ new: true },
			).lean<ReviewRecord>()
		: await Review.findByIdAndUpdate(
				id,
				{ $addToSet: { helpful: userId } },
				{ new: true },
			).lean<ReviewRecord>();

	return { helpfulCount: updated?.helpful?.length ?? 0 };
}

export async function aggregateRating(
	facilityId: string,
): Promise<{ avgRating: number; count: number }> {
	validateObjectId(facilityId, "시설 ID");

	const stats = await Review.aggregate([
		{ $match: { facilityId: new mongoose.Types.ObjectId(facilityId) } },
		{
			$group: {
				_id: null,
				avgRating: { $avg: "$rating" },
				count: { $sum: 1 },
			},
		},
	]);

	return {
		avgRating: Math.round((stats[0]?.avgRating ?? 0) * 10) / 10,
		count: stats[0]?.count ?? 0,
	};
}

export const reviewService = {
	create,
	listByFacility,
	update,
	deleteById,
	toggleHelpful,
	aggregateRating,
};
