import type { ChildProfile, CommunityPost, Facility, FacilityStatus, FacilityType } from "@/types/dotori";
import { formatDistance } from "./utils";

interface FacilityDocument {
	_id?: unknown;
	id?: string;
	name: string;
	type: string;
	status: string;
	address: string;
	dataQuality?: {
		score?: number;
		missing?: string[];
		updatedAt?: Date | string;
	};
	isPremium?: boolean;
	premiumExpiresAt?: Date | string;
	premium?: {
		isActive: boolean;
		plan: "basic" | "pro";
		features: string[];
		sortBoost: number;
		verifiedAt?: Date | string;
		startDate?: Date | string;
		endDate?: Date | string;
		contactPerson?: string;
		contactEmail?: string;
		contactPhone?: string;
	};
	premiumProfile?: {
		directorMessage?: string;
		photos?: string[];
		programs?: string[];
		highlights?: string[];
		contactNote?: string;
	};
	location?: { coordinates?: [number, number] };
	roomCount?: number;
	teacherCount?: number;
	establishmentYear?: number;
	homepage?: string;
	distance?: number;
	phone?: string;
	capacity: { total: number; current: number; waiting: number };
	features?: string[];
	rating?: number;
	reviewCount?: number;
	lastSyncedAt?: Date | string;
	images?: string[];
	kakaoPlaceUrl?: string;
	kakaoPlaceId?: string;
	region?: { sido: string; sigungu: string; dong: string };
	programs?: string[];
	evaluationGrade?: string | null;
	operatingHours?: { open: string; close: string; extendedCare: boolean };
	dataSource?: string;
	createdAt?: Date | string;
	updatedAt?: Date | string;
}

interface PostDocument {
	_id?: unknown;
	id?: string;
	authorId?: { _id?: unknown; name?: string; nickname?: string; image?: string; gpsVerified?: boolean } | unknown;
	author?: { nickname?: string; name?: string; avatar?: string; image?: string; verified?: boolean; gpsVerified?: boolean };
	title?: string;
	content: string;
	category: string;
	facilityTags?: string[];
	aiSummary?: string;
	likes?: number;
	likedBy?: unknown[];
	commentCount?: number;
	createdAt?: Date | string;
}

/**
 * Mongoose Facility doc (.lean()) → Frontend Facility DTO
 *
 * Transforms:
 * - location.coordinates[lng, lat] → lat, lng
 * - _id → id
 * - lastSyncedAt (Date) → lastSyncedAt (ISO string)
 * - distance (meters, from $geoNear) → distance (formatted string)
 * - createdAt/updatedAt (Date) → ISO string
 */
export function toFacilityDTO(doc: FacilityDocument, distanceMeters?: number): Facility {
	const coords = doc.location?.coordinates;
	const activePremium = Boolean(doc.premium?.isActive);
	const toIsoDate = (value?: Date | string): string => {
		if (value instanceof Date && Number.isFinite(value.getTime())) {
			return value.toISOString();
		}
		if (typeof value === "string" && value.trim()) {
			const parsed = new Date(value);
			if (Number.isFinite(parsed.getTime())) {
				return parsed.toISOString();
			}
		}

		return new Date().toISOString();
	};
	return {
		id: String(doc._id ?? doc.id),
		name: doc.name,
		type: doc.type as FacilityType,
		status: doc.status as FacilityStatus,
		address: doc.address,
		lat: coords ? coords[1] : 0,
		lng: coords ? coords[0] : 0,
		distance:
			distanceMeters != null
				? formatDistance(distanceMeters)
				: doc.distance != null
					? formatDistance(doc.distance)
					: undefined,
		phone: doc.phone,
		capacity: doc.capacity,
		features: doc.features ?? [],
		rating: doc.rating ?? 0,
		reviewCount: doc.reviewCount ?? 0,
		dataQuality: doc.dataQuality
			? {
					score: doc.dataQuality.score,
					missing: doc.dataQuality.missing,
					updatedAt:
						doc.dataQuality.updatedAt instanceof Date
							? doc.dataQuality.updatedAt.toISOString()
							: doc.dataQuality.updatedAt,
					}
				: undefined,
			isPremium: doc.isPremium || activePremium,
		premium: activePremium
			? {
					isActive: true,
					plan: doc.premium?.plan ?? "basic",
					features: doc.premium?.features ?? [],
					sortBoost: doc.premium?.sortBoost ?? 0,
					verifiedAt: doc.premium?.verifiedAt
						? toIsoDate(doc.premium.verifiedAt)
						: undefined,
				}
				: undefined,
			premiumExpiresAt:
				doc.premiumExpiresAt instanceof Date
					? doc.premiumExpiresAt.toISOString()
					: doc.premiumExpiresAt,
		premiumProfile: doc.premiumProfile
			? {
					directorMessage: doc.premiumProfile.directorMessage,
					photos: doc.premiumProfile.photos,
					programs: doc.premiumProfile.programs,
					highlights: doc.premiumProfile.highlights,
					contactNote: doc.premiumProfile.contactNote,
				}
			: undefined,
		roomCount: doc.roomCount,
		teacherCount: doc.teacherCount,
		establishmentYear: doc.establishmentYear,
		homepage: doc.homepage,
		website: doc.homepage,
		lastSyncedAt:
			doc.lastSyncedAt instanceof Date
				? doc.lastSyncedAt.toISOString()
				: String(doc.lastSyncedAt ?? ""),
		images: doc.images ?? [],
		kakaoPlaceUrl: doc.kakaoPlaceUrl || undefined,
		kakaoPlaceId: doc.kakaoPlaceId || undefined,
		region: doc.region,
		programs: doc.programs ?? [],
		evaluationGrade: doc.evaluationGrade,
		operatingHours: doc.operatingHours,
		dataSource: doc.dataSource,
		createdAt:
			doc.createdAt instanceof Date
				? doc.createdAt.toISOString()
				: doc.createdAt,
		updatedAt:
			doc.updatedAt instanceof Date
				? doc.updatedAt.toISOString()
				: doc.updatedAt,
	};
}

/**
 * Mongoose Post doc (.lean(), populated authorId) → Frontend CommunityPost DTO
 *
 * Transforms:
 * - _id → id
 * - authorId (ObjectId or populated User) → author { nickname, avatar?, verified }
 * - commentCount (Mongoose) → commentCount (TS)
 * - createdAt (Date) → ISO string
 */
export function toPostDTO(doc: PostDocument): CommunityPost {
	type PopulatedAuthor = { _id?: unknown; name?: string; nickname?: string; image?: string; gpsVerified?: boolean };
	const populatedAuthorId = doc.authorId && typeof doc.authorId === "object"
		? (doc.authorId as PopulatedAuthor)
		: null;

	const author = doc.author
		? {
				nickname: doc.author.nickname ?? doc.author.name ?? "익명",
				avatar: doc.author.avatar ?? doc.author.image,
				verified: doc.author.verified ?? doc.author.gpsVerified ?? false,
			}
		: populatedAuthorId?.name
			? {
					nickname: populatedAuthorId.nickname || populatedAuthorId.name,
					avatar: populatedAuthorId.image,
					verified: populatedAuthorId.gpsVerified ?? false,
				}
			: { nickname: "익명", verified: false };

	return {
		id: String(doc._id ?? doc.id),
		authorId: doc.authorId
			? String(populatedAuthorId?._id ?? doc.authorId)
			: undefined,
		author,
		title: doc.title,
		content: doc.content,
		facilityTags: doc.facilityTags ?? [],
		aiSummary: doc.aiSummary,
		likes: doc.likes ?? 0,
		likedBy: Array.isArray(doc.likedBy) ? doc.likedBy.map(String) : [],
		commentCount: doc.commentCount ?? 0,
		createdAt:
			doc.createdAt instanceof Date
				? doc.createdAt.toISOString()
				: String(doc.createdAt ?? ""),
		category: doc.category as CommunityPost["category"],
	};
}

export function toChildProfile(raw: Record<string, unknown> | undefined | null): ChildProfile | null {
	if (!raw) return null;
	const g = String(raw.gender || "unspecified");
	return {
		id: String(raw._id || raw.id || ""),
		name: String(raw.name || ""),
		birthDate: String(raw.birthDate || ""),
		gender: (g === "male" || g === "female" ? g : "unspecified") as ChildProfile["gender"],
		specialNeeds: Array.isArray(raw.specialNeeds) ? raw.specialNeeds.map(String) : undefined,
	};
}
