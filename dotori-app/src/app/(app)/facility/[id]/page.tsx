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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { id: facilityId } = await params;

	if (!mongoose.Types.ObjectId.isValid(facilityId)) {
		return {
			title: facilityNotFoundTitle,
			description: facilityNotFoundDescription,
		};
	}

	try {
		await dbConnect();
		const facility = await Facility.findById(facilityId).select("name").lean();

		if (!facility || typeof (facility as { name?: string }).name !== "string") {
			return {
				title: facilityNotFoundTitle,
				description: facilityNotFoundDescription,
			};
		}

		const facilityName = facility.name;
		return {
			title: `${facilityName} | 도토리`,
			description: `${facilityName}의 상세 정보를 확인하세요.`,
		};
	} catch {
		return {
			title: facilityNotFoundTitle,
			description: facilityNotFoundDescription,
		};
	}
}

export default async function FacilityDetailPage({ params }: PageProps) {
	const resolvedParams = await params;
	const facilityId = resolvedParams.id;

	if (!mongoose.Types.ObjectId.isValid(facilityId)) {
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

	try {
		const facility = toSafeFacilityDTO(toFacilityDTO(facilityDoc));
		return <FacilityDetailClient facility={facility} />;
	} catch {
		return (
			<FacilityDetailClient loadError={facilityLoadErrorMessage} />
		);
	}

}
