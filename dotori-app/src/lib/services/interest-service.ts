/**
 * Interest (관심시설) service — shared logic for API routes and action-executor.
 */
import Facility from "@/models/Facility";
import User from "@/models/User";
import { NotFoundError } from "@/lib/api-handler";

interface AddInterestResult {
	success: boolean;
	interestsCount?: number;
}

export async function addInterest(
	userId: string,
	facilityId: string,
): Promise<AddInterestResult> {
	const exists = await Facility.exists({ _id: facilityId });
	if (!exists) {
		throw new NotFoundError("존재하지 않는 시설입니다");
	}

	const user = await User.findByIdAndUpdate(
		userId,
		{ $addToSet: { interests: facilityId } },
		{ new: true },
	).lean();

	if (!user) {
		throw new NotFoundError("사용자를 찾을 수 없습니다");
	}

	return {
		success: true,
		interestsCount: user.interests?.length ?? 0,
	};
}

export async function removeInterest(
	userId: string,
	facilityId: string,
): Promise<{ success: boolean }> {
	const user = await User.findByIdAndUpdate(
		userId,
		{ $pull: { interests: facilityId } },
		{ new: true },
	).lean();

	if (!user) {
		throw new NotFoundError("사용자를 찾을 수 없습니다");
	}

	return { success: true };
}
