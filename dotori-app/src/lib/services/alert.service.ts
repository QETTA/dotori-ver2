/**
 * Alert service layer.
 */
import mongoose from "mongoose";
import Alert, { type IAlert } from "@/models/Alert";
import Facility from "@/models/Facility";
import { ApiError, NotFoundError } from "@/lib/api-handler";
import { normalizePage, normalizeLimit } from "@/lib/pagination";

export type AlertRecord = Omit<IAlert, keyof mongoose.Document> & {
	_id: mongoose.Types.ObjectId;
};

export interface AlertListParams {
	page?: string | number;
	limit?: string | number;
	onlyActive?: boolean;
	withFacility?: boolean;
}

export interface AlertListResult {
	data: AlertRecord[];
	total: number;
	page: number;
	limit: number;
}

export interface AlertListApiResult {
	data: AlertRecord[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export interface CreateAlertInput {
	userId: string;
	facilityId: string;
	type: IAlert["type"];
	condition?: Record<string, unknown>;
	channels?: IAlert["channels"];
}

export async function findByUser(
	userId: string,
	params: AlertListParams = {},
): Promise<AlertListResult> {
	if (!mongoose.Types.ObjectId.isValid(userId)) {
		throw new ApiError("유효하지 않은 사용자 ID입니다", 400);
	}

	const page = normalizePage(params.page);
	const limit = normalizeLimit(params.limit);
	const skip = (page - 1) * limit;

	const filter: Record<string, unknown> = { userId };
	if (params.onlyActive !== false) {
		filter.active = true;
	}

	const query = Alert.find(filter)
		.sort({ createdAt: -1 })
		.skip(skip)
		.limit(limit);

	const [rawData, total] = await Promise.all([
		(params.withFacility
			? (query.populate("facilityId").lean().exec() as Promise<AlertRecord[]>)
			: (query.lean().exec() as Promise<AlertRecord[]>)),
		Alert.countDocuments(filter),
	]);

	return {
		data: rawData,
		total: Number(total),
		page,
		limit,
	};
}

export async function listActive(userId: string): Promise<AlertListApiResult> {
	const result = await findByUser(userId, {
		withFacility: true,
		onlyActive: true,
	});

	return {
		data: result.data,
		pagination: {
			page: result.page,
			limit: result.limit,
			total: result.total,
			totalPages: result.total === 0 ? 0 : Math.ceil(result.total / result.limit),
		},
	};
}

export async function create(input: CreateAlertInput): Promise<AlertRecord> {
	if (!mongoose.Types.ObjectId.isValid(input.userId)) {
		throw new ApiError("유효하지 않은 사용자 ID입니다", 400);
	}
	if (!mongoose.Types.ObjectId.isValid(input.facilityId)) {
		throw new ApiError("유효하지 않은 시설 ID입니다", 400);
	}

	const existingAlert = await Alert.exists({
		userId: input.userId,
		facilityId: input.facilityId,
		type: input.type,
	});
	if (existingAlert) {
		throw new ApiError("이미 등록된 알림입니다", 409);
	}

	const facilityExists = await Facility.exists({ _id: input.facilityId });
	if (!facilityExists) {
		throw new NotFoundError("시설을 찾을 수 없습니다");
	}

	try {
		const alert = await Alert.create({
			userId: input.userId,
			facilityId: input.facilityId,
			type: input.type,
			condition: input.condition ?? {},
			channels: input.channels ?? ["push"],
		});
		return alert.toObject() as AlertRecord;
	} catch (error: unknown) {
		if (
			error instanceof Error &&
			Object.hasOwn(error, "code") &&
			(error as { code?: unknown }).code === 11000
		) {
			throw new ApiError("이미 등록된 알림입니다", 409);
		}
		throw error;
	}
}

export async function deleteById(userId: string, id: string): Promise<boolean> {
	if (!mongoose.Types.ObjectId.isValid(userId)) {
		throw new ApiError("유효하지 않은 사용자 ID입니다", 400);
	}
	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new ApiError("유효하지 않은 알림 ID입니다", 400);
	}

	const alert = await Alert.findOne({
		userId,
		_id: id,
	}).lean<{ _id: mongoose.Types.ObjectId }>().exec();
	if (!alert) {
		throw new NotFoundError("알림을 찾을 수 없습니다");
	}

	await Alert.deleteOne({ _id: alert._id }).exec();
	return true;
}

export async function updateChannels(
	userId: string,
	channels: IAlert["channels"],
): Promise<{ channels: IAlert["channels"] }> {
	if (!mongoose.Types.ObjectId.isValid(userId)) {
		throw new ApiError("유효하지 않은 사용자 ID입니다", 400);
	}

	await Alert.updateMany({ userId, active: true }, { $set: { channels } });
	return { channels };
}

export const alertService = {
	listActive,
	create,
	findById: async (id: string) => {
		const alert = await Alert.findById(id).lean().exec();
		if (!alert) {
			throw new NotFoundError("알림을 찾을 수 없습니다");
		}
		return alert;
	},
	findByUser,
	deleteById,
	updateChannels,
};
