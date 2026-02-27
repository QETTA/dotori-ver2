/**
 * 유치원알리미 API 래퍼 (e-childschoolinfo.moe.go.kr)
 *
 * 환경변수: KINDERGARTEN_API_KEY (유치원알리미 Open API 키)
 * 미설정 시 빈 배열 반환 + 경고 로그
 *
 * 패턴: isalang-api.ts 동일
 */
import { log } from "@/lib/logger";

const BASE_URL = "https://e-childschoolinfo.moe.go.kr/api/notice";

/* ─── Raw API Response Types ─── */

export interface RawKindergartenFacility {
	kindername: string;        // 유치원명
	addr: string;              // 주소
	telno: string;             // 전화번호
	establish: string;         // 설립유형 (국립, 공립(단설), 공립(병설), 사립)
	edate: string;             // 설립일
	oession: string;           // 수업일수
	opertime: string;          // 운영시간
	clcnt3: string;            // 만3세 학급수
	clcnt4: string;            // 만4세 학급수
	clcnt5: string;            // 만5세 학급수
	mixclcnt: string;          // 혼합 학급수
	shclcnt: string;           // 특수 학급수
	ppcnt3: string;            // 만3세 원아수
	ppcnt4: string;            // 만4세 원아수
	ppcnt5: string;            // 만5세 원아수
	mixppcnt: string;          // 혼합 원아수
	shppcnt: string;           // 특수 원아수
	la?: string;               // 위도
	lo?: string;               // 경도
	[key: string]: string | undefined;
}

/* ─── Parsed Types ─── */

export interface ParsedKindergartenFacility {
	name: string;
	address: string;
	phone: string;
	type: "국립유치원" | "공립유치원" | "사립유치원";
	lat: number;
	lng: number;
	capacity: { total: number; current: number; waiting: number };
	ageClasses: { className: string; capacity: number; current: number; waiting: number }[];
	establishmentYear: number | undefined;
	operatingHours: string | undefined;
	dataSource: "유치원알리미";
}

/* ─── Parser ─── */

function parseEstablishType(raw: string): ParsedKindergartenFacility["type"] {
	if (raw.includes("국립")) return "국립유치원";
	if (raw.includes("공립")) return "공립유치원";
	return "사립유치원";
}

function safeInt(value: string | undefined): number {
	const n = Number.parseInt(value ?? "0", 10);
	return Number.isNaN(n) ? 0 : n;
}

export function parseKindergartenFacility(
	raw: RawKindergartenFacility,
): ParsedKindergartenFacility {
	const classes: { className: string; classCount: number; pupilCount: number }[] = [
		{ className: "만3세", classCount: safeInt(raw.clcnt3), pupilCount: safeInt(raw.ppcnt3) },
		{ className: "만4세", classCount: safeInt(raw.clcnt4), pupilCount: safeInt(raw.ppcnt4) },
		{ className: "만5세", classCount: safeInt(raw.clcnt5), pupilCount: safeInt(raw.ppcnt5) },
		{ className: "혼합", classCount: safeInt(raw.mixclcnt), pupilCount: safeInt(raw.mixppcnt) },
		{ className: "특수", classCount: safeInt(raw.shclcnt), pupilCount: safeInt(raw.shppcnt) },
	].filter((c) => c.classCount > 0 || c.pupilCount > 0);

	// 유치원알리미는 정원을 직접 제공하지 않으므로 학급수 × 20(표준)으로 추정
	const PUPILS_PER_CLASS = 20;
	const ageClasses = classes.map((c) => ({
		className: c.className,
		capacity: c.classCount * PUPILS_PER_CLASS,
		current: c.pupilCount,
		waiting: 0,
	}));

	const totalCapacity = ageClasses.reduce((sum, ac) => sum + ac.capacity, 0);
	const totalCurrent = ageClasses.reduce((sum, ac) => sum + ac.current, 0);

	const yearMatch = raw.edate?.match(/(\d{4})/);

	return {
		name: raw.kindername,
		address: raw.addr,
		phone: raw.telno || "",
		type: parseEstablishType(raw.establish),
		lat: Number.parseFloat(raw.la ?? "0") || 0,
		lng: Number.parseFloat(raw.lo ?? "0") || 0,
		capacity: { total: totalCapacity, current: totalCurrent, waiting: 0 },
		ageClasses,
		establishmentYear: yearMatch ? Number.parseInt(yearMatch[1], 10) : undefined,
		operatingHours: raw.opertime || undefined,
		dataSource: "유치원알리미",
	};
}

/* ─── 시도 코드 ─── */

export const SIDO_CODES: Record<string, string> = {
	서울특별시: "11",
	부산광역시: "26",
	대구광역시: "27",
	인천광역시: "28",
	광주광역시: "29",
	대전광역시: "30",
	울산광역시: "31",
	세종특별자치시: "36",
	경기도: "41",
	강원특별자치도: "42",
	충청북도: "43",
	충청남도: "44",
	전북특별자치도: "45",
	전라남도: "46",
	경상북도: "47",
	경상남도: "48",
	제주특별자치도: "50",
};

/* ─── API Fetch ─── */

/**
 * 유치원알리미에서 시도별 유치원 목록 조회.
 * API 키 미설정 시 빈 배열 반환.
 */
export async function fetchKindergartenFacilities(
	sidoCode: string,
	sggCode?: string,
): Promise<ParsedKindergartenFacility[]> {
	const apiKey = process.env.KINDERGARTEN_API_KEY;
	if (!apiKey) {
		log.warn("KINDERGARTEN_API_KEY not set — returning empty array");
		return [];
	}

	const params = new URLSearchParams({
		key: apiKey,
		sidoCode,
		sggCode: sggCode ?? "",
	});

	try {
		const response = await fetch(`${BASE_URL}/basicInfo.do?${params}`, {
			signal: AbortSignal.timeout(30_000),
		});

		if (!response.ok) {
			log.error("Kindergarten API error", {
				status: response.status,
				sidoCode,
			});
			return [];
		}

		const data = await response.json();
		const items: RawKindergartenFacility[] = data?.kinderInfo ?? [];

		return items.map(parseKindergartenFacility);
	} catch (err) {
		log.error("Kindergarten API fetch failed", {
			error: err instanceof Error ? err.message : "unknown",
			sidoCode,
		});
		return [];
	}
}

/* ─── Sync to MongoDB ─── */

export async function syncKindergartenToDB(sidoCode: string): Promise<{
	created: number;
	updated: number;
	total: number;
}> {
	const { default: dbConnect } = await import("@/lib/db");
	const { default: Facility } = await import("@/models/Facility");

	await dbConnect();

	const facilities = await fetchKindergartenFacilities(sidoCode);
	let created = 0;
	let updated = 0;

	for (const f of facilities) {
		if (!f.name || !f.address) continue;

		const existing = await Facility.findOne({
			name: f.name.trim(),
			address: f.address.trim(),
		})
			.select("_id")
			.lean();

		const addressParts = f.address.split(" ");
		const sido = addressParts[0] || "";
		const sigungu = addressParts[1] || "";
		const dong = addressParts[2] || "";

		const status =
			f.capacity.current >= f.capacity.total ? "full" : "available";

		try {
			if (existing) {
				await Facility.findByIdAndUpdate(existing._id, {
					$set: {
						"capacity.total": f.capacity.total,
						"capacity.current": f.capacity.current,
						status,
						phone: f.phone || undefined,
						facilityCategory: "kindergarten",
						dataSource: "유치원알리미",
						lastSyncedAt: new Date(),
					},
				});
				updated++;
			} else {
				await Facility.create({
					name: f.name,
					type: f.type,
					facilityCategory: "kindergarten",
					status,
					address: f.address,
					region: { sido, sigungu, dong },
					location: {
						type: "Point",
						coordinates: [f.lng, f.lat],
					},
					phone: f.phone,
					capacity: {
						total: f.capacity.total,
						current: f.capacity.current,
						waiting: 0,
					},
					operatingHours: f.operatingHours
						? { open: "09:00", close: f.operatingHours, extendedCare: false }
						: undefined,
					establishmentYear: f.establishmentYear,
					dataSource: "유치원알리미",
					lastSyncedAt: new Date(),
				});
				created++;
			}
		} catch (err) {
			log.warn("유치원 시설 upsert 실패", {
				name: f.name,
				error: err instanceof Error ? err.message : String(err),
			});
		}
	}

	return { created, updated, total: facilities.length };
}
