import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { log } from "@/lib/logger";
import { relaxedLimiter } from "@/lib/rate-limit";
import { toFacilityDTO, toPostDTO } from "@/lib/dto";
import Alert from "@/models/Alert";
import ESignatureDocument from "@/models/ESignatureDocument";
import Facility from "@/models/Facility";
import Post from "@/models/Post";
import User from "@/models/User";
import Waitlist from "@/models/Waitlist";

type FacilityLean = Parameters<typeof toFacilityDTO>[0];
type PostLean = Parameters<typeof toPostDTO>[0];
type WaitlistLean = {
	position?: number;
	facilityId?: { name?: string } | null;
};
type UserLean = {
	_id?: { toString: () => string } | string;
	nickname?: string | null;
	name?: string | null;
	region?: {
		sido?: string;
		sigungu?: string;
		dong?: string;
	} | null;
	interests?: unknown;
	children?: unknown;
	plan?: string;
	gpsVerified?: boolean;
	onboardingCompleted?: boolean;
};

const DEFAULT_METRO_REGION_FILTER = {
	"region.sido": { $in: ["서울특별시", "경기도", "인천광역시"] },
};

export const GET = withApiHandler(
	async (_req, { userId }) => {
		const INTEREST_FACILITY_LIMIT = 3;
		const NEARBY_FACILITY_LIMIT = 5;
		const fallbackSources = {
			isalang: {
				name: "아이사랑",
				updatedAt: new Date().toISOString(),
			},
		};

		try {
			let user = null;
			let interestFacilities: ReturnType<typeof toFacilityDTO>[] = [];
			let alertCount = 0;
			let waitlistCount = 0;
			let documentCount = 0;
			let bestWaitlistPosition: number | undefined;
			let waitlistFacilityName: string | undefined;

			const [hotPostsRawResult, lastFacilityResult, totalFacilitiesResult] = await Promise.allSettled([
				Post.find()
					.select("content category likes commentCount createdAt authorId")
					.populate("authorId", "nickname name image gpsVerified")
					.sort({ likes: -1 })
					.limit(3)
					.lean()
					.exec(),
				Facility.findOne()
					.sort({ lastSyncedAt: -1 })
					.select("lastSyncedAt")
					.lean()
					.exec(),
				Facility.estimatedDocumentCount(),
			]);

			const hotPostDocs =
				hotPostsRawResult.status === "fulfilled" ? hotPostsRawResult.value : [];
			const lastFacilityDoc =
				lastFacilityResult.status === "fulfilled" ? lastFacilityResult.value : null;
			const totalFacilities = totalFacilitiesResult.status === "fulfilled" ? totalFacilitiesResult.value : 20027;
			const hotPosts = (hotPostDocs as PostLean[]).map((post) =>
				toPostDTO(post as PostLean),
			);

			let regionFilter: Record<string, unknown> = {};

			if (userId) {
				const userDoc = await User.findById(userId).lean().catch(() => null);
				const rawUser = userDoc as UserLean | null;
				if (rawUser) {
					const region = rawUser.region || {};
					user = {
						id: String(rawUser._id ?? ""),
						nickname: rawUser.nickname || rawUser.name || "사용자",
						region: region || { sido: "", sigungu: "", dong: "" },
						onboardingCompleted: rawUser.onboardingCompleted || false,
						interests: Array.isArray(rawUser.interests)
							? rawUser.interests.map(String).slice(0, INTEREST_FACILITY_LIMIT)
							: [],
						children: Array.isArray(rawUser.children) ? rawUser.children : [],
						plan: rawUser.plan || "free",
						gpsVerified: rawUser.gpsVerified || false,
					};

					const userInterests = Array.isArray(rawUser.interests)
						? rawUser.interests.map(String)
						: [];

					if (user.region.sigungu) {
						regionFilter = {
							"region.sido": user.region.sido || "서울특별시",
							"region.sigungu": user.region.sigungu,
						};
					} else if (user.region.sido) {
						regionFilter = { "region.sido": user.region.sido };
					} else {
						regionFilter = { ...DEFAULT_METRO_REGION_FILTER };
					}

					const userInterestSlice = userInterests.slice(0, INTEREST_FACILITY_LIMIT);
					const [countsRawResult, activeWaitlistsResult, interestDocsResult, docCountResult] =
						await Promise.allSettled([
							Promise.all([
								Alert.countDocuments({ userId, active: true }),
								Waitlist.countDocuments({ userId, status: { $ne: "cancelled" } }),
							]),
							Waitlist.find({ userId, status: "pending" })
								.populate("facilityId", "name")
								.sort({ position: 1 })
								.limit(1)
								.lean()
								.exec(),
							userInterestSlice.length > 0
								? Facility.find({ _id: { $in: userInterestSlice } })
									.limit(INTEREST_FACILITY_LIMIT)
									.lean()
									.exec()
								: Promise.resolve([]),
							ESignatureDocument.countDocuments({ userId }),
						]);

					if (countsRawResult.status === "rejected") {
						log.warn("Home: user counts query failed", { reason: String(countsRawResult.reason) });
					}
					const counts = countsRawResult.status === "fulfilled"
						? countsRawResult.value
						: [0, 0];
					alertCount = counts[0] ?? 0;
					waitlistCount = counts[1] ?? 0;

					if (activeWaitlistsResult.status === "rejected") {
						log.warn("Home: waitlist query failed", { reason: String(activeWaitlistsResult.reason) });
					}
					const activeWaitlists = activeWaitlistsResult.status === "fulfilled"
						? activeWaitlistsResult.value
						: [];
					if (activeWaitlists.length > 0) {
						const best = activeWaitlists[0] as WaitlistLean;
						bestWaitlistPosition = best?.position;
						waitlistFacilityName = best?.facilityId?.name;
					}

					const interestDocs = interestDocsResult.status === "fulfilled"
						? interestDocsResult.value
						: [];
					interestFacilities = interestDocs.map((facility) =>
						toFacilityDTO(facility as FacilityLean),
					);

					documentCount = docCountResult.status === "fulfilled" ? docCountResult.value : 0;
				}
			} else {
				regionFilter = { ...DEFAULT_METRO_REGION_FILTER };
			}

			const [nearbyDocsResult] = await Promise.allSettled([
				Facility.find(regionFilter)
					.select("name type status address location capacity features rating lastSyncedAt")
					.sort({ updatedAt: -1 })
					.limit(NEARBY_FACILITY_LIMIT)
					.lean()
					.exec(),
			]);
			const nearbyFacilities = (
				nearbyDocsResult.status === "fulfilled" ? nearbyDocsResult.value : []
			).map((facility) => toFacilityDTO(facility as FacilityLean));

			const sources = {
				isalang: {
					name: "아이사랑",
					updatedAt:
						lastFacilityDoc?.lastSyncedAt?.toISOString() ||
						new Date().toISOString(),
				},
			};

			return NextResponse.json({
				data: {
					user,
					nearbyFacilities,
					interestFacilities,
					hotPosts,
					alertCount,
					waitlistCount,
					documentCount,
					bestWaitlistPosition,
					waitlistFacilityName,
					sources,
					totalFacilities,
				},
			});
		} catch {
			return NextResponse.json({
				data: {
					user: null,
					nearbyFacilities: [],
					interestFacilities: [],
					hotPosts: [],
					alertCount: 0,
					waitlistCount: 0,
					documentCount: 0,
					bestWaitlistPosition: undefined,
					waitlistFacilityName: undefined,
					sources: fallbackSources,
					totalFacilities: 20027,
				},
			});
		}
	},
	{
		auth: false,
		skipDb: true,
		rateLimiter: relaxedLimiter,
		cacheControl: "private, max-age=60, stale-while-revalidate=60",
	},
);
