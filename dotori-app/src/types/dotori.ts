/* ===== 시설 ===== */
export type DaycareFacilityType =
	| "국공립"
	| "민간"
	| "가정"
	| "직장"
	| "협동"
	| "사회복지";
export type KindergartenFacilityType =
	| "국립유치원"
	| "공립유치원"
	| "사립유치원";
export type FacilityType = DaycareFacilityType | KindergartenFacilityType;
export type FacilityCategory = "daycare" | "kindergarten";
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

export interface FacilityPremium {
	isActive: boolean;
	plan: "basic" | "pro";
	features: string[];
	sortBoost: number;
	startDate?: string;
	endDate?: string;
	contactPerson?: string;
	contactEmail?: string;
	contactPhone?: string;
	verifiedAt?: string;
}

export interface AgeClassCapacity {
	className: string;
	capacity: number;
	current: number;
	waiting: number;
}

export type FunnelStep = 0 | 1 | 2 | 3;

export interface Facility {
	id: string;
	name: string;
	type: FacilityType;
	facilityCategory?: FacilityCategory;
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
	ageClasses?: AgeClassCapacity[];
	features: FacilityFeatures;
	rating: number;
	reviewCount: number;
	dataQuality?: FacilityDataQuality;
	premium?: FacilityPremium;
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
	toScore?: number;
	toConfidence?: TOConfidenceLevel;
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
export type DataSource = "아이사랑" | "지도" | "후기" | "정부24" | "토리톡 인사이트" | "AI분석" | "유치원알리미" | "KOSIS" | "행안부";

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
	quick_replies?: string[];
	cards?: EmbeddedCard[];
	actions?: ActionButton[];
	blocks?: ChatBlock[];
	isStreaming?: boolean;
}

export interface UsageStats {
	chat: number;
	alert: number;
	limits: {
		chat: number;
	};
}

export type EmbeddedCard =
	| { type: "facility"; data: Facility[] }
	| { type: "map"; data: { center: { lat: number; lng: number }; markers: { lat: number; lng: number; label?: string }[] } }
	| { type: "compare"; data: { facilities: Facility[]; highlightBest?: boolean } }
	| { type: "checklist"; data: { categories: { name: string; items: { label: string; checked: boolean }[] }[] } }
	| { type: "chart"; data: Record<string, string | number> };

export interface ActionButton {
	id: string;
	label: string;
	action?: ActionType;
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

/* ===== TO 예측 ===== */
export type TOConfidenceLevel = "low" | "medium" | "high";

export interface TOFactor {
	name: string;
	impact: number;
	description: string;
}

export interface TOAgeClassPrediction {
	className: string;
	currentVacancy: number;
	predictedVacancy: number;
	confidence: TOConfidenceLevel;
}

export interface TOPredictionResult {
	facilityId: string;
	facilityName: string;
	overallScore: number;
	predictedVacancies: number;
	confidence: TOConfidenceLevel;
	byAgeClass: TOAgeClassPrediction[];
	factors: TOFactor[];
	calculatedAt: string;
	validUntil: string;
}

/* ===== 전자서명 ===== */
export type ESignatureDocumentType =
	// 기존 서류 (enrollment)
	| "입소신청서"
	| "건강검진확인서"
	| "예방접종증명서"
	| "영유아건강검진결과통보서"
	| "주민등록등본"
	| "재직증명서"
	| "소득증빙서류"
	// 동의서 (consent) — 전략 v4.0
	| "입소동의서"
	| "개인정보동의서"
	| "귀가동의서"
	| "투약의뢰서"
	| "현장학습동의서"
	| "차량운행동의서"
	| "CCTV열람동의서";

export type ESignatureStatus =
	| "draft"
	| "pending"
	| "signed"
	| "submitted"
	| "expired";

export interface ESignatureDocument {
	id: string;
	userId: string;
	facilityId: string;
	documentType: ESignatureDocumentType;
	status: ESignatureStatus;
	title: string;
	fileUrl?: string;
	signedAt?: string;
	expiresAt?: string;
	metadata?: Record<string, unknown>;
	createdAt: string;
	updatedAt: string;
}

/* ===== 견학 ===== */
export type VisitStatus = "requested" | "confirmed" | "completed" | "cancelled";

export interface Visit {
	id: string;
	userId: string;
	facilityId: string;
	childId?: string;
	status: VisitStatus;
	scheduledAt: string;
	notes?: string;
	confirmedAt?: string;
	cancelReason?: string;
	createdAt: string;
	updatedAt: string;
}

/* ===== 리뷰 ===== */
export interface Review {
	id: string;
	userId: string;
	facilityId: string;
	rating: number;
	content: string;
	images: string[];
	verified: boolean;
	helpfulCount: number;
	createdAt: string;
	updatedAt: string;
}

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
