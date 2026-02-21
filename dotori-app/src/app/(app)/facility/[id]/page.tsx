import mongoose from "mongoose";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dbConnect from "@/lib/db";
import { toFacilityDTO } from "@/lib/dto";
import FacilityDetailClient from "./FacilityDetailClient";
import Facility from "@/models/Facility";

type PageProps = { params: { id: string } | Promise<{ id: string }> };

const facilityNotFoundTitle = "시설을 찾을 수 없습니다 | 도토리";
const facilityNotFoundDescription = "요청하신 어린이집 정보를 찾을 수 없습니다.";

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
		notFound();
	}

	let facility: ReturnType<typeof toFacilityDTO> | null = null;
	try {
		await dbConnect();
		const facilityDoc = await Facility.findById(facilityId).lean();

		if (!facilityDoc) {
			notFound();
		}

		facility = toFacilityDTO(
			facilityDoc as Parameters<typeof toFacilityDTO>[0],
		);
	} catch {
		return (
			<FacilityDetailClient loadError="시설 정보를 불러오지 못했어요" />
		);
	}

	return <FacilityDetailClient facility={facility} />;
}
