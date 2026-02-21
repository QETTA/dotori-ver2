/**
 * Kakao Local REST API geocoder.
 * Converts Korean addresses to [longitude, latitude] coordinates.
 *
 * Endpoint: https://dapi.kakao.com/v2/local/search/address.json
 * Auth: Authorization: KakaoAK {REST_API_KEY}
 * Rate limit: ~30 req/s (Kakao default)
 */

const ADDRESS_ENDPOINT = "https://dapi.kakao.com/v2/local/search/address.json";
const KEYWORD_ENDPOINT = "https://dapi.kakao.com/v2/local/search/keyword.json";
const RETRY_LIMIT = 3;
const REQUEST_DELAY_MS = 50; // ~20 req/s to stay safe

function getKakaoKey(): string {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) {
    throw new Error("KAKAO_REST_API_KEY 환경변수를 설정해주세요");
  }
  return key;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export interface GeocodingResult {
  lat: number;
  lng: number;
}

/**
 * Call Kakao address search API.
 */
async function searchAddress(
  query: string,
  key: string,
): Promise<GeocodingResult | null> {
  const params = new URLSearchParams({ query });
  const res = await fetch(`${ADDRESS_ENDPOINT}?${params.toString()}`, {
    headers: { Authorization: `KakaoAK ${key}` },
  });
  if (res.status === 429) throw new Error("RATE_LIMITED");
  if (!res.ok) return null;

  const json = (await res.json()) as {
    documents: Array<{ x: string; y: string }>;
  };
  if (json.documents.length === 0) return null;
  return { lat: parseFloat(json.documents[0].y), lng: parseFloat(json.documents[0].x) };
}

/**
 * Call Kakao keyword search API (more forgiving with complex addresses).
 */
async function searchKeyword(
  query: string,
  key: string,
): Promise<GeocodingResult | null> {
  const params = new URLSearchParams({ query });
  const res = await fetch(`${KEYWORD_ENDPOINT}?${params.toString()}`, {
    headers: { Authorization: `KakaoAK ${key}` },
  });
  if (res.status === 429) throw new Error("RATE_LIMITED");
  if (!res.ok) return null;

  const json = (await res.json()) as {
    documents: Array<{ x: string; y: string }>;
  };
  if (json.documents.length === 0) return null;
  return { lat: parseFloat(json.documents[0].y), lng: parseFloat(json.documents[0].x) };
}

/**
 * Extract just the road name + building number from an address.
 * Korean road addresses follow the pattern:
 *   [시도] [시군구] [도로명][번호번길?] [건물번호][-부번호]
 *
 * "부산광역시 강서구 명지오션시티10로 17 108-103(명지동, 퀸덤1차)"
 * → "부산광역시 강서구 명지오션시티10로 17"
 * "경기도 용인시 처인구 백옥대로1402번길 21-2 104(유방동 285-5)"
 * → "경기도 용인시 처인구 백옥대로1402번길 21-2"
 */
function extractRoadAddress(address: string): string {
  // Match road name (ending with 대로/로/길 optionally followed by 숫자번길)
  // then whitespace + building number + optional sub-number
  const match = address.match(
    /^(.+?(?:대로|로|길)(?:\d+번길)?\s+\d+(?:-\d+)?)/,
  );
  return match ? match[1].trim() : address;
}

/**
 * Extract road address without sub-number.
 * "경상남도 사천시 주공로 80-5" → "경상남도 사천시 주공로 80"
 */
function extractRoadAddressBase(address: string): string {
  const match = address.match(
    /^(.+?(?:대로|로|길)(?:\d+번길)?\s+\d+)(?:-\d+)?/,
  );
  return match ? match[1].trim() : address;
}

/**
 * Geocode a single Korean address to coordinates.
 * Uses progressive simplification strategy:
 * 1. Try simplified address (strip parentheses + unit numbers)
 * 2. Try road address only (up to road number)
 * 3. Try keyword search as fallback
 * Returns null if the address cannot be resolved.
 */
export async function geocodeAddress(
  address: string,
): Promise<GeocodingResult | null> {
  if (!address) return null;

  const key = getKakaoKey();

  // Build candidate queries from most specific to least
  const simplified = simplifyAddress(address);
  const roadFull = extractRoadAddress(address);
  const roadBase = extractRoadAddressBase(address);
  const seen = new Set<string>();
  const candidates: string[] = [];
  for (const c of [simplified, roadFull, roadBase]) {
    if (c && !seen.has(c)) { seen.add(c); candidates.push(c); }
  }

  for (const query of candidates) {
    for (let attempt = 1; attempt <= RETRY_LIMIT; attempt++) {
      try {
        const result = await searchAddress(query, key);
        if (result) return result;
        break; // No results — try next candidate
      } catch (err) {
        if (err instanceof Error && err.message === "RATE_LIMITED") {
          await sleep(1000 * attempt);
          continue;
        }
        if (attempt === RETRY_LIMIT) break;
        await sleep(300 * attempt);
      }
    }
  }

  // Fallback: keyword search with simplified address
  try {
    const result = await searchKeyword(simplified, key);
    if (result) return result;
  } catch {
    // ignore
  }

  return null;
}

/**
 * Simplify address by progressively removing detail parts.
 * Korean childcare addresses often include apartment unit info like:
 *   "부산광역시 강서구 명지오션시티10로 17 108-103(명지동, 퀸덤1차)"
 * Kakao's address API needs just the road address part.
 */
function simplifyAddress(address: string): string {
  let clean = address;

  // 1. Remove parenthetical info: (동명, 아파트명) or (동명)
  clean = clean.replace(/\s*\([^)]*\)\s*/g, " ");

  // 2. Remove unit/dong/ho numbers after the main address number
  //    e.g. "17 108-103" → "17", "80 116-101" → "80"
  //    Pattern: main road number, then space + apartment unit pattern
  clean = clean.replace(/(\d+(?:-\d+)?)\s+\d+[-동호층]\S*/g, "$1");
  // Also catch "305-103" style after the road address
  clean = clean.replace(/\s+\d{2,4}[-]\d{2,4}\s*$/g, "");
  // And "505동 101호" style
  clean = clean.replace(/\s+\d+동\s*\d*호?\s*/g, " ");

  return clean.replace(/\s+/g, " ").trim();
}

/**
 * Batch geocode addresses with rate limiting.
 * Returns a Map of address → GeocodingResult.
 */
export async function batchGeocode(
  addresses: string[],
  options?: { delayMs?: number; onProgress?: (done: number, total: number) => void },
): Promise<Map<string, GeocodingResult>> {
  const delay = options?.delayMs ?? REQUEST_DELAY_MS;
  const results = new Map<string, GeocodingResult>();

  for (let i = 0; i < addresses.length; i++) {
    const addr = addresses[i];
    const result = await geocodeAddress(addr);
    if (result) {
      results.set(addr, result);
    }
    options?.onProgress?.(i + 1, addresses.length);
    if (i < addresses.length - 1) await sleep(delay);
  }

  return results;
}
