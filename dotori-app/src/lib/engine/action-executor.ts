import mongoose from "mongoose";
import type { IActionIntent } from "@/models/ActionIntent";
import User from "@/models/User";
import Alert from "@/models/Alert";
import Facility from "@/models/Facility";
import { toFacilityDTO, toChildProfile } from "@/lib/dto";
import { addInterest } from "@/lib/services/interest-service";
import { applyWaitlist } from "@/lib/services/waitlist-service";
import { generateReport, generateChecklist } from "./report-engine";

export async function executeAction(
	intent: IActionIntent,
): Promise<{ success: boolean; data?: unknown; error?: string }> {
	const { actionType, userId, params } = intent;

	// generate_report는 쉼표 구분 다중 ID를 받으므로, ObjectId 파싱은 분기 내부에서 처리
	let facilityOid: mongoose.Types.ObjectId | null = null;
	if (actionType !== "generate_report") {
		try {
			facilityOid = new mongoose.Types.ObjectId(params.facilityId);
		} catch {
			return { success: false, error: "유효하지 않은 시설 ID입니다" };
		}
	}

	try {
		switch (actionType) {
			case "register_interest": {
				const result = await addInterest(
					String(userId),
					String(facilityOid),
				);
				if (!result.success) {
					return { success: false, error: result.error };
				}
				return {
					success: true,
					data: { interestsCount: result.interestsCount },
				};
			}

			case "apply_waiting": {
				const result = await applyWaitlist({
					userId: String(userId),
					facilityId: String(facilityOid),
					childName: params.childName || "미지정",
					childBirthDate: params.childBirthDate || "",
				});
				if (!result.success) {
					return { success: false, error: result.error };
				}
				return {
					success: true,
					data: { waitlistId: String(result.waitlist?._id) },
				};
			}

			case "set_alert": {
				const alert = await Alert.create({
					userId,
					facilityId: facilityOid,
					type: "vacancy",
					channels: ["push"],
				});

				return { success: true, data: { alertId: String(alert._id) } };
			}

			case "generate_report": {
				// facilityId can contain comma-separated IDs for comparison
				const facilityIds = params.facilityId
					.split(",")
					.map((id) => id.trim());
				const facilityDocs = await Facility.find({
					_id: { $in: facilityIds.map((id) => new mongoose.Types.ObjectId(id)) },
				}).lean();

				if (facilityDocs.length < 2) {
					return {
						success: false,
						error: "비교할 시설이 2개 이상 필요합니다",
					};
				}

				const dtos = facilityDocs.map((f) => toFacilityDTO(f));
				const user = await User.findById(userId).lean();
				const child = toChildProfile(user?.children?.[0] as Record<string, unknown> | undefined);
				const report = generateReport(dtos, child);

				return { success: true, data: { report } };
			}

			case "generate_checklist": {
				const facilityDoc = await Facility.findById(facilityOid).lean();
				const dto = facilityDoc ? toFacilityDTO(facilityDoc) : null;
				const user = await User.findById(userId).lean();
				const child = toChildProfile(user?.children?.[0] as Record<string, unknown> | undefined);
				const checklist = generateChecklist(dto, child);

				return { success: true, data: { checklist } };
			}

			default:
				return { success: false, error: "알 수 없는 액션 타입입니다" };
		}
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "액션 실행에 실패했습니다";
		return { success: false, error: message };
	}
}
