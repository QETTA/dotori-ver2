/**
 * Maps childcare facility data from multiple sources to the Mongoose IFacility schema.
 *
 * Supported sources:
 * 1. data.go.kr CSV (전국어린이집표준데이터) — Korean field names
 * 2. Seoul Open Data API (ChildCareInfo) — English field codes (CRNAME, etc.)
 * 3. data.go.kr odcloud API — Korean field names
 */

import { logWarn } from "./progress";

type FacilityType = "국공립" | "민간" | "가정" | "직장" | "협동" | "사회복지";

const TYPE_MAP: Record<string, FacilityType> = {
  국공립: "국공립",
  "국공립(직장)": "직장",
  민간: "민간",
  가정: "가정",
  직장: "직장",
  "직장(국공립)": "직장",
  협동: "협동",
  사회복지: "사회복지",
  사회복지법인: "사회복지",
  법인: "사회복지",
  "법인·단체등": "사회복지",
  "법인·단체": "사회복지",
  부모협동: "협동",
};

export interface MappedFacility {
  name: string;
  type: FacilityType;
  status: "available" | "waiting" | "full";
  address: string;
  region: { sido: string; sigungu: string; dong: string };
  location: { type: "Point"; coordinates: [number, number] };
  phone: string;
  capacity: { total: number; current: number; waiting: number };
  features: string[];
  programs: string[];
  rating: number;
  reviewCount: number;
  evaluationGrade: string | null;
  operatingHours: { open: string; close: string; extendedCare: boolean };
  images: string[];
  dataSource: string;
  lastSyncedAt: Date;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function str(raw: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const v = raw[key];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return "";
}

function num(raw: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const v = raw[key];
    if (v != null) {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return 0;
}

function extractDong(address: string): string {
  const match = address.match(/\s([가-힣]+(?:동|읍|면|리|가|로))(?:\s|$|\d)/);
  if (match) return match[1];
  const parts = address.split(/\s+/);
  if (parts.length >= 3 && /[동읍면리가]$/.test(parts[2])) return parts[2];
  return "";
}

function extractSido(address: string): string {
  const match = address.match(
    /^(서울특별시|부산광역시|대구광역시|인천광역시|광주광역시|대전광역시|울산광역시|세종특별자치시|경기도|강원특별자치도|강원도|충청북도|충청남도|전라북도|전북특별자치도|전라남도|경상북도|경상남도|제주특별자치도)/,
  );
  return match ? match[1] : "";
}

function deriveStatus(
  total: number,
  current: number,
): "available" | "waiting" | "full" {
  if (total <= 0) return "available";
  const ratio = current / total;
  if (ratio >= 1) return "full";
  if (ratio >= 0.9) return "waiting";
  return "available";
}

// ---------------------------------------------------------------------------
// Source detection
// ---------------------------------------------------------------------------

type SourceType = "seoul-api" | "data-go-kr" | "data-go-kr-national";

function detectSource(raw: Record<string, unknown>): SourceType {
  if ("CRNAME" in raw || "CRTYPENAME" in raw) return "seoul-api";
  if ("CHILD_HOUSE_NM" in raw || "CTPRVN_NM" in raw) return "data-go-kr-national";
  return "data-go-kr";
}

// ---------------------------------------------------------------------------
// Feature extraction
// ---------------------------------------------------------------------------

function buildFeatures(
  raw: Record<string, unknown>,
  source: SourceType,
): string[] {
  const features: string[] = [];

  if (source === "seoul-api") {
    const bus = str(raw, "CRCARGBNAME");
    if (bus && bus !== "미운영") features.push("통학버스");
    if (num(raw, "CCTVINSTLCNT") > 0) features.push("CCTV");
    if (num(raw, "PLGRDCO") > 0) features.push("놀이터");
  } else if (source === "data-go-kr-national") {
    const bus = str(raw, "ATNDSKL_VHCLE_YN");
    if (bus === "Y" || bus === "운영") features.push("통학버스");
    if (num(raw, "CCTV_CO") > 0) features.push("CCTV");
    if (num(raw, "PLAYGROUND_CO") > 0) features.push("놀이터");
  } else {
    const bus = str(raw, "통학차량운영여부");
    if (bus === "Y" || bus === "운영") features.push("통학버스");
    if (num(raw, "CCTV설치수", "CCTV총수") > 0) features.push("CCTV");
    if (num(raw, "놀이터수") > 0) features.push("놀이터");
  }

  return features;
}

// ---------------------------------------------------------------------------
// Map record (universal)
// ---------------------------------------------------------------------------

/**
 * Map a raw record from any supported source to MappedFacility.
 * Returns null if the record should be skipped.
 */
export function mapRecord(
  raw: Record<string, unknown>,
): MappedFacility | null {
  const source = detectSource(raw);

  // --- Name ---
  const name = str(raw, "CRNAME", "CHILD_HOUSE_NM", "어린이집명");
  if (!name) return null;

  // --- Operating status (skip closed) ---
  // National data doesn't have status field — assume all are active
  if (source !== "data-go-kr-national") {
    const opStatus = str(raw, "CRSTATUSNAME", "운영현황");
    if (opStatus && opStatus !== "정상") return null;
  }

  // --- Type ---
  const rawType = str(raw, "CRTYPENAME", "CHILD_HOUSE_TYPE", "어린이집유형구분", "어린이집유형");
  const type = TYPE_MAP[rawType];
  if (!type) {
    if (rawType) logWarn(`Unknown type: "${rawType}" (${name})`);
    return null;
  }

  // --- Address ---
  const address = str(raw, "CRADDR", "RDNMADR", "주소", "도로명주소", "소재지도로명주소");
  if (!address) return null;

  // --- Region ---
  let sido = str(raw, "CTPRVN_NM", "시도", "시도명");
  let sigungu = str(raw, "SIGUNNAME", "SIGNGU_NM", "시군구", "시군구명");
  const dong = extractDong(address);

  // National data sometimes includes sido prefix in sigungu (e.g. "서울특별시 도봉구")
  if (sido && sigungu.startsWith(sido)) {
    sigungu = sigungu.slice(sido.length).trim();
  }

  // Seoul API doesn't have sido field — extract from address
  if (!sido && source === "seoul-api") {
    sido = extractSido(address) || "서울특별시";
  }
  // National data — extract from address if missing
  if (!sido && source === "data-go-kr-national") {
    sido = extractSido(address);
  }

  // --- Coordinates ---
  const lat = num(raw, "LA", "위도");
  const lng = num(raw, "LO", "경도");

  // --- Capacity ---
  const total = num(raw, "CRCAPAT", "PSNCPA", "정원수", "정원");
  const current = num(raw, "CRCHCNT", "현원수", "현원");

  // --- Phone ---
  let phone = str(raw, "CRTELNO", "CHILD_HOUSE_TELEPHONE_NUMBER", "어린이집전화번호", "전화번호");
  phone = phone.replace(/[^\d-]/g, "");

  // Determine data source label
  const dataSourceLabel =
    source === "seoul-api" ? "seoul-opendata" :
    source === "data-go-kr-national" ? "data.go.kr-national" :
    "data.go.kr";

  return {
    name,
    type,
    status: deriveStatus(total, current),
    address,
    region: { sido, sigungu, dong },
    location: {
      type: "Point",
      coordinates: [lng, lat], // GeoJSON [longitude, latitude]
    },
    phone,
    capacity: { total, current, waiting: 0 },
    features: buildFeatures(raw, source),
    programs: [],
    rating: 0,
    reviewCount: 0,
    evaluationGrade: null,
    operatingHours: { open: "07:30", close: "19:30", extendedCare: false },
    images: [],
    dataSource: dataSourceLabel,
    lastSyncedAt: new Date(),
  };
}

/**
 * Check if a mapped facility has valid coordinates.
 */
export function hasValidCoords(f: MappedFacility): boolean {
  const [lng, lat] = f.location.coordinates;
  return lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132;
}
