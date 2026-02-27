import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { withApiHandler, BadRequestError, NotFoundError } from "@/lib/api-handler";
import { relaxedLimiter } from "@/lib/rate-limit";
import { generateChecklist } from "@/lib/engine/checklist-engine";
import Facility from "@/models/Facility";
import User from "@/models/User";

/**
 * GET /api/waitlist/checklist?facilityId=xxx
 *
 * 시설 유형 + 사용자 프로필 기반 서류 체크리스트 생성
 * 인증 없이도 기본 체크리스트 제공, 인증 시 개인화
 */
export const GET = withApiHandler(async (req) => {
	const facilityId = req.nextUrl.searchParams.get("facilityId");

	if (!facilityId || !mongoose.Types.ObjectId.isValid(facilityId)) {
		throw new BadRequestError("유효한 facilityId가 필요합니다");
	}

	const facility = await Facility.findById(facilityId).lean();
	if (!facility) {
		throw new NotFoundError("시설을 찾을 수 없습니다");
	}

	// Personalization: fetch user profile if authenticated
	const session = await auth();
	let childBirthDate: string | undefined;
	let hasMultipleChildren = false;

	if (session?.user?.id) {
		const user = await User.findById(session.user.id).lean();
		if (user?.children?.length) {
			childBirthDate = user.children[0].birthDate;
			hasMultipleChildren = user.children.length >= 3;
		}
	}

	const checklist = generateChecklist({
		facilityType: facility.type as Parameters<typeof generateChecklist>[0]["facilityType"],
		childBirthDate,
		hasMultipleChildren,
	});

	return NextResponse.json({
		data: {
			facilityId: String(facility._id),
			facilityName: facility.name,
			facilityType: facility.type,
			checklist,
		},
	});
}, { auth: false, rateLimiter: relaxedLimiter });
