/**
 * B2B Partner Auth Engine
 *
 * API key verification + tier-based rate limiting (MongoDB sliding window).
 * No Redis dependency — uses TTL-indexed ApiUsageLog for daily counts.
 */
import crypto from "node:crypto";
import mongoose from "mongoose";
import Partner, { type IPartner, TIER_RATE_LIMITS } from "@/models/Partner";
import ApiUsageLog from "@/models/ApiUsageLog";
import { API_CONFIG } from "@/lib/config/api";

export class PartnerNotFoundError extends Error {
	constructor(message = "파트너를 찾을 수 없습니다") {
		super(message);
		this.name = "PartnerNotFoundError";
	}
}

/* ─── API Key Generation ─── */

export interface GeneratedApiKey {
	/** Raw key to return to user (only shown once) */
	rawKey: string;
	/** SHA-256 hash stored in DB */
	hash: string;
	/** First N chars for identification */
	prefix: string;
}

export function generateApiKey(): GeneratedApiKey {
	const rawKey = crypto
		.randomBytes(API_CONFIG.PARTNER.apiKeyBytes)
		.toString("hex");
	const hash = crypto.createHash("sha256").update(rawKey).digest("hex");
	const prefix = rawKey.slice(0, API_CONFIG.PARTNER.apiKeyPrefixLength);
	return { rawKey, hash, prefix };
}

export function hashApiKey(rawKey: string): string {
	return crypto.createHash("sha256").update(rawKey).digest("hex");
}

/* ─── API Key Verification ─── */

export async function verifyApiKey(rawKey: string): Promise<IPartner | null> {
	const hash = hashApiKey(rawKey);
	const partner = await Partner.findOne({ apiKeyHash: hash, isActive: true }).lean<IPartner>();
	return partner ?? null;
}

/* ─── Rate Limiting (MongoDB sliding window) ─── */

export interface RateLimitResult {
	allowed: boolean;
	limit: number;
	remaining: number;
	resetAt: Date;
}

/**
 * Check and consume a rate limit token for the given partner.
 * Uses daily window based on partner tier.
 */
export async function checkRateLimit(
	partnerId: string,
	tier: IPartner["tier"],
): Promise<RateLimitResult> {
	const limit = TIER_RATE_LIMITS[tier];
	const now = new Date();
	const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

	const usageCount = await ApiUsageLog.countDocuments({
		partnerId,
		timestamp: { $gte: dayStart, $lt: dayEnd },
	});

	const remaining = Math.max(0, limit - usageCount);
	return {
		allowed: usageCount < limit,
		limit,
		remaining,
		resetAt: dayEnd,
	};
}

/* ─── Usage Logging ─── */

export async function logApiUsage(params: {
	partnerId: string;
	endpoint: string;
	method: string;
	statusCode: number;
	responseMs: number;
}): Promise<void> {
	await ApiUsageLog.create({
		partnerId: params.partnerId,
		endpoint: params.endpoint,
		method: params.method,
		statusCode: params.statusCode,
		responseMs: params.responseMs,
		timestamp: new Date(),
	});
}

/* ─── Usage Statistics ─── */

export interface UsageStats {
	daily: { date: string; count: number }[];
	monthly: { month: string; count: number }[];
	totalRequests: number;
	avgResponseMs: number;
}

export async function getUsageStats(
	partnerId: string,
	days = 30,
): Promise<UsageStats> {
	const since = new Date();
	since.setDate(since.getDate() - days);

	const partnerObjectId = new mongoose.Types.ObjectId(partnerId);

	const [dailyAgg, monthlyAgg, totalAgg] = await Promise.all([
		ApiUsageLog.aggregate([
			{ $match: { partnerId: partnerObjectId, timestamp: { $gte: since } } },
			{
				$group: {
					_id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
					count: { $sum: 1 },
				},
			},
			{ $sort: { _id: 1 } },
		]),
		ApiUsageLog.aggregate([
			{ $match: { partnerId: partnerObjectId, timestamp: { $gte: since } } },
			{
				$group: {
					_id: { $dateToString: { format: "%Y-%m", date: "$timestamp" } },
					count: { $sum: 1 },
				},
			},
			{ $sort: { _id: 1 } },
		]),
		ApiUsageLog.aggregate([
			{ $match: { partnerId: partnerObjectId, timestamp: { $gte: since } } },
			{
				$group: {
					_id: null,
					totalRequests: { $sum: 1 },
					avgResponseMs: { $avg: "$responseMs" },
				},
			},
		]),
	]);

	const totals = totalAgg[0] ?? { totalRequests: 0, avgResponseMs: 0 };

	return {
		daily: dailyAgg.map((d: { _id: string; count: number }) => ({
			date: d._id,
			count: d.count,
		})),
		monthly: monthlyAgg.map((m: { _id: string; count: number }) => ({
			month: m._id,
			count: m.count,
		})),
		totalRequests: totals.totalRequests,
		avgResponseMs: Math.round(totals.avgResponseMs),
	};
}

/* ─── Partner CRUD ─── */

export async function createPartner(data: {
	name: string;
	contactEmail: string;
	contactPhone?: string;
	tier?: IPartner["tier"];
}): Promise<{ partner: IPartner; rawApiKey: string }> {
	const { rawKey, hash, prefix } = generateApiKey();
	const tier = data.tier ?? "free";

	const partner = await Partner.create({
		name: data.name,
		contactEmail: data.contactEmail,
		contactPhone: data.contactPhone,
		tier,
		apiKeyHash: hash,
		apiKeyPrefix: prefix,
		rateLimit: TIER_RATE_LIMITS[tier],
	});

	return { partner, rawApiKey: rawKey };
}

export async function regenerateApiKey(
	partnerId: string,
): Promise<{ rawApiKey: string; prefix: string }> {
	const { rawKey, hash, prefix } = generateApiKey();

	const updated = await Partner.findByIdAndUpdate(
		partnerId,
		{ $set: { apiKeyHash: hash, apiKeyPrefix: prefix } },
		{ new: true },
	);

	if (!updated) {
		throw new PartnerNotFoundError();
	}

	return { rawApiKey: rawKey, prefix };
}
