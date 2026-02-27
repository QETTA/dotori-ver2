/**
 * E-Signature 서비스 레이어
 */
import mongoose from "mongoose";
import ESignatureDocument, {
	type IESignatureDocument,
} from "@/models/ESignatureDocument";
import Facility from "@/models/Facility";
import { ApiError, NotFoundError, ForbiddenError } from "@/lib/api-handler";
import { API_CONFIG } from "@/lib/config/api";
import { auditService } from "@/lib/services/audit.service";
import { getRequiredTemplates } from "@/lib/esignature-templates";
import { normalizePage, normalizeLimit } from "@/lib/pagination";

export type ESignatureRecord = {
	_id: mongoose.Types.ObjectId;
	userId: mongoose.Types.ObjectId;
	facilityId: mongoose.Types.ObjectId;
	documentType: IESignatureDocument["documentType"];
	status: IESignatureDocument["status"];
	title: string;
	fileUrl?: string;
	signedAt?: Date;
	expiresAt?: Date;
	metadata?: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
};

export interface ESignatureListParams {
	page?: string | number;
	limit?: string | number;
	status?: IESignatureDocument["status"];
}

export interface ESignatureListResult {
	data: ESignatureRecord[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export interface CreateESignatureInput {
	userId: string;
	facilityId: string;
	documentType: IESignatureDocument["documentType"];
	title: string;
}

// --- private helpers ---

function validateObjectId(id: string, label: string): void {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new ApiError(`유효하지 않은 ${label}입니다`, 400);
	}
}

// --- 상태전이 규칙 ---

const VALID_TRANSITIONS: Record<
	IESignatureDocument["status"],
	IESignatureDocument["status"][]
> = {
	draft: ["pending", "expired"],
	pending: ["signed", "expired"],
	signed: ["submitted", "expired"],
	submitted: ["expired"],
	expired: [],
};

export function isValidTransition(
	from: IESignatureDocument["status"],
	to: IESignatureDocument["status"],
): boolean {
	return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * 시설 유형에 따른 필수 서류+동의서 목록
 * 템플릿 정의에서 동적 조회 (esignature-templates.ts)
 */
export function getRequiredDocuments(
	facilityType: "daycare" | "kindergarten",
): IESignatureDocument["documentType"][] {
	return getRequiredTemplates(facilityType).map(
		(t) => t.documentType as IESignatureDocument["documentType"],
	);
}

// --- 서비스 함수 ---

export async function create(
	input: CreateESignatureInput,
): Promise<ESignatureRecord> {
	validateObjectId(input.userId, "사용자 ID");
	validateObjectId(input.facilityId, "시설 ID");

	const facilityExists = await Facility.exists({ _id: input.facilityId });
	if (!facilityExists) {
		throw new NotFoundError("시설을 찾을 수 없습니다");
	}

	const expiresAt = new Date();
	expiresAt.setDate(
		expiresAt.getDate() + API_CONFIG.ESIGNATURE.expirationDays,
	);

	const doc = await ESignatureDocument.create({
		userId: input.userId,
		facilityId: input.facilityId,
		documentType: input.documentType,
		title: input.title,
		status: "draft",
		expiresAt,
	});

	// 감사 추적 (fire-and-forget)
	void auditService.record({
		action: "esign.create",
		userId: input.userId,
		targetType: "esignature",
		targetId: String(doc._id),
		metadata: { documentType: input.documentType, title: input.title },
	});

	return doc.toObject() as unknown as ESignatureRecord;
}

export async function findByUser(
	userId: string,
	params: ESignatureListParams = {},
): Promise<ESignatureListResult> {
	validateObjectId(userId, "사용자 ID");

	const page = normalizePage(params.page);
	const limit = normalizeLimit(params.limit);
	const skip = (page - 1) * limit;

	const filter: Record<string, unknown> = { userId };
	if (params.status) {
		filter.status = params.status;
	}

	const [data, total] = await Promise.all([
		ESignatureDocument.find(filter)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean<ESignatureRecord[]>()
			.exec(),
		ESignatureDocument.countDocuments(filter),
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
): Promise<ESignatureRecord> {
	validateObjectId(id, "서류 ID");
	validateObjectId(userId, "사용자 ID");

	const doc = await ESignatureDocument.findById(id)
		.lean<ESignatureRecord | null>()
		.exec();
	if (!doc) {
		throw new NotFoundError("서류를 찾을 수 없습니다");
	}
	if (String(doc.userId) !== userId) {
		throw new ForbiddenError("이 서류에 접근할 권한이 없습니다");
	}
	return doc;
}

export async function updateStatus(
	id: string,
	userId: string,
	newStatus: IESignatureDocument["status"],
): Promise<ESignatureRecord> {
	const doc = await findById(id, userId);
	const currentStatus = doc.status;

	if (!isValidTransition(currentStatus, newStatus)) {
		throw new ApiError(
			`'${currentStatus}' 상태에서 '${newStatus}'(으)로 변경할 수 없습니다`,
			400,
		);
	}

	const updateFields: Record<string, unknown> = { status: newStatus };
	if (newStatus === "signed") {
		updateFields.signedAt = new Date();
	}

	const updated = await ESignatureDocument.findByIdAndUpdate(
		id,
		{ $set: updateFields },
		{ new: true },
	)
		.lean<ESignatureRecord | null>()
		.exec();

	if (!updated) {
		throw new NotFoundError("서류를 찾을 수 없습니다");
	}

	// 감사 추적
	const auditAction = newStatus === "signed" ? "esign.sign" as const
		: newStatus === "submitted" ? "esign.submit" as const
		: "esign.status_change" as const;
	void auditService.record({
		action: auditAction,
		userId,
		targetType: "esignature",
		targetId: id,
		metadata: { from: currentStatus, to: newStatus },
	});

	return updated;
}

export async function deleteById(
	id: string,
	userId: string,
): Promise<boolean> {
	const doc = await findById(id, userId);
	if (doc.status !== "draft") {
		throw new ApiError("초안 상태의 서류만 삭제할 수 있습니다", 400);
	}
	await ESignatureDocument.deleteOne({ _id: doc._id });

	void auditService.record({
		action: "esign.delete",
		userId,
		targetType: "esignature",
		targetId: id,
		metadata: { documentType: doc.documentType },
	});

	return true;
}

export async function listByFacility(
	facilityId: string,
	userId: string,
	params: ESignatureListParams = {},
): Promise<ESignatureListResult> {
	validateObjectId(facilityId, "시설 ID");
	validateObjectId(userId, "사용자 ID");

	const page = normalizePage(params.page);
	const limit = normalizeLimit(params.limit);
	const skip = (page - 1) * limit;

	const filter: Record<string, unknown> = { facilityId, userId };
	if (params.status) {
		filter.status = params.status;
	}

	const [data, total] = await Promise.all([
		ESignatureDocument.find(filter)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean<ESignatureRecord[]>()
			.exec(),
		ESignatureDocument.countDocuments(filter),
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

export async function cleanupExpired(): Promise<number> {
	const result = await ESignatureDocument.updateMany(
		{
			status: { $in: ["draft", "pending"] },
			expiresAt: { $lt: new Date() },
		},
		{ $set: { status: "expired" } },
	);
	return result.modifiedCount;
}

export const esignatureService = {
	create,
	findByUser,
	findById,
	updateStatus,
	deleteById,
	listByFacility,
	cleanupExpired,
	isValidTransition,
	getRequiredDocuments,
};
