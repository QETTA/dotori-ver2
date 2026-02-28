/**
 * Campaign Engine
 *
 * Campaign lifecycle management + KPI aggregation.
 * Integrates with trigger-engine for audience matching.
 */
import Campaign, { type ICampaign, type CampaignStatus } from "@/models/Campaign";
import CampaignEvent, { type CampaignEventAction } from "@/models/CampaignEvent";
import { matchUsersForTrigger } from "@/lib/engines/trigger-engine";

/* ─── Campaign Lifecycle ─── */

export async function createCampaign(data: {
	name: string;
	triggerId: ICampaign["triggerId"];
	audience: ICampaign["audience"];
	schedule: { startDate: string; endDate?: string; cronExpression?: string };
	messageTemplate: string;
}): Promise<ICampaign> {
	return Campaign.create({
		name: data.name,
		triggerId: data.triggerId,
		audience: data.audience,
		schedule: {
			startDate: new Date(data.schedule.startDate),
			endDate: data.schedule.endDate ? new Date(data.schedule.endDate) : undefined,
			cronExpression: data.schedule.cronExpression,
		},
		messageTemplate: data.messageTemplate,
		status: "draft",
	});
}

export async function updateCampaignStatus(
	campaignId: string,
	status: CampaignStatus,
): Promise<ICampaign | null> {
	return Campaign.findByIdAndUpdate(
		campaignId,
		{ $set: { status } },
		{ new: true },
	);
}

/**
 * Execute a campaign: match audience → record "sent" events.
 * Actual alimtalk delivery is stubbed (Solapi 미연동).
 */
export async function executeCampaign(
	campaignId: string,
): Promise<{ matched: number; sent: number }> {
	const campaign = await Campaign.findById(campaignId);
	if (!campaign || campaign.status !== "active") {
		return { matched: 0, sent: 0 };
	}

	const matchedUsers = await matchUsersForTrigger({
		triggerId: campaign.triggerId,
		audience: campaign.audience,
	});

	// Record sent events (stub: no actual message delivery)
	const events = matchedUsers.map((user) => ({
		campaignId,
		userId: user.userId,
		action: "sent" as CampaignEventAction,
		timestamp: new Date(),
	}));

	if (events.length > 0) {
		await CampaignEvent.insertMany(events);
	}

	// Update KPI
	await Campaign.findByIdAndUpdate(campaignId, {
		$inc: { "kpi.reach": matchedUsers.length },
	});

	return { matched: matchedUsers.length, sent: events.length };
}

/* ─── KPI Aggregation ─── */

export interface CampaignAnalytics {
	campaignId: string;
	name: string;
	status: CampaignStatus;
	reach: number;
	delivered: number;
	clicked: number;
	converted: number;
	failed: number;
	deliveryRate: number;
	clickRate: number;
	conversionRate: number;
}

export async function getCampaignAnalytics(
	campaignId: string,
): Promise<CampaignAnalytics | null> {
	const campaign = await Campaign.findById(campaignId).lean<ICampaign>();
	if (!campaign) return null;

	const [actionCounts] = await CampaignEvent.aggregate([
		{ $match: { campaignId } },
		{
			$group: {
				_id: "$action",
				count: { $sum: 1 },
			},
		},
	]);

	const counts: Record<string, number> = {};
	if (actionCounts) {
		const rawCounts = await CampaignEvent.aggregate([
			{ $match: { campaignId } },
			{ $group: { _id: "$action", count: { $sum: 1 } } },
		]);
		for (const r of rawCounts) {
			counts[r._id as string] = r.count as number;
		}
	}

	const reach = campaign.kpi?.reach ?? 0;
	const delivered = counts.delivered ?? 0;
	const clicked = counts.clicked ?? 0;
	const converted = counts.converted ?? 0;
	const failed = counts.failed ?? 0;

	return {
		campaignId: String(campaign._id),
		name: campaign.name,
		status: campaign.status,
		reach,
		delivered,
		clicked,
		converted,
		failed,
		deliveryRate: reach > 0 ? delivered / reach : 0,
		clickRate: delivered > 0 ? clicked / delivered : 0,
		conversionRate: clicked > 0 ? converted / clicked : 0,
	};
}

/* ─── Campaign Queries ─── */

export async function listCampaigns(options: {
	status?: CampaignStatus;
	page?: number;
	limit?: number;
}): Promise<{ data: ICampaign[]; total: number }> {
	const { status, page = 1, limit = 20 } = options;
	const skip = (page - 1) * limit;

	const filter: Record<string, unknown> = {};
	if (status) filter.status = status;

	const [data, total] = await Promise.all([
		Campaign.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean<ICampaign[]>(),
		Campaign.countDocuments(filter),
	]);

	return { data, total };
}

export async function recordCampaignEvent(params: {
	campaignId: string;
	userId: string;
	action: CampaignEventAction;
	metadata?: Record<string, unknown>;
}): Promise<void> {
	await CampaignEvent.create({
		campaignId: params.campaignId,
		userId: params.userId,
		action: params.action,
		metadata: params.metadata,
		timestamp: new Date(),
	});

	// Update KPI counters
	const kpiField = params.action === "clicked" ? "kpi.clicks"
		: params.action === "converted" ? "kpi.conversions"
		: null;

	if (kpiField) {
		await Campaign.findByIdAndUpdate(params.campaignId, {
			$inc: { [kpiField]: 1 },
		});
	}
}
