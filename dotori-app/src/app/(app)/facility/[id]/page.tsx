import mongoose from "mongoose";
import { notFound } from "next/navigation";
import { ErrorState } from "@/components/dotori/ErrorState";
import dbConnect from "@/lib/db";
import { toFacilityDTO } from "@/lib/dto";
import FacilityDetailClient from "./FacilityDetailClient";
import Facility from "@/models/Facility";

type PageProps = { params: { id: string } | Promise<{ id: string }> };

export default async function FacilityDetailPage({ params }: PageProps) {
	const resolvedParams = await params;
	const facilityId = resolvedParams.id;

	if (!mongoose.Types.ObjectId.isValid(facilityId)) {
		notFound();
	}

	try {
		await dbConnect();
		const facilityDoc = await Facility.findById(facilityId).lean();

		if (!facilityDoc) {
			notFound();
		}

		const facility = toFacilityDTO(
			facilityDoc as Parameters<typeof toFacilityDTO>[0],
		);

		return <FacilityDetailClient facility={facility} />;
	} catch {
		return (
			<div className="pb-4">
				<ErrorState message="시설 정보를 불러오지 못했어요" />
			</div>
		);
	}
}
