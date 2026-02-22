import mongoose from "mongoose";
import type { Metadata } from "next";
import dbConnect from "@/lib/db";
import { toFacilityDTO } from "@/lib/dto";
import FacilityDetailClient from "./FacilityDetailClient";
import Facility from "@/models/Facility";

type PageProps = { params: { id: string } | Promise<{ id: string }> };

const facilityNotFoundTitle = "시설을 찾을 수 없습니다 | 도토리";
const facilityNotFoundDescription = "요청하신 어린이집 정보를 찾을 수 없습니다.";
const facilityNotFoundErrorMessage = "요청하신 어린이집 정보를 찾을 수 없어요.";
const facilityLoadErrorMessage = "시설 정보를 불러오지 못했어요";

function normalizeFacilityId(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

async function resolveFacilityId(params: PageProps["params"]): Promise<string | null> {
	try {
		const resolvedParams = await params;
		return normalizeFacilityId((resolvedParams as { id?: unknown })?.id);
	} catch {
		return null;
	}
}

function toSafeCount(value: unknown): number {
	return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

function toSafeFacilityDTO(
	facility: ReturnType<typeof toFacilityDTO>,
): ReturnType<typeof toFacilityDTO> {
	const rawCapacity = (facility as { capacity?: unknown }).capacity;
	const capacity =
		rawCapacity && typeof rawCapacity === "object"
			? (rawCapacity as { total?: unknown; current?: unknown; waiting?: unknown })
			: null;

	const rawFeatures = (facility as { features?: unknown }).features;
	const features = Array.isArray(rawFeatures)
		? rawFeatures.filter((feature): feature is string => typeof feature === "string")
		: [];

	return {
		...facility,
		capacity: {
			total: toSafeCount(capacity?.total),
			current: toSafeCount(capacity?.current),
			waiting: toSafeCount(capacity?.waiting),
		},
		features,
	};
}

function isRenderableFacility(
	facility: ReturnType<typeof toSafeFacilityDTO> | null,
): facility is ReturnType<typeof toSafeFacilityDTO> {
	if (!facility) {
		return false;
	}

	if (typeof facility.id !== "string" || facility.id.trim().length === 0) {
		return false;
	}

	if (typeof facility.name !== "string" || facility.name.trim().length === 0) {
		return false;
	}

	if (!Array.isArray(facility.features)) {
		return false;
	}

	if (typeof facility.lat !== "number" || !Number.isFinite(facility.lat)) {
		return false;
	}

	if (typeof facility.lng !== "number" || !Number.isFinite(facility.lng)) {
		return false;
	}

	return true;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const facilityId = await resolveFacilityId(params);

	if (!facilityId || !mongoose.Types.ObjectId.isValid(facilityId)) {
		return {
			title: facilityNotFoundTitle,
			description: facilityNotFoundDescription,
		};
	}

	try {
		await dbConnect();
		const facility = await Facility.findById(facilityId).select("name").lean();

		const facilityName = (facility as { name?: unknown } | null)?.name;
		if (typeof facilityName !== "string" || facilityName.trim().length === 0) {
			return {
				title: facilityNotFoundTitle,
				description: facilityNotFoundDescription,
			};
		}

		return {
			title: `${facilityName.trim()} | 도토리`,
			description: `${facilityName.trim()}의 상세 정보를 확인하세요.`,
		};
	} catch {
		return {
			title: facilityNotFoundTitle,
			description: facilityNotFoundDescription,
		};
	}
}

export default async function FacilityDetailPage({ params }: PageProps) {
	const facilityId = await resolveFacilityId(params);

	if (!facilityId || !mongoose.Types.ObjectId.isValid(facilityId)) {
		return <FacilityDetailClient loadError={facilityNotFoundErrorMessage} />;
	}

	let facilityDoc: Parameters<typeof toFacilityDTO>[0] | null = null;
	try {
		await dbConnect();
		facilityDoc = (await Facility.findById(facilityId).lean()) as Parameters<
			typeof toFacilityDTO
		>[0] | null;
	} catch {
		return (
			<FacilityDetailClient loadError={facilityLoadErrorMessage} />
		);
	}

	if (!facilityDoc) {
		return <FacilityDetailClient loadError={facilityNotFoundErrorMessage} />;
	}

	let facility: ReturnType<typeof toSafeFacilityDTO> | null = null;
	try {
		facility = toSafeFacilityDTO(toFacilityDTO(facilityDoc));
	} catch {
		facility = null;
	}

	if (!isRenderableFacility(facility)) {
		return <FacilityDetailClient loadError={facilityLoadErrorMessage} />;
	}

	return <FacilityDetailClient facility={facility} />;
}
