/* ===== 시설 ===== */
export type FacilityType =
	| "국공립"
	| "민간"
	| "가정"
	| "직장"
	| "협동"
	| "사회복지";
export type FacilityStatus = "available" | "waiting" | "full";

export type FacilityFeature = string;
export type FacilityFeatures = FacilityFeature[];
export type KakaoPlaceId = string;

export interface FacilityDataQuality {
	score?: number;
	missing?: string[];
	updatedAt?: string;
}

export interface FacilityRegion {
	sido: string;
	sigungu: string;
	dong: string;
}

export interface FacilityPremiumProfile {
	directorMessage?: string;
	photos?: string[];
	programs?: string[];
	highlights?: string[];
	contactNote?: string;
}

export interface Facility {
	id: string;
	name: string;
	type: FacilityType;
	status: FacilityStatus;
	address: string;
	lat: number;
	lng: number;
	distance?: string;
	phone?: string;
	capacity: {
		total: number;
		current: number;
		waiting: number;
	};
	features: FacilityFeatures;
	rating: number;
	reviewCount: number;
	dataQuality?: FacilityDataQuality;
	isPremium?: boolean;
	premiumExpiresAt?: string;
	premiumProfile?: FacilityPremiumProfile;
	roomCount?: number;
	teacherCount?: number;
	establishmentYear?: number;
	homepage?: string;
	website?: string;
	lastSyncedAt: string;
	images?: string[];
	kakaoPlaceUrl?: string;
	kakaoPlaceId?: KakaoPlaceId;
	region?: FacilityRegion;
	programs?: string[];
	evaluationGrade?: string | null;
	operatingHours?: { open: string; close: string; extendedCare: boolean };
	dataSource?: string;
	createdAt?: string;
	updatedAt?: string;
}

/* ===== 아이 프로필 ===== */
export interface ChildProfile {
	id: string;
	name: string;
	birthDate: string;
	gender: "male" | "female" | "unspecified";
	specialNeeds?: string[];
}

export type UserRegion = FacilityRegion;
export type UserInterests = string[];
export type UserChildren = ChildProfile[];
export type UserPlan = "free" | "premium";

/* ===== 사용자 ===== */
export interface UserProfile {
	id: string;
	nickname: string;
	image?: string;
	children: UserChildren;
	region: UserRegion;
	interests: UserInterests;
	gpsVerified: boolean;
	plan: UserPlan;
	onboardingCompleted: boolean;
}

export interface ApiPagination {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface ApiResponse<T> {
	data: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
	pagination: ApiPagination;
}

/* ===== 데이터 출처 ===== */
export type DataFreshness = "realtime" | "recent" | "cached";
export type DataSource = "아이사랑" | "지도" | "후기" | "정부24" | "AI분석";

export interface SourceInfo {
	source: DataSource;
	updatedAt: string;
	freshness: DataFreshness;
	coverage?: string;
}

/* ===== 채팅 ===== */
export type ChatRole = "user" | "assistant";
export type EmbeddedCardType =
	| "facility"
	| "map"
	| "compare"
	| "checklist"
	| "chart";

export interface ChatMessage {
	id: string;
	role: ChatRole;
	content: string;
	timestamp: string;
	sources?: SourceInfo[];
	cards?: EmbeddedCard[];
	actions?: ActionButton[];
	blocks?: ChatBlock[];
	isStreaming?: boolean;
}

export interface EmbeddedCard {
	type: EmbeddedCardType;
	data: unknown;
}

export interface ActionButton {
	id: string;
	label: string;
	action: ActionType;
	variant: "solid" | "outline";
	icon?: string;
}

/* ===== Write Action ===== */
export type ActionType =
	| "register_interest"
	| "apply_waiting"
	| "set_alert"
	| "compare"
	| "generate_checklist"
	| "generate_report";

export type ActionStatus =
	| "idle"
	| "confirming"
	| "executing"
	| "success"
	| "error";

export interface ActionState {
	status: ActionStatus;
	actionType?: ActionType;
	preview?: Record<string, string>;
	error?: string;
	undoAvailable?: boolean;
	undoDeadline?: string;
}

/* ===== 토스트 ===== */
export type ToastType = "success" | "error" | "info" | "undo";

export interface ToastData {
	id: string;
	type: ToastType;
	message: string;
	action?: { label: string; onClick: () => void };
	duration?: number;
}

/* ===== NBA (Next Best Action) ===== */
export type NBAPriority = "high" | "normal";

export interface NBAItem {
	id: string;
	title: string;
	description: string;
	action?: { label: string; href: string };
	priority: number;
}

/* ===== ChatBlock 시스템 ===== */
export type ChatBlockType =
	| "text"
	| "facility_list"
	| "map"
	| "compare"
	| "actions"
	| "checklist";

export interface TextBlock {
	type: "text";
	content: string;
}

export interface FacilityBlock {
	type: "facility_list";
	facilities: Facility[];
}

export type FacilityListBlock = FacilityBlock;

export interface MapMarker {
	id: string;
	name: string;
	lat: number;
	lng: number;
	status: FacilityStatus;
}

export interface MapBlock {
	type: "map";
	center: { lat: number; lng: number };
	markers: MapMarker[];
}

export interface CompareBlock {
	type: "compare";
	facilities: Facility[];
	criteria: string[];
}

export interface ActionsBlock {
	type: "actions";
	buttons: ActionButton[];
}

export interface ReportBlock {
	type: "report";
	title: string;
	facilities: { id: string; name: string }[];
	sections: {
		title: string;
		items: {
			label: string;
			values: string[];
			highlight?: number;
		}[];
	}[];
	summary: string;
}

export interface ChecklistBlock {
	type: "checklist";
	title: string;
	categories: {
		title: string;
		items: {
			id: string;
			text: string;
			detail?: string;
			checked: boolean;
			required?: boolean;
		}[];
	}[];
}

export type ChatBlock =
	| TextBlock
	| FacilityBlock
	| MapBlock
	| ActionsBlock
	| ChecklistBlock
	| CompareBlock;

/* ===== 커뮤니티 ===== */
export interface CommunityPost {
	id: string;
	authorId?: string;
	author: {
		nickname: string;
		avatar?: string;
		verified: boolean;
	};
	title?: string;
	content: string;
	facilityTags?: string[];
	aiSummary?: string;
	likes: number;
	likedBy?: string[];
	commentCount: number;
	createdAt: string;
	category: "question" | "review" | "info" | "feedback";
}
