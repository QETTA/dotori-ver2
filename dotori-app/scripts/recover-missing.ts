/**
 * Recover the ~19,335 facilities missing from our DB because they have no RDNMADR
 * in the data.go.kr standard dataset.
 *
 * Strategy:
 * 1. Fetch all records from standard.json
 * 2. Identify records with no RDNMADR but WITH name + sido + sigungu
 * 3. Check which are already in MongoDB (by name)
 * 4. For missing ones, use Kakao keyword search to find address + coordinates
 * 5. Upsert into MongoDB
 */

import mongoose from "mongoose";

const NATIONAL_API_BASE = "https://www.data.go.kr/download/standard.json";
const NATIONAL_PK = "15013108";
const NATIONAL_TABLE = "tn_pubr_public_child_house_svc";

// Columns we need - keep it minimal to avoid API issues
const COLUMNS = [
  "CHILD_HOUSE_NM", "CTPRVN_NM", "SIGNGU_NM", "CHILD_HOUSE_TYPE",
  "PSNCPA", "RDNMADR", "CHILD_HOUSE_TELEPHONE_NUMBER",
  "PLAYGROUND_CO", "CCTV_CO", "ATNDSKL_VHCLE_YN", "HOMEPAGE_URL",
  "REFERENCE_DATE",
];

const TYPE_MAP: Record<string, string> = {
  국공립: "국공립", "국공립(직장)": "직장", 민간: "민간", 가정: "가정",
  직장: "직장", "직장(국공립)": "직장", 협동: "협동", 사회복지: "사회복지",
  사회복지법인: "사회복지", 법인: "사회복지", "법인·단체등": "사회복지",
  "법인·단체": "사회복지", 부모협동: "협동",
};

const KAKAO_KEYWORD_EP = "https://dapi.kakao.com/v2/local/search/keyword.json";

interface KakaoResult {
  address: string;
  lat: number;
  lng: number;
}

// ---------------------------------------------------------------------------
// Fetch from data.go.kr
// ---------------------------------------------------------------------------

async function fetchPage(page: number): Promise<Record<string, unknown>[]> {
  const params = new URLSearchParams({
    publicDataPk: NATIONAL_PK,
    perPage: "10000",
    page: String(page),
    svcTableNm: NATIONAL_TABLE,
    totalCount: "37855",
  });
  for (const col of COLUMNS) params.append("colNmList", col);

  const res = await fetch(`${NATIONAL_API_BASE}?${params.toString()}`, {
    headers: { Referer: `https://www.data.go.kr/data/${NATIONAL_PK}/standard.do` },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} page ${page}`);
  const text = await res.text();
  if (!text.trim()) return [];
  return JSON.parse(text) as Record<string, unknown>[];
}

// ---------------------------------------------------------------------------
// Kakao keyword search
// ---------------------------------------------------------------------------

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function kakaoKeywordSearch(
  query: string,
  kakaoKey: string,
): Promise<KakaoResult | null> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const params = new URLSearchParams({ query, size: "1" });
      const res = await fetch(`${KAKAO_KEYWORD_EP}?${params.toString()}`, {
        headers: { Authorization: `KakaoAK ${kakaoKey}` },
      });

      if (res.status === 429) {
        await sleep(2000 * attempt);
        continue;
      }
      if (!res.ok) return null;

      const json = await res.json() as {
        documents: Array<{
          place_name: string;
          address_name: string;
          road_address_name: string;
          x: string;
          y: string;
        }>;
      };

      if (json.documents.length === 0) return null;
      const doc = json.documents[0];
      const lat = parseFloat(doc.y);
      const lng = parseFloat(doc.x);
      if (lat < 33 || lat > 39 || lng < 124 || lng > 132) return null;

      return {
        address: doc.road_address_name || doc.address_name || "",
        lat,
        lng,
      };
    } catch (err) {
      if (err instanceof Error && err.message === "RATE_LIMITED") {
        await sleep(2000 * attempt);
        continue;
      }
      if (attempt === 3) return null;
      await sleep(500);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// MongoDB
// ---------------------------------------------------------------------------

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(uri, { dbName: "dotori" });
  console.log("[DB] Connected");
}

function getFacilityCollection() {
  return mongoose.connection.db.collection("facilities");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const kakaoKey = process.env.KAKAO_REST_API_KEY;
  if (!kakaoKey) throw new Error("KAKAO_REST_API_KEY not set");

  await connectDB();
  const col = getFacilityCollection();

  // Phase 1: Fetch all records and find those missing RDNMADR
  console.log("\n=== Phase 1: Fetch all records from data.go.kr ===\n");

  interface MissingRecord {
    name: string;
    sido: string;
    sigungu: string;
    type: string;
    phone: string;
    capacity: number;
    features: string[];
  }

  const missingRecords: MissingRecord[] = [];
  let totalRecords = 0;
  let withAddress = 0;

  for (let page = 1; page <= 4; page++) {
    console.log(`Fetching page ${page}/4...`);
    const records = await fetchPage(page);
    console.log(`  → ${records.length} records`);
    totalRecords += records.length;

    for (const r of records) {
      const addr = String(r.RDNMADR || "").trim();
      if (addr) { withAddress++; continue; }

      const name = String(r.CHILD_HOUSE_NM || "").trim();
      const sido = String(r.CTPRVN_NM || "").trim();
      const sigungu = String(r.SIGNGU_NM || "").trim();
      const rawType = String(r.CHILD_HOUSE_TYPE || "").trim();
      const type = TYPE_MAP[rawType] || "";
      const phone = String(r.CHILD_HOUSE_TELEPHONE_NUMBER || "").trim().replace(/[^\d-]/g, "");
      const capacity = Number(r.PSNCPA) || 0;

      if (!name || !sido || !type) continue;

      const features: string[] = [];
      const bus = String(r.ATNDSKL_VHCLE_YN || "").trim();
      if (bus === "Y" || bus === "운영") features.push("통학버스");
      if (Number(r.CCTV_CO) > 0) features.push("CCTV");
      if (Number(r.PLAYGROUND_CO) > 0) features.push("놀이터");

      missingRecords.push({ name, sido, sigungu, type, phone, capacity, features });
    }

    await sleep(300);
  }

  console.log(`\nTotal records: ${totalRecords}`);
  console.log(`With address: ${withAddress}`);
  console.log(`Missing address (with name+sido+type): ${missingRecords.length}`);

  // Phase 2: Check which are already in DB
  console.log("\n=== Phase 2: Check existing in MongoDB ===\n");

  const existingNames = new Set<string>();
  const cursor = col.find({}, { projection: { name: 1 } });
  for await (const doc of cursor) {
    existingNames.add(doc.name);
  }
  console.log(`Existing facilities in DB: ${existingNames.size}`);

  const newRecords = missingRecords.filter(r => !existingNames.has(r.name));
  const alreadyInDB = missingRecords.length - newRecords.length;
  console.log(`Already in DB (by name): ${alreadyInDB}`);
  console.log(`Truly missing: ${newRecords.length}`);

  if (newRecords.length === 0) {
    console.log("\nNo new records to add!");
    await mongoose.disconnect();
    return;
  }

  // Phase 3: Kakao keyword search for address + coordinates
  console.log(`\n=== Phase 3: Geocode ${newRecords.length} facilities via Kakao ===\n`);

  let geocoded = 0;
  let failed = 0;
  let inserted = 0;

  for (let i = 0; i < newRecords.length; i++) {
    const r = newRecords[i];
    const query = r.sigungu
      ? `${r.sido} ${r.sigungu} ${r.name}`
      : `${r.sido} ${r.name}`;

    const result = await kakaoKeywordSearch(query, kakaoKey);

    if (result && result.address) {
      geocoded++;

      // Upsert into MongoDB
      try {
        await col.updateOne(
          { name: r.name, address: result.address },
          {
            $setOnInsert: {
              name: r.name,
              type: r.type,
              status: "available",
              address: result.address,
              region: {
                sido: r.sido,
                sigungu: r.sigungu,
                dong: "",
              },
              location: {
                type: "Point",
                coordinates: [result.lng, result.lat],
              },
              phone: r.phone,
              capacity: { total: r.capacity, current: 0, waiting: 0 },
              features: r.features,
              programs: [],
              rating: 0,
              reviewCount: 0,
              evaluationGrade: null,
              operatingHours: { open: "07:30", close: "19:30", extendedCare: false },
              images: [],
              dataSource: "data.go.kr-national-recovered",
              lastSyncedAt: new Date(),
            },
          },
          { upsert: true },
        );
        inserted++;
      } catch {
        // duplicate or other error, skip
      }
    } else {
      failed++;
    }

    // Progress
    if ((i + 1) % 100 === 0 || i === newRecords.length - 1) {
      const pct = (((i + 1) / newRecords.length) * 100).toFixed(1);
      process.stdout.write(
        `\r  Progress: ${i + 1}/${newRecords.length} (${pct}%) | geocoded: ${geocoded} | failed: ${failed} | inserted: ${inserted}`,
      );
    }

    // Rate limit
    await sleep(50);
  }

  console.log("\n");

  // Phase 4: Summary
  console.log("=== Summary ===");
  console.log(`Total data.go.kr records: ${totalRecords}`);
  console.log(`With RDNMADR: ${withAddress}`);
  console.log(`Missing RDNMADR (valid): ${missingRecords.length}`);
  console.log(`Already in DB: ${alreadyInDB}`);
  console.log(`Truly new: ${newRecords.length}`);
  console.log(`Kakao geocoded: ${geocoded} (${((geocoded / newRecords.length) * 100).toFixed(1)}%)`);
  console.log(`Kakao failed: ${failed}`);
  console.log(`Inserted to DB: ${inserted}`);

  const finalCount = await col.countDocuments();
  console.log(`\nFinal DB count: ${finalCount}`);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
