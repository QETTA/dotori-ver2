/**
 * Childcare facility data loader — multi-source.
 *
 * Sources:
 * 1. CSV:  Download from data.go.kr → parse locally (no API registration)
 * 2. API:  data.go.kr odcloud REST API (requires 활용신청)
 * 3. Seoul Open Data API (data.seoul.go.kr) — 9,500+ Seoul facilities
 *
 * CSV download: https://www.data.go.kr/data/15013108/standard.do
 * Seoul API:    http://openapi.seoul.go.kr:8088/{KEY}/json/ChildCareInfo/{start}/{end}/
 * odcloud API:  https://api.odcloud.kr/api/15013108/v1/uddi:{UDDI}
 */

import { readFileSync } from "fs";
import { log, logError, logWarn } from "./progress";

// ---------------------------------------------------------------------------
// CSV Mode — Primary (no API registration needed)
// ---------------------------------------------------------------------------

/**
 * Parse a CSV file downloaded from data.go.kr.
 * Handles Korean-encoded CSV with header row.
 */
export function parseCSV(
  filePath: string,
  options?: { region?: string },
): Record<string, unknown>[] {
  const raw = readFileSync(filePath, "utf-8");
  const lines = raw.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length < 2) {
    throw new Error(`CSV file has no data rows: ${filePath}`);
  }

  // Parse header
  const headers = parseCSVLine(lines[0]);
  log(`CSV: ${lines.length - 1} rows, ${headers.length} columns`);
  log(`CSV columns: ${headers.slice(0, 10).join(", ")}...`);

  const records: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length * 0.5) continue; // skip malformed rows

    const record: Record<string, unknown> = {};
    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = values[j] ?? "";
    }

    // Filter by region if specified
    if (options?.region) {
      const sido =
        (record["시도"] as string) ||
        (record["시도명"] as string) ||
        "";
      if (sido && !sido.includes(options.region)) continue;
    }

    records.push(record);
  }

  log(
    `CSV: ${records.length} records loaded` +
      (options?.region ? ` (region: ${options.region})` : ""),
  );

  return records;
}

/**
 * Parse a single CSV line, handling quoted fields.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }

  result.push(current.trim());
  return result;
}

// ---------------------------------------------------------------------------
// API Mode — Secondary (requires 활용신청 on data.go.kr)
// ---------------------------------------------------------------------------

const DATASET_ID = "15013108";
const PER_PAGE = 500;
const RETRY_LIMIT = 3;
const RETRY_DELAY_MS = 2000;

export interface OdcloudResponse {
  currentCount: number;
  data: Record<string, unknown>[];
  matchCount: number;
  page: number;
  perPage: number;
  totalCount: number;
}

function getApiKey(): string {
  const key = process.env.PUBLIC_DATA_API_KEY || process.env.DATA_GO_KR_KEY;
  if (!key) {
    throw new Error(
      "PUBLIC_DATA_API_KEY 또는 DATA_GO_KR_KEY 환경변수를 설정해주세요",
    );
  }
  return key;
}

function getApiEndpoint(): string {
  const uddi = process.env.DATA_GO_KR_UDDI;
  if (!uddi) {
    throw new Error(
      "DATA_GO_KR_UDDI 환경변수를 설정해주세요.\n" +
        "  1. https://www.data.go.kr/data/15013108/standard.do 에서 활용신청\n" +
        "  2. 승인 후 마이페이지 > 활용 목록에서 UDDI 확인\n" +
        "  3. .env.local에 DATA_GO_KR_UDDI=uddi:xxxx 추가",
    );
  }
  return `https://api.odcloud.kr/api/${DATASET_ID}/v1/${uddi}`;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch a single page from the odcloud API.
 */
export async function fetchPage(
  page: number,
  options?: { region?: string; perPage?: number },
): Promise<OdcloudResponse> {
  const apiKey = getApiKey();
  const baseUrl = getApiEndpoint();
  const perPage = options?.perPage ?? PER_PAGE;

  const params = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
    serviceKey: apiKey,
  });

  if (options?.region) {
    params.set("cond[시도::EQ]", options.region);
  }

  const url = `${baseUrl}?${params.toString()}`;

  for (let attempt = 1; attempt <= RETRY_LIMIT; attempt++) {
    try {
      const res = await fetch(url);

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
      }

      const json = (await res.json()) as OdcloudResponse;
      return json;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt < RETRY_LIMIT) {
        logError(`Page ${page} attempt ${attempt} failed: ${msg} — retrying...`);
        await sleep(RETRY_DELAY_MS * attempt);
      } else {
        throw new Error(
          `Page ${page} failed after ${RETRY_LIMIT} attempts: ${msg}`,
        );
      }
    }
  }

  throw new Error("fetchPage: unreachable");
}

/**
 * Fetch all records via API, paginating automatically.
 * Yields arrays of raw records per page.
 */
export async function* fetchAll(options?: {
  region?: string;
  delayMs?: number;
}): AsyncGenerator<Record<string, unknown>[], void, unknown> {
  const first = await fetchPage(1, { region: options?.region });
  const totalCount = first.matchCount || first.totalCount;
  const totalPages = Math.ceil(totalCount / PER_PAGE);

  log(
    `data.go.kr API: ${totalCount.toLocaleString()} records, ${totalPages} pages` +
      (options?.region ? ` (region: ${options.region})` : ""),
  );

  yield first.data;

  for (let page = 2; page <= totalPages; page++) {
    if (options?.delayMs) await sleep(options.delayMs);
    const res = await fetchPage(page, { region: options?.region });
    yield res.data;
  }
}

// ---------------------------------------------------------------------------
// Seoul Open Data API (data.seoul.go.kr)
// ---------------------------------------------------------------------------

const SEOUL_API_BASE = "https://openapi.seoul.go.kr:8088";
const SEOUL_BATCH_SIZE = 1000;

function getSeoulApiKey(): string {
  const key = process.env.SEOUL_OPENDATA_API_KEY;
  if (!key) {
    throw new Error(
      "SEOUL_OPENDATA_API_KEY 환경변수를 설정해주세요.\n" +
        "  1. https://data.seoul.go.kr 에서 회원가입\n" +
        "  2. 마이페이지 > 인증키 발급\n" +
        "  3. .env.local에 SEOUL_OPENDATA_API_KEY=xxxx 추가\n" +
        "  (테스트: SEOUL_OPENDATA_API_KEY=sample 로 5건 테스트 가능)",
    );
  }
  return key;
}

interface SeoulApiResponse {
  ChildCareInfo: {
    list_total_count: number;
    RESULT: { CODE: string; MESSAGE: string };
    row: Record<string, unknown>[];
  };
}

/**
 * Fetch childcare facilities from Seoul Open Data API.
 * Yields batches of raw records for streaming processing.
 */
// ---------------------------------------------------------------------------
// National Standard Data (data.go.kr JSON API — no auth required)
// ---------------------------------------------------------------------------

const NATIONAL_API_BASE = "https://www.data.go.kr/download/standard.json";
const NATIONAL_PK = "15013108";
const NATIONAL_TABLE = "tn_pubr_public_child_house_svc";
const NATIONAL_PER_PAGE = 10000;
const NATIONAL_COLUMNS = [
  "CHILD_HOUSE_NM",
  "CTPRVN_NM",
  "SIGNGU_NM",
  "CHILD_HOUSE_TYPE",
  "PSNCPA",
  "NRTR_SKLSTF_CO",
  "RDNMADR",
  "CHILD_HOUSE_TELEPHONE_NUMBER",
  "PLAYGROUND_CO",
  "CCTV_CO",
  "ATNDSKL_VHCLE_YN",
  "HOMEPAGE_URL",
  "REFERENCE_DATE",
];

/**
 * Fetch the total record count from data.go.kr column metadata.
 */
async function getNationalTotalCount(): Promise<number> {
  const res = await fetch(
    `https://www.data.go.kr/download/columList.json?pk=${NATIONAL_PK}&ext=CSV`,
    { headers: { Referer: `https://www.data.go.kr/data/${NATIONAL_PK}/standard.do` } },
  );
  if (!res.ok) throw new Error(`data.go.kr metadata: HTTP ${res.status}`);
  const json = await res.json();
  return json.totalCount ?? 37855;
}

/**
 * Fetch national childcare facility data from data.go.kr standard data API.
 * No authentication required. Yields batches of raw records.
 */
export async function* fetchNational(options?: {
  region?: string;
  delayMs?: number;
}): AsyncGenerator<Record<string, unknown>[], void, unknown> {
  const totalCount = await getNationalTotalCount();
  const totalPages = Math.ceil(totalCount / NATIONAL_PER_PAGE);

  log(
    `data.go.kr National: ${totalCount.toLocaleString()} records, ${totalPages} pages` +
      (options?.region ? ` (will filter: ${options.region})` : ""),
  );

  for (let page = 1; page <= totalPages; page++) {
    if (page > 1 && options?.delayMs) await sleep(options.delayMs);

    const params = new URLSearchParams({
      publicDataPk: NATIONAL_PK,
      perPage: String(NATIONAL_PER_PAGE),
      page: String(page),
      svcTableNm: NATIONAL_TABLE,
      totalCount: String(totalCount),
    });
    for (const col of NATIONAL_COLUMNS) {
      params.append("colNmList", col);
    }

    const url = `${NATIONAL_API_BASE}?${params.toString()}`;

    for (let attempt = 1; attempt <= RETRY_LIMIT; attempt++) {
      try {
        const res = await fetch(url, {
          headers: {
            Referer: `https://www.data.go.kr/data/${NATIONAL_PK}/standard.do`,
            "User-Agent": "Mozilla/5.0 (compatible; DotoriSync/1.0)",
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const text = await res.text();
        if (!text.trim()) {
          logWarn(`Page ${page}: empty response, skipping`);
          break;
        }

        const records = JSON.parse(text) as Record<string, unknown>[];

        // Filter by region if specified
        let filtered = records;
        if (options?.region) {
          filtered = records.filter((r) =>
            String(r.CTPRVN_NM || "").includes(options.region!),
          );
        }

        log(`  Page ${page}/${totalPages}: ${records.length} records` +
          (options?.region ? ` (${filtered.length} after filter)` : ""));

        yield filtered;
        break;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (attempt < RETRY_LIMIT) {
          logError(`Page ${page} attempt ${attempt} failed: ${msg} — retrying...`);
          await sleep(RETRY_DELAY_MS * attempt);
        } else {
          logError(`Page ${page} failed after ${RETRY_LIMIT} attempts: ${msg}`);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Seoul Open Data API (data.seoul.go.kr)
// ---------------------------------------------------------------------------

export async function* fetchSeoul(options?: {
  delayMs?: number;
  sigungu?: string;
}): AsyncGenerator<Record<string, unknown>[], void, unknown> {
  const key = getSeoulApiKey();
  const isSample = key === "sample";

  // First fetch to get total count
  const firstUrl = `${SEOUL_API_BASE}/${key}/json/ChildCareInfo/1/${isSample ? 5 : SEOUL_BATCH_SIZE}/`;
  const firstRes = await fetch(firstUrl);
  if (!firstRes.ok) throw new Error(`Seoul API HTTP ${firstRes.status}`);

  const firstJson = (await firstRes.json()) as SeoulApiResponse;
  if (firstJson.ChildCareInfo.RESULT.CODE !== "INFO-000") {
    throw new Error(
      `Seoul API error: ${firstJson.ChildCareInfo.RESULT.MESSAGE}`,
    );
  }

  const totalCount = firstJson.ChildCareInfo.list_total_count;
  log(
    `Seoul API: ${totalCount.toLocaleString()} total facilities` +
      (isSample ? " (sample key — 5 records max)" : ""),
  );

  let rows = firstJson.ChildCareInfo.row;
  if (options?.sigungu) {
    rows = rows.filter((r) => String(r.SIGUNNAME || "").includes(options.sigungu!));
  }
  yield rows;

  if (isSample) return; // sample key only returns first batch

  const totalBatches = Math.ceil(totalCount / SEOUL_BATCH_SIZE);
  for (let batch = 2; batch <= totalBatches; batch++) {
    if (options?.delayMs) await sleep(options.delayMs);

    const start = (batch - 1) * SEOUL_BATCH_SIZE + 1;
    const end = Math.min(batch * SEOUL_BATCH_SIZE, totalCount);
    const url = `${SEOUL_API_BASE}/${key}/json/ChildCareInfo/${start}/${end}/`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        logError(`Seoul API batch ${batch}: HTTP ${res.status}`);
        continue;
      }
      const json = (await res.json()) as SeoulApiResponse;
      let batchRows = json.ChildCareInfo.row;
      if (options?.sigungu) {
        batchRows = batchRows.filter((r) =>
          String(r.SIGUNNAME || "").includes(options.sigungu!),
        );
      }
      yield batchRows;
    } catch (err) {
      logError(
        `Seoul API batch ${batch} failed: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}
