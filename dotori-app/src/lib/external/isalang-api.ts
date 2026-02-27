/**
 * 아이사랑 포털 어린이집 API — 이중 엔드포인트
 *
 * 1차: api.childcare.go.kr (cpmsapi030) — 실시간 정원/현원/대기
 *      인증: CHILDCARE_PORTAL_KEY (info.childcare.go.kr에서 발급)
 *
 * 2차: api.odcloud.kr (전국어린이집표준데이터 15013108) — 기본 시설 정보
 *      인증: PUBLIC_DATA_API_KEY 또는 DATA_GO_KR_KEY (data.go.kr에서 발급)
 *
 * 환경변수 우선순위:
 *   CHILDCARE_PORTAL_KEY → childcare.go.kr 전용 (실시간 대기현황 포함)
 *   PUBLIC_DATA_API_KEY → data.go.kr 표준데이터
 *   DATA_GO_KR_KEY → data.go.kr 폴백
 *
 * 원본 참조: reference/legacy-backend/src/lib/external/childcare-api.ts
 */

import type { FacilityStatus } from "@/types/dotori";
import { log } from "@/lib/logger";

/* ─── Endpoints ─── */

const CHILDCARE_URL = "https://api.childcare.go.kr/mediate/rest";
const ODCLOUD_DATASET_ID = "15013108";
const ODCLOUD_UDDI = "4cc38b42-9b9c-4665-a4c9-c313b2fb678c_202008311436";
const ODCLOUD_URL = `https://api.odcloud.kr/api/${ODCLOUD_DATASET_ID}/v1/uddi:${ODCLOUD_UDDI}`;

/* ─── Raw API Response Types ─── */

// childcare.go.kr (cpmsapi030) response fields
interface RawFacility {
	crname: string; // 어린이집명
	craddr: string; // 주소
	crtel: string; // 전화번호
	crtypename: string; // 어린이집 유형명
	crcapat: string; // 정원
	crchcnt: string; // 현원
	crwcnt: string; // 대기 아동수
	la: string; // 위도
	lo: string; // 경도
	crstpname: string; // 설립 유형명
	crfax?: string; // 팩스
	cropstime?: string; // 운영 시간
	sigunname?: string; // 시군구명
	crstatusname?: string; // 운영상태 (정상, 휴지, 폐지)
}

// data.go.kr odcloud response fields (Korean column names)
interface OdcloudRecord {
	어린이집명: string;
	주소?: string;
	도로명주소?: string;
	소재지도로명주소?: string;
	전화번호?: string;
	어린이집전화번호?: string;
	어린이집유형구분?: string;
	어린이집유형?: string;
	정원수?: number;
	정원?: number;
	현원수?: number;
	현원?: number;
	위도?: number;
	경도?: number;
	시도?: string;
	시도명?: string;
	시군구?: string;
	시군구명?: string;
	운영현황?: string;
	통학차량운영여부?: string;
	[key: string]: unknown;
}

export interface ParsedFacility {
	name: string;
	type: "국공립" | "민간" | "가정" | "직장" | "협동" | "사회복지";
	address: string;
	phone: string;
	capacity: number;
	currentEnrollment: number;
	waitingCount: number;
	lat: number;
	lng: number;
	operatingHours: string;
	region: string;
	status: "available" | "waiting" | "full";
}

export interface SyncStatusChange {
	facilityId: string;
	name: string;
	oldStatus: FacilityStatus;
	newStatus: FacilityStatus;
}

export interface SyncFacilityFailure {
	facilityName: string;
	address: string;
	reason: string;
}

export interface SyncFacilityResult {
	created: number;
	updated: number;
	total: number;
	skipped: number;
	statusChanges: SyncStatusChange[];
	failures: SyncFacilityFailure[];
}

function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : "알 수 없는 오류";
}

function makeFacilityLookupKey(name: string, address: string): string {
	return `${name.trim().toLowerCase()}|${address.trim().toLowerCase()}`;
}

function toArray<T>(value: unknown): T[] {
	if (!value) return [];
	if (Array.isArray(value)) return value;
	return [value as T];
}

/** Detect XML error responses from childcare.go.kr */
function parseXmlError(text: string): string | null {
	const match = /<errmsg>(.*?)<\/errmsg>/.exec(text);
	return match ? match[1] : null;
}

/* ─── API Key Resolution ─── */

type ApiSource = "childcare" | "odcloud";

function resolveApiKey(): { key: string; source: ApiSource } | null {
	// 1차: childcare.go.kr 전용 키
	const childcareKey = process.env.CHILDCARE_PORTAL_KEY;
	if (childcareKey) return { key: childcareKey, source: "childcare" };

	// 2차: data.go.kr 키 (odcloud 엔드포인트용)
	const dataKey =
		process.env.PUBLIC_DATA_API_KEY || process.env.DATA_GO_KR_KEY;
	if (dataKey) return { key: dataKey, source: "odcloud" };

	return null;
}

/* ─── childcare.go.kr Fetch (cpmsapi030) ─── */

async function fetchFromChildcare(
	key: string,
	params: {
		arcode?: string;
		stcode?: string;
		page?: number;
		perPage?: number;
	},
): Promise<{ facilities: ParsedFacility[]; total: number }> {
	const { arcode, stcode, page = 1, perPage = 100 } = params;

	const url = new URL(`${CHILDCARE_URL}/cpmsapi030/cpmsapi030/request`);
	url.searchParams.set("key", key);
	url.searchParams.set("type", "json");
	if (arcode) url.searchParams.set("arcode", arcode);
	if (stcode) url.searchParams.set("stcode", stcode);
	url.searchParams.set("pageno", String(page));
	url.searchParams.set("output", String(perPage));

	const res = await fetch(url.toString(), {
		next: { revalidate: 86400 },
		signal: AbortSignal.timeout(30_000),
	});

	const text = await res.text();

	// childcare.go.kr returns XML errors even when type=json is requested
	const xmlError = parseXmlError(text);
	if (xmlError) {
		throw new Error(`childcare.go.kr: ${xmlError}`);
	}

	if (!res.ok) throw new Error(`childcare.go.kr HTTP ${res.status}`);

	const data = JSON.parse(text);
	const items = toArray<RawFacility>(data?.response?.body?.items?.item);
	const total = Number.parseInt(
		data?.response?.body?.totalCount ?? "0",
		10,
	);

	const facilities = items
		.map(parseFacilityFromChildcare)
		.filter((f): f is ParsedFacility => f !== null);

	return { facilities, total };
}

/* ─── data.go.kr odcloud Fetch ─── */

/** Map sigungu name to region code for filtering */
function findRegionNameByCode(arcode: string): string {
	for (const [name, code] of Object.entries(SEOUL_REGION_CODES)) {
		if (code === arcode) return name;
	}
	return "";
}

async function fetchFromOdcloud(
	key: string,
	params: {
		arcode?: string;
		page?: number;
		perPage?: number;
	},
): Promise<{ facilities: ParsedFacility[]; total: number }> {
	const { arcode, page = 1, perPage = 100 } = params;

	const url = new URL(ODCLOUD_URL);
	url.searchParams.set("serviceKey", key);
	url.searchParams.set("page", String(page));
	url.searchParams.set("perPage", String(perPage));

	// odcloud uses sido/sigungu filter (not arcode)
	url.searchParams.set("cond[시도::EQ]", "서울특별시");
	if (arcode) {
		const regionName = findRegionNameByCode(arcode);
		if (regionName) {
			url.searchParams.set("cond[시군구::EQ]", regionName);
		}
	}

	const res = await fetch(url.toString(), {
		signal: AbortSignal.timeout(30_000),
	});

	if (!res.ok) {
		const body = await res.text().catch(() => "");
		// odcloud returns JSON errors
		try {
			const err = JSON.parse(body);
			throw new Error(
				`odcloud: ${err.msg || `HTTP ${res.status}`}`,
			);
		} catch (e) {
			if (e instanceof Error && e.message.startsWith("odcloud:"))
				throw e;
			throw new Error(`odcloud HTTP ${res.status}: ${body.slice(0, 200)}`);
		}
	}

	const data = await res.json();
	const records: OdcloudRecord[] = data?.data ?? [];
	const total = data?.matchCount ?? data?.totalCount ?? 0;

	const facilities = records
		.map(parseFacilityFromOdcloud)
		.filter((f): f is ParsedFacility => f !== null);

	return { facilities, total };
}

/* ─── Public API (tries both endpoints) ─── */

async function fetchChildcareFacilities(params: {
	arcode?: string;
	stcode?: string;
	page?: number;
	perPage?: number;
}): Promise<{ facilities: ParsedFacility[]; total: number }> {
	const resolved = resolveApiKey();
	if (!resolved) {
		throw new Error(
			"API 키가 설정되지 않았습니다. " +
				"CHILDCARE_PORTAL_KEY (info.childcare.go.kr) 또는 " +
				"PUBLIC_DATA_API_KEY (data.go.kr)를 .env.local에 설정하세요.",
		);
	}

	try {
		if (resolved.source === "childcare") {
			return await fetchFromChildcare(resolved.key, params);
		}
		return await fetchFromOdcloud(resolved.key, params);
	} catch (error) {
		log.error("아이사랑 API fetch 실패", {
			source: resolved.source,
			error: error instanceof Error ? error.message : String(error),
		});
		throw error;
	}
}

/* ─── Parsers ─── */

function parseFacilityFromChildcare(raw: RawFacility): ParsedFacility | null {
	const lat = Number.parseFloat(raw.la);
	const lng = Number.parseFloat(raw.lo);
	if (Number.isNaN(lat) || Number.isNaN(lng) || lat === 0) return null;
	if (!raw.crname?.trim() || !raw.craddr?.trim()) return null;

	if (
		raw.crstatusname &&
		(raw.crstatusname.includes("폐지") ||
			raw.crstatusname.includes("휴지"))
	) {
		return null;
	}

	const capacity = Number.parseInt(raw.crcapat, 10) || 0;
	const currentEnrollment = Number.parseInt(raw.crchcnt, 10) || 0;
	const waitingCount = Number.parseInt(raw.crwcnt, 10) || 0;

	return {
		name: raw.crname?.trim() ?? "",
		type: mapType(raw.crtypename ?? raw.crstpname ?? ""),
		address: raw.craddr?.trim() ?? "",
		phone: raw.crtel?.trim() ?? "",
		capacity,
		currentEnrollment,
		waitingCount,
		lat,
		lng,
		operatingHours: raw.cropstime?.trim() ?? "07:30-19:30",
		region: raw.sigunname?.trim() ?? "",
		status: deriveStatus(capacity, currentEnrollment, waitingCount),
	};
}

function parseFacilityFromOdcloud(raw: OdcloudRecord): ParsedFacility | null {
	const name = raw.어린이집명?.toString().trim();
	if (!name) return null;

	// Skip closed facilities
	const opStatus = raw.운영현황?.toString().trim();
	if (opStatus && opStatus !== "정상") return null;

	const address =
		raw.주소?.toString().trim() ||
		raw.도로명주소?.toString().trim() ||
		raw.소재지도로명주소?.toString().trim() ||
		"";
	if (!address) return null;

	const lat = Number(raw.위도) || 0;
	const lng = Number(raw.경도) || 0;
	if (lat === 0 || lng === 0) return null;
	// Korea bounding box check
	if (lat < 33 || lat > 39 || lng < 124 || lng > 132) return null;

	const rawType =
		raw.어린이집유형구분?.toString() ||
		raw.어린이집유형?.toString() ||
		"";
	const capacity = Number(raw.정원수 ?? raw.정원) || 0;
	const currentEnrollment = Number(raw.현원수 ?? raw.현원) || 0;

	let phone =
		raw.어린이집전화번호?.toString() ||
		raw.전화번호?.toString() ||
		"";
	phone = phone.replace(/[^\d-]/g, "");

	const region =
		raw.시군구?.toString().trim() ||
		raw.시군구명?.toString().trim() ||
		"";

	return {
		name,
		type: mapType(rawType),
		address,
		phone,
		capacity,
		currentEnrollment,
		waitingCount: 0, // odcloud 표준데이터에는 대기 아동수 없음
		lat,
		lng,
		operatingHours: "07:30-19:30",
		region,
		status: deriveStatus(capacity, currentEnrollment, 0),
	};
}

function mapType(raw: string): ParsedFacility["type"] {
	if (raw.includes("국공립")) return "국공립";
	if (raw.includes("민간")) return "민간";
	if (raw.includes("가정")) return "가정";
	if (raw.includes("직장")) return "직장";
	if (raw.includes("협동")) return "협동";
	if (raw.includes("사회복지")) return "사회복지";
	if (raw.includes("법인")) return "사회복지";
	return "민간";
}

function deriveStatus(
	capacity: number,
	current: number,
	waiting: number,
): ParsedFacility["status"] {
	if (capacity === 0) return "full";
	if (waiting > 0) return "waiting";
	if (current >= capacity) return "full";
	return "available";
}

/* ─── Seoul Region Codes (시군구) ─── */

export const SEOUL_REGION_CODES: Record<string, string> = {
	강남구: "11680",
	강동구: "11740",
	강북구: "11305",
	강서구: "11500",
	관악구: "11620",
	광진구: "11215",
	구로구: "11530",
	금천구: "11545",
	노원구: "11350",
	도봉구: "11320",
	동대문구: "11230",
	동작구: "11590",
	마포구: "11440",
	서대문구: "11410",
	서초구: "11650",
	성동구: "11200",
	성북구: "11290",
	송파구: "11710",
	양천구: "11470",
	영등포구: "11560",
	용산구: "11170",
	은평구: "11380",
	종로구: "11110",
	중구: "11140",
	중랑구: "11260",
};

/* ─── Sync to MongoDB ─── */

export async function syncFacilitiesToDB(regionCode: string): Promise<{
	created: number;
	updated: number;
	total: number;
	skipped: number;
	statusChanges: SyncStatusChange[];
	failures: SyncFacilityFailure[];
}> {
	// Dynamic import to avoid bundling Mongoose in edge
	const { default: dbConnect } = await import("@/lib/db");
	const { default: Facility } = await import("@/models/Facility");
	const { default: FacilitySnapshot } = await import(
		"@/models/FacilitySnapshot"
	);

	await dbConnect();

	const { facilities } = await fetchChildcareFacilities({
		arcode: regionCode,
		perPage: 500,
	});

	let created = 0;
	let updated = 0;
	const skipped = 0;
	const failures: SyncFacilityFailure[] = [];
	const statusChanges: {
		facilityId: string;
		name: string;
		oldStatus: FacilityStatus;
		newStatus: FacilityStatus;
	}[] = [];

	const facilityLookupKeys = facilities.map((facility) => {
		const name = facility.name.trim();
		const address = facility.address.trim();
		return {
			facility,
			key: makeFacilityLookupKey(name, address),
			name,
			address,
		};
	});

	if (facilityLookupKeys.length === 0) {
		return {
			created: 0,
			updated: 0,
			total: 0,
			skipped: 0,
			statusChanges: [],
			failures: [],
		};
	}

	const existingFacilities = await Facility.find({
		$or: facilityLookupKeys.map((item) => ({
			name: item.name,
			address: item.address,
		})),
	})
		.select("_id name address status phone")
		.lean();

	const existingByKey = new Map<
		string,
		{
			_id: string | { toString(): string };
			name: string;
			address: string;
			status: FacilityStatus;
			phone?: string;
		}
	>();

	for (const facility of existingFacilities) {
		existingByKey.set(
			makeFacilityLookupKey(facility.name, facility.address),
			facility,
		);
	}

	for (const item of facilityLookupKeys) {
		const f = item.facility;
		const addressParts = item.address.split(" ");
		const sido = addressParts[0] || "서울특별시";
		const sigungu = addressParts[1] || f.region || "";
		const dong = addressParts[2] || "";

		const [open, close] = f.operatingHours.includes("-")
			? f.operatingHours.split("-", 2)
			: ["07:30", "19:30"];
		const parsedOpen = open?.trim() || "07:30";
		const parsedClose = close?.trim() || "19:30";

		const existing = existingByKey.get(item.key);

		try {
			if (existing) {
				const oldStatus = existing.status;

				await Facility.findByIdAndUpdate(existing._id, {
					$set: {
						"capacity.total": f.capacity,
						"capacity.current": f.currentEnrollment,
						"capacity.waiting": f.waitingCount,
						status: f.status,
						phone: f.phone || existing.phone,
						dataSource: "아이사랑",
						lastSyncedAt: new Date(),
					},
				});

				if (oldStatus !== f.status) {
					statusChanges.push({
						facilityId: String(existing._id),
						name: f.name,
						oldStatus,
						newStatus: f.status,
					});
				}

				await FacilitySnapshot.create({
					facilityId: existing._id,
					capacity: {
						total: f.capacity,
						current: f.currentEnrollment,
						waiting: f.waitingCount,
					},
					status: f.status,
					snapshotAt: new Date(),
				});

				updated++;
			} else {
				const newFacility = await Facility.create({
					name: f.name,
					type: f.type,
					status: f.status,
					address: f.address,
					region: { sido, sigungu, dong },
					location: {
						type: "Point",
						coordinates: [f.lng, f.lat],
					},
					phone: f.phone,
					capacity: {
						total: f.capacity,
						current: f.currentEnrollment,
						waiting: f.waitingCount,
					},
					operatingHours: {
						open: parsedOpen,
						close: parsedClose,
						extendedCare: false,
					},
					dataSource: "아이사랑",
					lastSyncedAt: new Date(),
				});

				await FacilitySnapshot.create({
					facilityId: newFacility._id,
					capacity: {
						total: f.capacity,
						current: f.currentEnrollment,
						waiting: f.waitingCount,
					},
					status: f.status,
					snapshotAt: new Date(),
				});

				created++;
			}
		} catch (error) {
			failures.push({
				facilityName: f.name,
				address: f.address,
				reason: getErrorMessage(error),
			});
		}
	}

	return {
		created,
		updated,
		total: facilities.length,
		skipped,
		statusChanges,
		failures,
	};
}

/* ─── 아이사랑 포털 딥링크 (공동인증서/간편인증 로그인 필요) ─── */

export const ISALANG_PORTAL = {
	/** 메인 포털 */
	main: "https://www.childcare.go.kr/",
	/** 모바일 포털 */
	mobile: "https://m.childcare.go.kr/mMain.do",
	/** 입소대기 신청 */
	waitlistApply: "https://www.childcare.go.kr/?menuno=175",
	/** 등록대기 신청현황 / 대기현황 조회 */
	waitlistStatus: "https://www.childcare.go.kr/?menuno=178",
	/** 우선순위 자료제출 / 서류제출 */
	documentSubmit: "https://www.childcare.go.kr/?menuno=179",
	/** 어린이집 찾기 (대기 신청용) */
	facilitySearch: "https://www.childcare.go.kr/?menuno=176",
	/** 아동등록 */
	childRegister: "https://www.childcare.go.kr/?menuno=616",
	/** 등록대기 신청안내 */
	waitlistGuide: "https://www.childcare.go.kr/?menuno=172",
	/** 고객센터 */
	helpdesk: "tel:1566-3232",
} as const;

/* ─── 아이사랑 모바일 앱 연동 ─── */

const ISALANG_APP = {
	android: {
		packageName: "com.mw.Android_KidsLove2",
		playStoreUrl:
			"https://play.google.com/store/apps/details?id=com.mw.Android_KidsLove2",
		/** Chrome intent: 앱 실행 시도 → 미설치 시 Play Store 이동 */
		intentUrl:
			"intent://main#Intent;scheme=https;package=com.mw.Android_KidsLove2;S.browser_fallback_url=https://play.google.com/store/apps/details?id=com.mw.Android_KidsLove2;end",
	},
	ios: {
		appId: "490070696",
		appStoreUrl: "https://apps.apple.com/kr/app/id490070696",
	},
	mobileWeb: {
		main: "https://m.childcare.go.kr/mMain.do",
		waitlistGuide: "https://m.childcare.go.kr/welfare/enterWait.do",
	},
} as const;

/**
 * 모바일에서 아이사랑 앱을 실행하고, 미설치 시 스토어로 이동.
 * 데스크톱이면 웹 포털(fallbackUrl)을 새 탭으로 연다.
 */
export function openIsalangApp(fallbackUrl?: string) {
	const ua = navigator.userAgent;
	const isAndroid = /android/i.test(ua);
	const isIOS = /iphone|ipad|ipod/i.test(ua);

	if (isAndroid) {
		// Chrome intent: 앱이 있으면 실행, 없으면 Play Store
		window.location.href = ISALANG_APP.android.intentUrl;
	} else if (isIOS) {
		// iOS: Universal Link 미지원이므로 App Store로 이동
		// 앱이 이미 설치된 경우 사용자가 App Store에서 "열기"를 누르면 됨
		window.location.href = ISALANG_APP.ios.appStoreUrl;
	} else {
		// 데스크톱: 웹 포털 열기
		window.open(fallbackUrl || ISALANG_PORTAL.main, "_blank", "noopener");
	}
}

/**
 * 아이사랑 모바일 웹 또는 앱을 여는 스마트 링크.
 * - 모바일: 앱 실행 시도 → 실패 시 모바일 웹
 * - 데스크톱: 데스크톱 포털 URL 새 탭
 */
export function openIsalangLink(desktopUrl: string) {
	const ua = navigator.userAgent;
	const isMobile = /android|iphone|ipad|ipod/i.test(ua);

	if (isMobile) {
		openIsalangApp(desktopUrl);
	} else {
		window.open(desktopUrl, "_blank", "noopener");
	}
}
