/**
 * Enrich facility records with Kakao Place URLs and photos.
 *
 * Uses Kakao keyword search to find matching places, then stores:
 * - kakaoPlaceUrl: direct link to Kakao Map listing (has photos, reviews)
 * - kakaoPlaceId: for future API calls
 *
 * Run: npx tsx --env-file=.env.local scripts/enrich-kakao-place.ts [--limit N]
 */

import mongoose from "mongoose";

const KAKAO_KEYWORD_EP = "https://dapi.kakao.com/v2/local/search/keyword.json";

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

interface KakaoDocument {
  id: string;
  place_name: string;
  category_name: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  place_url: string;
  x: string;
  y: string;
}

async function searchKakaoPlace(
  query: string,
  kakaoKey: string,
  x?: string,
  y?: string,
): Promise<KakaoDocument | null> {
  const params = new URLSearchParams({ query, size: "5" });
  if (x && y) {
    params.set("x", x);
    params.set("y", y);
    params.set("radius", "500"); // 500m radius around facility coords
    params.set("sort", "distance");
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${KAKAO_KEYWORD_EP}?${params.toString()}`, {
        headers: { Authorization: `KakaoAK ${kakaoKey}` },
      });

      if (res.status === 429) {
        await sleep(2000 * attempt);
        continue;
      }
      if (!res.ok) return null;

      const json = (await res.json()) as { documents: KakaoDocument[] };
      if (json.documents.length === 0) return null;

      // Find best match — prefer exact name match, then category match
      for (const doc of json.documents) {
        if (
          doc.category_name.includes("어린이집") ||
          doc.category_name.includes("유치원") ||
          doc.category_name.includes("보육")
        ) {
          return doc;
        }
      }

      // Fallback: first result if place_name contains the query name
      const nameCore = query
        .replace(/어린이집|유치원/g, "")
        .trim()
        .split(/\s+/)
        .pop();
      if (nameCore) {
        for (const doc of json.documents) {
          if (doc.place_name.includes(nameCore)) return doc;
        }
      }

      return null;
    } catch {
      if (attempt === 3) return null;
      await sleep(500 * attempt);
    }
  }
  return null;
}

async function main() {
  const kakaoKey = process.env.KAKAO_REST_API_KEY;
  if (!kakaoKey) throw new Error("KAKAO_REST_API_KEY not set");

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(uri, { dbName: "dotori" });
  console.log("[DB] Connected");

  const col = mongoose.connection.db.collection("facilities");

  // Parse --limit flag
  const limitArg = process.argv.find((a) => a.startsWith("--limit"));
  const limit = limitArg ? parseInt(limitArg.split("=")[1] || process.argv[process.argv.indexOf(limitArg) + 1]) : 0;

  // Find facilities that haven't been attempted yet
  // Note: "" means "attempted but not found" — skip those to prevent infinite retry
  const query: Record<string, unknown> = {
    $or: [
      { kakaoPlaceUrl: { $exists: false } },
      { kakaoPlaceUrl: null },
    ],
  };

  const total = await col.countDocuments(query);
  const count = limit > 0 ? Math.min(limit, total) : total;
  console.log(`\nFacilities needing Kakao Place enrichment: ${total}`);
  console.log(`Processing: ${count}\n`);

  const cursor = col.find(query).limit(count);

  let processed = 0;
  let matched = 0;
  let failed = 0;

  for await (const facility of cursor) {
    const name = facility.name || "";
    const sido = facility.region?.sido || "";
    const sigungu = facility.region?.sigungu || "";
    const [lng, lat] = facility.location?.coordinates || [0, 0];

    // Search with coordinates if available (much more accurate)
    const hasCoords = lat >= 33 && lat <= 39 && lng >= 124 && lng <= 132;
    const searchQuery = `${name} 어린이집`;

    const doc = await searchKakaoPlace(
      searchQuery,
      kakaoKey,
      hasCoords ? String(lng) : undefined,
      hasCoords ? String(lat) : undefined,
    );

    if (doc) {
      await col.updateOne(
        { _id: facility._id },
        {
          $set: {
            kakaoPlaceUrl: doc.place_url,
            kakaoPlaceId: doc.id,
            ...(doc.phone && !facility.phone ? { phone: doc.phone } : {}),
          },
        },
      );
      matched++;
    } else {
      // Try broader search without coordinates
      if (hasCoords) {
        const doc2 = await searchKakaoPlace(
          `${sido} ${sigungu} ${name}`,
          kakaoKey,
        );
        if (doc2) {
          await col.updateOne(
            { _id: facility._id },
            {
              $set: {
                kakaoPlaceUrl: doc2.place_url,
                kakaoPlaceId: doc2.id,
              },
            },
          );
          matched++;
        } else {
          // Mark as attempted so we don't retry
          await col.updateOne(
            { _id: facility._id },
            { $set: { kakaoPlaceUrl: "" } },
          );
          failed++;
        }
      } else {
        await col.updateOne(
          { _id: facility._id },
          { $set: { kakaoPlaceUrl: "" } },
        );
        failed++;
      }
    }

    processed++;

    if (processed % 200 === 0 || processed === count) {
      const pct = ((processed / count) * 100).toFixed(1);
      process.stdout.write(
        `\r  Progress: ${processed}/${count} (${pct}%) | matched: ${matched} | failed: ${failed}`,
      );
    }

    await sleep(55); // ~18 req/s, safely under Kakao's 30 req/s limit
  }

  console.log("\n\n=== Kakao Place Enrichment Complete ===");
  console.log(`Processed: ${processed}`);
  console.log(`Matched: ${matched} (${((matched / processed) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${failed}`);

  const withUrl = await col.countDocuments({
    kakaoPlaceUrl: { $exists: true, $ne: "" },
  });
  const totalFacilities = await col.countDocuments();
  console.log(`\nDB: ${withUrl}/${totalFacilities} have Kakao Place URLs (${((withUrl / totalFacilities) * 100).toFixed(1)}%)`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
