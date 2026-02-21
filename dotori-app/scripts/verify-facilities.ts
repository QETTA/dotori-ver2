/**
 * verify-facilities.ts
 *
 * Data quality verification for the facilities collection.
 * Checks completeness, coordinate validity, type distribution, and more.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/verify-facilities.ts
 */

import mongoose from "mongoose";
import { log, logError, logWarn } from "./lib/progress";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI 환경변수를 설정해주세요");
    process.exit(1);
  }

  await mongoose.connect(uri, { dbName: "dotori" });
  log("MongoDB connected");

  const db = mongoose.connection.db!;
  const collection = db.collection("facilities");

  const total = await collection.countDocuments();
  log(`\n=== Facility Data Quality Report ===`);
  log(`Total facilities: ${total.toLocaleString()}`);

  if (total === 0) {
    logWarn("No facilities found. Run sync-facilities.ts first.");
    await mongoose.disconnect();
    return;
  }

  // -----------------------------------------------------------------------
  // 1. Data source distribution
  // -----------------------------------------------------------------------
  const sources = await collection
    .aggregate([
      { $group: { _id: "$dataSource", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])
    .toArray();

  log("\n--- Data Sources ---");
  for (const s of sources) {
    const pct = ((s.count / total) * 100).toFixed(1);
    log(`  ${s._id || "(none)"}: ${s.count.toLocaleString()} (${pct}%)`);
  }

  // -----------------------------------------------------------------------
  // 2. Type distribution
  // -----------------------------------------------------------------------
  const types = await collection
    .aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])
    .toArray();

  log("\n--- Facility Types ---");
  for (const t of types) {
    const pct = ((t.count / total) * 100).toFixed(1);
    log(`  ${t._id || "(none)"}: ${t.count.toLocaleString()} (${pct}%)`);
  }

  // -----------------------------------------------------------------------
  // 3. Status distribution
  // -----------------------------------------------------------------------
  const statuses = await collection
    .aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])
    .toArray();

  log("\n--- Status ---");
  for (const s of statuses) {
    const pct = ((s.count / total) * 100).toFixed(1);
    log(`  ${s._id || "(none)"}: ${s.count.toLocaleString()} (${pct}%)`);
  }

  // -----------------------------------------------------------------------
  // 4. Region (시도) distribution
  // -----------------------------------------------------------------------
  const regions = await collection
    .aggregate([
      { $group: { _id: "$region.sido", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])
    .toArray();

  log("\n--- Regions (시도) ---");
  for (const r of regions) {
    const pct = ((r.count / total) * 100).toFixed(1);
    log(`  ${r._id || "(none)"}: ${r.count.toLocaleString()} (${pct}%)`);
  }

  // -----------------------------------------------------------------------
  // 5. Coordinate validity
  // -----------------------------------------------------------------------
  const invalidCoords = await collection.countDocuments({
    $or: [
      { "location.coordinates": [0, 0] },
      { "location.coordinates.0": { $lt: 124 } },
      { "location.coordinates.0": { $gt: 132 } },
      { "location.coordinates.1": { $lt: 33 } },
      { "location.coordinates.1": { $gt: 39 } },
      { "location.coordinates": { $exists: false } },
    ],
  });

  const validCoords = total - invalidCoords;
  const coordPct = ((validCoords / total) * 100).toFixed(1);

  log("\n--- Coordinates ---");
  log(`  Valid:   ${validCoords.toLocaleString()} (${coordPct}%)`);
  log(`  Invalid: ${invalidCoords.toLocaleString()}`);
  if (invalidCoords > 0) {
    logWarn(`Run geocode-missing.ts to fix ${invalidCoords} missing coordinates`);
  }

  // -----------------------------------------------------------------------
  // 6. Required field completeness
  // -----------------------------------------------------------------------
  const checks = [
    { field: "name", label: "이름" },
    { field: "address", label: "주소" },
    { field: "phone", label: "전화번호" },
    { field: "type", label: "유형" },
    { field: "region.sido", label: "시도" },
    { field: "region.sigungu", label: "시군구" },
    { field: "region.dong", label: "동" },
  ];

  log("\n--- Field Completeness ---");
  for (const { field, label } of checks) {
    const missing = await collection.countDocuments({
      $or: [
        { [field]: { $exists: false } },
        { [field]: "" },
        { [field]: null },
      ],
    });
    const present = total - missing;
    const pct = ((present / total) * 100).toFixed(1);
    const status = missing === 0 ? "OK" : missing < total * 0.05 ? "WARN" : "FAIL";
    log(
      `  ${label} (${field}): ${present.toLocaleString()}/${total.toLocaleString()} (${pct}%) [${status}]`,
    );
  }

  // -----------------------------------------------------------------------
  // 7. Enrichment coverage (Kakao Place)
  // -----------------------------------------------------------------------
  const withKakaoUrl = await collection.countDocuments({
    kakaoPlaceUrl: { $exists: true, $ne: "" },
  });
  const attemptedKakao = await collection.countDocuments({
    kakaoPlaceUrl: { $exists: true },
  });

  log("\n--- Kakao Place Enrichment ---");
  log(
    `  With URL: ${withKakaoUrl.toLocaleString()}/${total.toLocaleString()} (${((withKakaoUrl / total) * 100).toFixed(1)}%)`,
  );
  log(
    `  Attempted: ${attemptedKakao.toLocaleString()}/${total.toLocaleString()} (${((attemptedKakao / total) * 100).toFixed(1)}%)`,
  );
  if (attemptedKakao > 0) {
    log(
      `  Match rate: ${((withKakaoUrl / attemptedKakao) * 100).toFixed(1)}%`,
    );
  }

  // -----------------------------------------------------------------------
  // 8. Capacity sanity check (was 7)
  // -----------------------------------------------------------------------
  const zeroCapacity = await collection.countDocuments({
    "capacity.total": { $lte: 0 },
  });
  const overCapacity = await collection.countDocuments({
    $expr: { $gt: ["$capacity.current", "$capacity.total"] },
  });

  log("\n--- Capacity ---");
  log(`  Zero capacity: ${zeroCapacity}`);
  log(`  Over capacity (current > total): ${overCapacity}`);

  // -----------------------------------------------------------------------
  // 8. Index check
  // -----------------------------------------------------------------------
  const indexes = await collection.indexes();
  const indexNames = indexes.map((i) => i.name);

  log("\n--- Indexes ---");
  const requiredPatterns = ["2dsphere", "region", "status", "text"];
  for (const pat of requiredPatterns) {
    const found = indexNames.some(
      (n) => n !== undefined && (n.includes(pat) || JSON.stringify(indexes.find((i) => i.name === n)?.key || {}).includes(pat)),
    );
    log(`  ${pat}: ${found ? "OK" : "MISSING"}`);
  }

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------
  const issues: string[] = [];
  if (invalidCoords > 0)
    issues.push(`${invalidCoords} invalid coordinates`);
  if (zeroCapacity > 0) issues.push(`${zeroCapacity} zero-capacity`);

  log("\n=== Summary ===");
  if (issues.length === 0) {
    log("All checks passed!");
  } else {
    logWarn(`Issues found: ${issues.join(", ")}`);
  }

  await mongoose.disconnect();
  log("Done.");
}

main().catch((err) => {
  logError(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
