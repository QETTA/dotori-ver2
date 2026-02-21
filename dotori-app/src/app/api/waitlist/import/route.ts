/**
 * POST /api/waitlist/import
 * OCR에서 추출한 대기 정보를 일괄 저장
 * 시설명으로 DB 검색 → 매칭된 시설에 대해 waitlist 생성
 * Optimized: batch facility lookups + duplicate checks
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-handler";
import { standardLimiter } from "@/lib/rate-limit";
import { calculateAgeClass } from "@/lib/engine/checklist-engine";
import Facility from "@/models/Facility";
import User from "@/models/User";
import Waitlist from "@/models/Waitlist";

const importItemSchema = z.object({
	facilityName: z.string().min(1),
	waitlistNumber: z.number().nullable(),
	applicationDate: z.string().nullable(),
	status: z.string(),
	childClass: z.string().nullable(),
	childName: z.string().nullable(),
	facilityType: z.string().nullable(),
});

const waitlistImportSchema = z.object({
	items: z.array(importItemSchema).min(1).max(50),
});

type ImportItem = z.infer<typeof importItemSchema>;

const STATUS_MAP: Record<string, string> = {
	대기중: "pending",
	입소확정: "confirmed",
	취소: "cancelled",
};

export const POST = withApiHandler(async (_req, { userId, body }) => {
	const { items } = body;

	// Get user's first child info for ageClass calculation
	const user = await User.findById(userId).lean();
	const firstChild = user?.children?.[0];
	const childName = firstChild?.name ?? "미지정";
	const childBirthDate = firstChild?.birthDate
		? new Date(firstChild.birthDate).toISOString().slice(0, 10)
		: undefined;

	// Validate + collect unique facility names
	const validatedItems: Array<{ item: ImportItem; index: number }> = [];
	const results: Array<{ facilityName: string; success: boolean; reason?: string }> = [];

	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		if (!item.facilityName || typeof item.facilityName !== "string") {
			results.push({
				facilityName: item.facilityName ?? "(알 수 없음)",
				success: false,
				reason: "시설명이 올바르지 않습니다",
			});
		} else {
			validatedItems.push({ item, index: i });
		}
	}

	if (validatedItems.length === 0) {
		return NextResponse.json({
			data: {
				successCount: 0,
				skipCount: results.length,
				totalCount: items.length,
				results,
			},
		});
	}

	// Batch facility lookup: build $or query for all names
	const nameRegexes = validatedItems.map(({ item }) => ({
		name: {
			$regex: item.facilityName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
			$options: "i",
		},
	}));
	const matchedFacilities = await Facility.find({
		$or: nameRegexes,
	}).lean();

	// Build name→facility map (lowercase for matching)
	const facilityByName = new Map<string, (typeof matchedFacilities)[0]>();
	for (const f of matchedFacilities) {
		facilityByName.set(f.name.toLowerCase(), f);
	}

	const facilityIds = matchedFacilities.map((f) => f._id);
	const existingFacilityIds = new Set<string>();

	// Process each validated item
	let successCount = 0;
	let skipCount = results.length; // already includes invalid items

		for (const { item } of validatedItems) {
		// Find matching facility
		const facility = facilityByName.get(item.facilityName.toLowerCase());
		if (!facility) {
			skipCount++;
			results.push({
				facilityName: item.facilityName,
				success: false,
				reason: "시설을 찾을 수 없습니다",
			});
			continue;
		}

		// Check duplicate within the same request
		if (existingFacilityIds.has(String(facility._id))) {
			skipCount++;
			results.push({
				facilityName: item.facilityName,
				success: false,
				reason: "이미 대기 신청한 시설입니다",
			});
			continue;
		}

		const status = STATUS_MAP[item.status] ?? "pending";
		const ageClass = childBirthDate
			? calculateAgeClass(childBirthDate)
			: item.childClass ?? "만0세반";

		try {
			const existingWaitlist = await Waitlist.findOne({
				userId,
				facilityId: facility._id,
				status: { $ne: "cancelled" },
			})
				.select("position")
				.lean();

			if (existingWaitlist) {
				const nextPosition = item.waitlistNumber ?? 0;
				const update: Record<string, unknown> = {
					childName: item.childName || childName,
					childBirthDate: childBirthDate ?? "2024-01-01",
					ageClass,
					status,
					appliedAt: item.applicationDate
						? new Date(item.applicationDate)
						: new Date(),
				};
				if (typeof nextPosition === "number") {
					update.position = nextPosition;
					if (typeof existingWaitlist.position === "number") {
						update.previousPosition = existingWaitlist.position;
					}
				}

				await Waitlist.findByIdAndUpdate(existingWaitlist._id, {
					$set: update,
				});
			} else {
				await Waitlist.create({
					userId,
					facilityId: facility._id,
					childName: item.childName || childName,
					childBirthDate: childBirthDate ?? "2024-01-01",
					ageClass,
					position: item.waitlistNumber ?? 0,
					status,
					appliedAt: item.applicationDate
						? new Date(item.applicationDate)
						: new Date(),
					requiredDocs: [],
				});
			}

			// Track to prevent duplicates within same batch
			existingFacilityIds.add(String(facility._id));
			successCount++;
			results.push({ facilityName: item.facilityName, success: true });
		} catch {
			results.push({
				facilityName: item.facilityName,
				success: false,
				reason: "저장 중 오류가 발생했습니다",
			});
		}
	}

	return NextResponse.json({
		data: {
			successCount,
			skipCount,
			totalCount: items.length,
			results,
		},
	});
}, { auth: true, schema: waitlistImportSchema, rateLimiter: standardLimiter });
