import Facility from "@/models/Facility";
import Waitlist from "@/models/Waitlist";
import { toFacilityDTO } from "@/lib/dto";

export async function generatePreview(
	actionType: string,
	params: { facilityId: string; childName?: string; childBirthDate?: string },
) {
	const facility = await Facility.findById(params.facilityId).lean();
	if (!facility) throw new Error("시설을 찾을 수 없습니다");

	const dto = toFacilityDTO(facility);

	const base: Record<string, string> = {
		시설명: dto.name,
		시설유형: dto.type,
		현재상태:
			dto.status === "available"
				? "빈자리 있음"
				: dto.status === "waiting"
					? `대기 ${dto.capacity.waiting}명`
					: "마감",
	};

	if (actionType === "register_interest") {
		return {
			...base,
			신청유형: "관심 등록",
		};
	}

	if (actionType === "apply_waiting") {
		const waitingCount = await Waitlist.countDocuments({
			facilityId: params.facilityId,
			status: { $ne: "cancelled" },
		});
		return {
			...base,
			신청유형:
				dto.status === "available" ? "입소 신청" : "대기 신청",
			아이: params.childName
				? `${params.childName} (${params.childBirthDate})`
				: "미지정",
			현재대기: `${waitingCount}명`,
		};
	}

	if (actionType === "set_alert") {
		return {
			...base,
			신청유형: "빈자리 알림 설정",
			알림채널: "푸시 알림",
		};
	}

	if (actionType === "generate_report") {
		return {
			...base,
			신청유형: "시설 비교 리포트 생성",
		};
	}

	if (actionType === "generate_checklist") {
		return {
			...base,
			신청유형: "입소 준비 체크리스트 생성",
		};
	}

	return base;
}
