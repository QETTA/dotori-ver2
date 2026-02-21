/**
 * Waitlist (대기신청) service — shared logic for API routes and action-executor.
 */
import Facility from "@/models/Facility";
import Waitlist, { type IWaitlist } from "@/models/Waitlist";
import {
	calculateAgeClass,
	generateChecklist as generateDocChecklist,
} from "@/lib/engine/checklist-engine";

type FacilityType = "국공립" | "민간" | "가정" | "직장" | "협동" | "사회복지";
const VALID_TYPES: FacilityType[] = ["국공립", "민간", "가정", "직장", "협동", "사회복지"];

interface ApplyWaitlistParams {
	userId: string;
	facilityId: string;
	childName: string;
	childBirthDate: string;
	hasMultipleChildren?: boolean;
	isDualIncome?: boolean;
	isSingleParent?: boolean;
	hasDisability?: boolean;
}

interface ApplyWaitlistResult {
	success: boolean;
	waitlist?: (IWaitlist & { _id: unknown }) | null;
	error?: string;
	status?: number;
}

export async function applyWaitlist(
	params: ApplyWaitlistParams,
): Promise<ApplyWaitlistResult> {
	const {
		userId,
		facilityId,
		childName,
		childBirthDate,
		hasMultipleChildren = false,
		isDualIncome = false,
		isSingleParent = false,
		hasDisability = false,
	} = params;

	// Fetch facility for checklist generation
	const facility = await Facility.findById(facilityId).lean();
	if (!facility) {
		return { success: false, error: "시설을 찾을 수 없습니다", status: 404 };
	}

	// Check for existing non-cancelled entry
	const existing = await Waitlist.findOne({
		userId,
		facilityId,
		status: { $ne: "cancelled" },
	});
	if (existing) {
		return { success: false, error: "이미 대기 신청한 시설입니다", status: 409 };
	}

	// Auto-generate checklist
	const rawType = facility.type as string | undefined;
	const facilityType = VALID_TYPES.includes(rawType as FacilityType)
		? (rawType as FacilityType)
		: undefined;

	const ageClass = childBirthDate ? calculateAgeClass(childBirthDate) : undefined;

	let requiredDocs: { docId: string; name: string; submitted: boolean }[] = [];
	if (facilityType && childBirthDate) {
		const checklist = generateDocChecklist({
			facilityType,
			childBirthDate,
			hasMultipleChildren,
			isDualIncome,
			isSingleParent,
			hasDisability,
		});
		requiredDocs = checklist.categories.flatMap((cat) =>
			cat.items
				.filter((item) => !item.id.startsWith("info-"))
				.map((item) => ({
					docId: item.id,
					name: item.text,
					submitted: false,
				})),
		);
	}

	// Calculate waiting position
	const currentCount = await Waitlist.countDocuments({
		facilityId,
		status: { $ne: "cancelled" },
	});
	const position = currentCount + 1;

	// Reactivate cancelled entry if exists
	const cancelled = await Waitlist.findOne({
		userId,
		facilityId,
		status: "cancelled",
	});

	let waitlist;
	if (cancelled) {
		waitlist = await Waitlist.findByIdAndUpdate(
			cancelled._id,
			{
				$set: {
					status: "pending",
					childName,
					childBirthDate,
					ageClass,
					requiredDocs,
					position,
					appliedAt: new Date(),
				},
			},
			{ new: true },
		);
	} else {
		waitlist = await Waitlist.create({
			userId,
			facilityId,
			childName,
			childBirthDate,
			ageClass,
			requiredDocs,
			position,
		});
	}

	return { success: true, waitlist };
}
