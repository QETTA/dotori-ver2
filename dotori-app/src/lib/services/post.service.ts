/**
 * Post service layer.
 */
import mongoose from "mongoose";
import Post, { type IPost } from "@/models/Post";
import { ApiError, BadRequestError, NotFoundError } from "@/lib/api-handler";
import { toPostDTO } from "@/lib/dto";
import { sanitizeContent, sanitizeString } from "@/lib/sanitize";

const MIN_PAGE = 1;
const MIN_LIMIT = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export type PostRecord = Omit<IPost, keyof mongoose.Document> & {
	_id: mongoose.Types.ObjectId;
};

export interface ListPostsParams {
	category?: IPost["category"];
	facilityId?: string;
	sort?: "likes" | "createdAt" | string;
	page?: string | number;
	limit?: string | number;
}

export interface PostListResult {
	data: PostRecord[];
	total: number;
	page: number;
	limit: number;
}

export interface CreatePostInput {
	userId: string;
	authorNickname?: string;
	authorName?: string;
	authorAvatar?: string;
	authorImage?: string;
	authorVerified?: boolean;
	title?: string;
	content: string;
	category: IPost["category"];
	facilityTags?: string[];
}

export interface UpdatePostInput {
	id: string;
	userId: string;
	content?: string;
	category?: IPost["category"];
	facilityTags?: string[];
}

function toNumber(value?: string | number): number | undefined {
	if (value === undefined) return undefined;
	if (typeof value === "number") {
		return Number.isFinite(value) ? value : undefined;
	}
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizePage(value?: string | number): number {
	const parsed = toNumber(value);
	return Math.max(MIN_PAGE, Math.floor(parsed ?? MIN_PAGE));
}

function normalizeLimit(value?: string | number): number {
	const parsed = toNumber(value);
	return Math.max(MIN_LIMIT, Math.min(MAX_LIMIT, Math.floor(parsed ?? DEFAULT_LIMIT)));
}

const VALID_CATEGORIES = ["question", "review", "info", "feedback"] as const;

function parseCategory(category?: string): IPost["category"] | undefined {
	if (!category) {
		return undefined;
	}
	return VALID_CATEGORIES.includes(category as IPost["category"]) ? (category as IPost["category"]) : undefined;
}

export async function findById(id: string): Promise<PostRecord> {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new ApiError("유효하지 않은 게시물 ID입니다", 400);
	}

	const post = (await Post.findById(id).lean().exec()) as PostRecord | null;
	if (!post) {
		throw new NotFoundError("게시물을 찾을 수 없습니다");
	}

	return post;
}

export async function list(params: ListPostsParams = {}): Promise<PostListResult> {
	const page = normalizePage(params.page);
	const limit = normalizeLimit(params.limit);
	const skip = (page - 1) * limit;

	const filter: Record<string, unknown> = {};
	const category = parseCategory(params.category as unknown as string);
	if (params.category && !category) {
		throw new BadRequestError("유효하지 않은 카테고리입니다");
	}
	if (category) {
		filter.category = category;
	}
	if (params.facilityId && mongoose.Types.ObjectId.isValid(params.facilityId)) {
		filter.facilityTags = { $in: [params.facilityId] };
	}

	const sort: Record<string, mongoose.SortOrder> =
		params.sort === "likes" ? { likes: -1 as -1 } : { createdAt: -1 as -1 };

	const data = (await Post.find(filter)
		.sort(sort)
		.skip(skip)
		.limit(limit)
		.lean()
		.exec()) as PostRecord[];
	const total = await Post.countDocuments(filter);

	return {
		data,
		total: Number(total),
		page,
		limit,
	};
}

export async function create(input: CreatePostInput): Promise<PostRecord> {
	const nickname = sanitizeString(input.authorNickname || input.authorName || "익명");
	const avatar = sanitizeString(input.authorAvatar || input.authorImage || "");

	const post = await Post.create({
		authorId: input.userId,
		author: {
			nickname,
			avatar: avatar || undefined,
			verified: input.authorVerified ?? false,
		},
		title: input.title ? sanitizeString(input.title) : undefined,
		content: sanitizeContent(input.content),
		category: input.category,
		facilityTags: (input.facilityTags ?? []).map((item) => sanitizeString(item)),
	});

	return post.toObject() as PostRecord;
}

export async function update(input: UpdatePostInput): Promise<PostRecord> {
	if (!mongoose.Types.ObjectId.isValid(input.id)) {
		throw new ApiError("유효하지 않은 게시물 ID입니다", 400);
	}

	const post = await Post.findById(input.id);
	if (!post) {
		throw new NotFoundError("게시물을 찾을 수 없습니다");
	}
	if (String(post.authorId) !== input.userId) {
		throw new ApiError("권한이 없습니다", 403);
	}

	if (input.content !== undefined) {
		post.content = sanitizeContent(input.content);
	}
	if (input.category !== undefined) {
		post.category = input.category;
	}
	if (input.facilityTags !== undefined) {
		post.facilityTags = input.facilityTags.map((item) => sanitizeString(item));
	}

	const saved = await post.save();
	return saved.toObject() as PostRecord;
}

export async function deleteById(userId: string, id: string): Promise<boolean> {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new ApiError("유효하지 않은 게시물 ID입니다", 400);
	}

	const post = await Post.findById(id).select("authorId").lean<{ authorId: mongoose.Types.ObjectId }>().exec();
	if (!post) {
		throw new NotFoundError("게시물을 찾을 수 없습니다");
	}
	if (post.authorId.toString() !== userId) {
		throw new ApiError("권한이 없습니다", 403);
	}

	const deleted = await Post.findByIdAndDelete(id).lean().exec();
	if (!deleted) {
		throw new NotFoundError("게시물을 찾을 수 없습니다");
	}

	return true;
}

export async function likePost(id: string, userId: string): Promise<{ likes: number }> {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new ApiError("유효하지 않은 게시물 ID입니다", 400);
	}

	const post = await Post.findOneAndUpdate(
		{ _id: id, likedBy: { $ne: userId } },
		{ $addToSet: { likedBy: userId }, $inc: { likes: 1 } },
		{ new: true },
	).lean<PostRecord>();

	if (!post) {
		const existing = (await Post.findById(id).lean().exec()) as PostRecord | null;
		if (!existing) {
			throw new NotFoundError("게시물을 찾을 수 없습니다");
		}
		return { likes: existing.likes };
	}

	return { likes: post.likes };
}

export async function unlikePost(id: string, userId: string): Promise<{ likes: number }> {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new ApiError("유효하지 않은 게시물 ID입니다", 400);
	}

	const post = await Post.findOneAndUpdate(
		{ _id: id, likedBy: userId },
		{ $pull: { likedBy: userId }, $inc: { likes: -1 } },
		{ new: true },
	).lean<PostRecord>();

	if (!post) {
		const existing = (await Post.findById(id).lean().exec()) as PostRecord | null;
		if (!existing) {
			throw new NotFoundError("게시물을 찾을 수 없습니다");
		}
		return { likes: Math.max(0, existing.likes) };
	}

	return { likes: Math.max(0, post.likes) };
}

export const postService = {
	findById: async (id: string) => toPostDTO(await findById(id)),
	list: async (params: ListPostsParams) => {
		const result = await list(params);
		return {
			data: result.data.map((post) => toPostDTO(post)),
			pagination: {
				page: result.page,
				limit: result.limit,
				total: result.total,
				totalPages: result.total === 0 ? 0 : Math.ceil(result.total / result.limit),
			},
		};
	},
	create: async (input: CreatePostInput) => toPostDTO(await create(input)),
	update: async (input: UpdatePostInput) => toPostDTO(await update(input)),
	remove: async (id: string, userId: string) => {
		await deleteById(userId, id);
		return { deleted: true };
	},
	likePost,
	unlikePost,
};
