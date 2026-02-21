import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { relaxedLimiter } from "@/lib/rate-limit";
import { toFacilityDTO, toPostDTO } from "@/lib/dto";
import Alert from "@/models/Alert";
import Facility from "@/models/Facility";
import Post from "@/models/Post";
import User from "@/models/User";
import Waitlist from "@/models/Waitlist";

export const GET = withApiHandler(async (_req, { userId }) => {
	const INTEREST_FACILITY_LIMIT = 3;
	const NEARBY_FACILITY_LIMIT = 5;

	let user = null;
	let interestFacilities: ReturnType<typeof toFacilityDTO>[] = [];
	let alertCount = 0;
	let waitlistCount = 0;
	let bestWaitlistPosition: number | undefined;
	let waitlistFacilityName: string | undefined;

	// Start non-user-dependent queries immediately
	const sharedPromise = Promise.all([
		Post.find()
			.select("content category likes commentCount createdAt authorId")
			.sort({ likes: -1 })
			.limit(3)
			.lean(),
		Facility.findOne()
			.sort({ lastSyncedAt: -1 })
			.select("lastSyncedAt")
			.lean(),
	]);

	// Build region filter for nearby facilities (populated after user fetch)
	let regionFilter: Record<string, unknown> = {};

	if (userId) {
		const userDoc = await User.findById(userId).lean();
		if (userDoc) {
			user = {
				id: String(userDoc._id),
				nickname: userDoc.nickname || userDoc.name || "사용자",
				region: userDoc.region || { sido: "", sigungu: "", dong: "" },
				onboardingCompleted: userDoc.onboardingCompleted || false,
				interests: (userDoc.interests || []).map(String),
				children: userDoc.children || [],
				plan: userDoc.plan || "free",
				gpsVerified: userDoc.gpsVerified || false,
			};

			// Set region filter for nearby facilities
			if (user.region.sigungu) {
				regionFilter = {
					"region.sido": user.region.sido || "서울특별시",
					"region.sigungu": user.region.sigungu,
				};
			} else if (user.region.sido) {
				regionFilter = { "region.sido": user.region.sido };
			}

			// Run all user-dependent queries in parallel
		const [interestDocs, counts, activeWaitlists] = await Promise.all([
				// Fetch interest facilities
				user.interests.length > 0
					? Facility.find({ _id: { $in: user.interests.slice(0, INTEREST_FACILITY_LIMIT) } })
							.limit(INTEREST_FACILITY_LIMIT)
							.lean()
						: Promise.resolve([]),
					// Fetch alert + waitlist counts
					Promise.all([
						Alert.countDocuments({ userId, active: true }),
						Waitlist.countDocuments({ userId, status: { $ne: "cancelled" } }),
				]),
				// Fetch best waitlist position for NBA personalization
				Waitlist.find({ userId, status: "pending" })
					.populate("facilityId", "name")
					.sort({ position: 1 })
					.limit(1)
					.lean(),
			]);

			interestFacilities = interestDocs.map((f) => toFacilityDTO(f));
			[alertCount, waitlistCount] = counts;

			if (activeWaitlists.length > 0) {
				const best = activeWaitlists[0];
				bestWaitlistPosition = best.position;
				const fac = best.facilityId as unknown as { name?: string };
				waitlistFacilityName = fac?.name;
			}
		}
	}

	// Fetch nearby facilities with region filter (falls back to global recent if no region)
	const [nearbyDocs, [hotPostDocs, lastFacility]] = await Promise.all([
		Facility.find(regionFilter)
			.select("name type status address location capacity features rating lastSyncedAt")
			.sort({ updatedAt: -1 })
			.limit(NEARBY_FACILITY_LIMIT)
			.lean(),
		sharedPromise,
	]);

	const nearbyFacilities = nearbyDocs.map((f) => toFacilityDTO(f));
	const hotPosts = hotPostDocs.map((p) => toPostDTO(p));
	const sources = {
		isalang: {
			name: "아이사랑",
			updatedAt: lastFacility?.lastSyncedAt?.toISOString() || new Date().toISOString(),
		},
	};

	return NextResponse.json(
		{
			data: {
				user,
				nearbyFacilities,
				interestFacilities,
				hotPosts,
				alertCount,
				waitlistCount,
				bestWaitlistPosition,
				waitlistFacilityName,
				sources,
			},
		},
		{
			headers: {
				"Cache-Control": "private, max-age=10, stale-while-revalidate=30",
			},
		},
	);
}, { auth: false, rateLimiter: relaxedLimiter });
