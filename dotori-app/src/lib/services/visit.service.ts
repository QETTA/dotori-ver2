/**
 * Visit (견학 신청) 서비스 레이어
 */
import mongoose from "mongoose";
import Visit, { type IVisit } from "@/models/Visit";
import Facility from "@/models/Facility";
import { ApiError, NotFoundError, ForbiddenError, ConflictError } from "@/lib/api-handler";
import { auditService } from "@/lib/services/audit.service";
import { cpaService } from "@/lib/services/cpa.service";
import { normalizePage, normalizeLimit } from "@/lib/pagination";

export type VisitRecord = {
	_id: mongoose.Types.ObjectId;
	userId: mongoose.Types.ObjectId;
	facilityId: mongoose.Types.ObjectId;
	childId?: mongoose.Types.ObjectId;
	status: IVisit["status"];
	scheduledAt: Date;
	notes?: string;
	confirmedAt?: Date;
	cancelReason?: string;
	createdAt: Date;
	updatedAt: Date;
};

export interface VisitListParams {
	page?: string | number;
	limit?: string | number;
	status?: IVisit["status"];
}

export interface VisitListResult {
	data: VisitRecord[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export interface CreateVisitInput {
	userId: string;
	facilityId: string;
	childId?: string;
	scheduledAt: string;
	notes?: string;
}

// --- helpers ---

function validateObjectId(id: string, label: string): void {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new ApiError(`유효하지 않은 ${label}입니다`, 400);
	}
}

// --- 상태전이 규칙 ---

const VALID_TRANSITIONS: Record<IVisit["status"], IVisit["status"][]> = {
	requested: ["confirmed", "cancelled"],
	confirmed: ["completed", "cancelled"],
	completed: [],
	cancelled: [],
};

export function isValidTransition(
	from: IVisit["status"],
	to: IVisit["status"],
): boolean {
	return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// --- 서비스 함수 ---

export async function create(input: CreateVisitInput): Promise<VisitRecord> {
	validateObjectId(input.userId, "사용자 ID");
	validateObjectId(input.facilityId, "시설 ID");

	const facilityExists = await Facility.exists({ _id: input.facilityId });
	if (!facilityExists) {
		throw new NotFoundError("시설을 찾을 수 없습니다");
	}

	// 중복 체크 (같은 사용자-시설 조합)
	const existing = await Visit.findOne({
		userId: input.userId,
		facilityId: input.facilityId,
		status: { $in: ["requested", "confirmed"] },
	}).lean();
	if (existing) {
		throw new ConflictError("이미 해당 시설에 견학 신청이 있습니다");
	}

	const doc = await Visit.create({
		userId: input.userId,
		facilityId: input.facilityId,
		childId: input.childId || undefined,
		scheduledAt: new Date(input.scheduledAt),
		notes: input.notes,
		status: "requested",
	});

	void auditService.record({
		action: "visit.create" as const,
		userId: input.userId,
		targetType: "visit" as const,
		targetId: String(doc._id),
		metadata: { facilityId: input.facilityId },
	});

	void cpaService.recordCPA({
		eventType: "visit_request",
		userId: input.userId,
		facilityId: input.facilityId,
		targetId: String(doc._id),
	});

	return doc.toObject() as unknown as VisitRecord;
}

export async function findByUser(
	userId: string,
	params: VisitListParams = {},
): Promise<VisitListResult> {
	validateObjectId(userId, "사용자 ID");

	const page = normalizePage(params.page);
	const limit = normalizeLimit(params.limit);
	const skip = (page - 1) * limit;

	const filter: Record<string, unknown> = { userId };
	if (params.status) {
		filter.status = params.status;
	}

	const [data, total] = await Promise.all([
		Visit.find(filter)
			.sort({ scheduledAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean<VisitRecord[]>()
			.exec(),
		Visit.countDocuments(filter),
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

export async function findById(
	id: string,
	userId: string,
): Promise<VisitRecord> {
	validateObjectId(id, "견학 ID");
	validateObjectId(userId, "사용자 ID");

	const doc = await Visit.findById(id)
		.lean<VisitRecord | null>()
		.exec();
	if (!doc) {
		throw new NotFoundError("견학 신청을 찾을 수 없습니다");
	}
	if (String(doc.userId) !== userId) {
		throw new ForbiddenError("이 견학 신청에 접근할 권한이 없습니다");
	}
	return doc;
}

export async function confirm(
	id: string,
	userId: string,
): Promise<VisitRecord> {
	return updateStatus(id, userId, "confirmed");
}

export async function cancel(
	id: string,
	userId: string,
	cancelReason?: string,
): Promise<VisitRecord> {
	const doc = await findById(id, userId);

	if (!isValidTransition(doc.status, "cancelled")) {
		throw new ApiError(
			`'${doc.status}' 상태에서 취소할 수 없습니다`,
			400,
		);
	}

	const updated = await Visit.findByIdAndUpdate(
		id,
		{
			$set: {
				status: "cancelled",
				cancelReason: cancelReason || undefined,
			},
		},
		{ new: true },
	)
		.lean<VisitRecord | null>()
		.exec();

	if (!updated) {
		throw new NotFoundError("견학 신청을 찾을 수 없습니다");
	}

	void auditService.record({
		action: "visit.cancel" as const,
		userId,
		targetType: "visit" as const,
		targetId: id,
		metadata: { cancelReason },
	});

	return updated;
}

export async function complete(
	id: string,
	userId: string,
): Promise<VisitRecord> {
	return updateStatus(id, userId, "completed");
}

async function updateStatus(
	id: string,
	userId: string,
	newStatus: IVisit["status"],
): Promise<VisitRecord> {
	const doc = await findById(id, userId);

	if (!isValidTransition(doc.status, newStatus)) {
		throw new ApiError(
			`'${doc.status}' 상태에서 '${newStatus}'(으)로 변경할 수 없습니다`,
			400,
		);
	}

	const updateFields: Record<string, unknown> = { status: newStatus };
	if (newStatus === "confirmed") {
		updateFields.confirmedAt = new Date();
	}

	const updated = await Visit.findByIdAndUpdate(
		id,
		{ $set: updateFields },
		{ new: true },
	)
		.lean<VisitRecord | null>()
		.exec();

	if (!updated) {
		throw new NotFoundError("견학 신청을 찾을 수 없습니다");
	}

	const auditAction = newStatus === "confirmed" ? "visit.confirmed" as const
		: newStatus === "completed" ? "visit.completed" as const
		: "visit.cancel" as const;
	void auditService.record({
		action: auditAction,
		userId,
		targetType: "visit" as const,
		targetId: id,
		metadata: { from: doc.status, to: newStatus },
	});

	return updated;
}

export const visitService = {
	create,
	findByUser,
	findById,
	confirm,
	cancel,
	complete,
	isValidTransition,
};
