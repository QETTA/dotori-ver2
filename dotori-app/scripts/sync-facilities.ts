/**
 * sync-facilities.ts
 *
 * Syncs real childcare facility data into MongoDB Atlas.
 *
 * Usage (National — 37,000+ facilities, no auth required):
 *   npx tsx --env-file=.env.local scripts/sync-facilities.ts --national
 *   npx tsx --env-file=.env.local scripts/sync-facilities.ts --national --region 서울특별시
 *
 * Usage (Seoul API — fastest to set up):
 *   npx tsx --env-file=.env.local scripts/sync-facilities.ts --seoul
 *   npx tsx --env-file=.env.local scripts/sync-facilities.ts --seoul --dry-run
 *
 * Usage (CSV — national data, no API registration):
 *   1. Download CSV from https://www.data.go.kr/data/15013108/standard.do
 *   2. Save to dotori-app/data/
 *   3. npx tsx --env-file=.env.local scripts/sync-facilities.ts --csv data/전국어린이집표준데이터.csv
 *
 * Usage (data.go.kr API — requires 활용신청):
 *   npx tsx --env-file=.env.local scripts/sync-facilities.ts --api --region 서울특별시
 *
 * Options:
 *   --national         data.go.kr standard data (37,000+ facilities, no auth)
 *   --seoul            Seoul Open Data API (9,500+ facilities)
 *   --csv <path>       CSV file from data.go.kr
 *   --api              data.go.kr odcloud API
 *   --region <name>    Filter by 시도 (National/CSV/API modes)
 *   --sigungu <name>   Filter by 시군구 (Seoul mode)
 *   --dry-run          Preview without database writes
 *   --clean            Delete old seed data before inserting
 */

import mongoose from "mongoose";
import { existsSync } from "fs";
import { fetchAll, fetchNational, fetchSeoul, parseCSV } from "./lib/data-go-kr";
import { hasValidCoords, mapRecord, type MappedFacility } from "./lib/field-mapper";
import { log, logError, logWarn, Progress } from "./lib/progress";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  let csvPath: string | undefined;
  let useApi = false;
  let useSeoul = false;
  let useNational = false;
  let region: string | undefined;
  let sigungu: string | undefined;
  let dryRun = false;
  let clean = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--csv" && args[i + 1]) csvPath = args[++i];
    else if (args[i] === "--api") useApi = true;
    else if (args[i] === "--seoul") useSeoul = true;
    else if (args[i] === "--national") useNational = true;
    else if (args[i] === "--region" && args[i + 1]) region = args[++i];
    else if (args[i] === "--sigungu" && args[i + 1]) sigungu = args[++i];
    else if (args[i] === "--dry-run") dryRun = true;
    else if (args[i] === "--clean") clean = true;
  }

  return { csvPath, useApi, useSeoul, useNational, region, sigungu, dryRun, clean };
}

// ---------------------------------------------------------------------------
// MongoDB
// ---------------------------------------------------------------------------

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI 환경변수를 설정해주세요");
    process.exit(1);
  }
  await mongoose.connect(uri, { dbName: "dotori" });
  log("MongoDB connected");
  return mongoose.connection.db!;
}

// ---------------------------------------------------------------------------
// Main sync
// ---------------------------------------------------------------------------

async function main() {
  const { csvPath, useApi, useSeoul, useNational, region, sigungu, dryRun, clean } =
    parseArgs();
  const startTime = Date.now();

  log("=== Dotori Facility Sync ===");

  // Determine mode
  if (!csvPath && !useApi && !useSeoul && !useNational) {
    console.error(
      "사용법:\n" +
        "  National: npx tsx --env-file=.env.local scripts/sync-facilities.ts --national\n" +
        "  Seoul:    npx tsx --env-file=.env.local scripts/sync-facilities.ts --seoul\n" +
        "  CSV:      npx tsx --env-file=.env.local scripts/sync-facilities.ts --csv data/파일명.csv\n" +
        "  API:      npx tsx --env-file=.env.local scripts/sync-facilities.ts --api\n\n" +
        "National: data.go.kr 전국어린이집표준데이터 (37,000+ facilities, no auth)\n" +
        "Seoul API 키 발급: https://data.seoul.go.kr (회원가입 후 인증키 발급)\n" +
        "CSV 다운로드: https://www.data.go.kr/data/15013108/standard.do",
    );
    process.exit(1);
  }

  const mode = useNational ? "National (data.go.kr)" : useSeoul ? "Seoul API" : csvPath ? "CSV" : "odcloud API";
  log(`Mode: ${mode}`);
  if (region) log(`Region: ${region}`);
  if (sigungu) log(`Sigungu: ${sigungu}`);
  if (dryRun) log("DRY RUN — no database writes");

  // 1. Connect to MongoDB
  const db = await connectDB();
  const collection = db.collection("facilities");

  // 2. Clean old seed data if requested
  if (clean && !dryRun) {
    const deleted = await collection.deleteMany({ dataSource: "seed" });
    log(`Cleaned ${deleted.deletedCount} seed records`);
  }

  // 3. Load & map records
  log("Loading data...");

  const stats = {
    fetched: 0,
    mapped: 0,
    skipped: 0,
    noCoords: 0,
    upserted: 0,
    modified: 0,
    errors: 0,
  };

  const allMapped: MappedFacility[] = [];

  if (useNational) {
    // National data.go.kr standard data — no auth required
    for await (const batch of fetchNational({ region, delayMs: 300 })) {
      stats.fetched += batch.length;
      for (const raw of batch) {
        const mapped = mapRecord(raw);
        if (!mapped) { stats.skipped++; continue; }
        if (!hasValidCoords(mapped)) stats.noCoords++;
        allMapped.push(mapped);
        stats.mapped++;
      }
    }
  } else if (useSeoul) {
    // Seoul API — streaming
    for await (const batch of fetchSeoul({ sigungu, delayMs: 100 })) {
      stats.fetched += batch.length;
      for (const raw of batch) {
        const mapped = mapRecord(raw);
        if (!mapped) { stats.skipped++; continue; }
        if (!hasValidCoords(mapped)) stats.noCoords++;
        allMapped.push(mapped);
        stats.mapped++;
      }
    }
  } else if (csvPath) {
    // CSV
    if (!existsSync(csvPath)) {
      throw new Error(
        `CSV 파일을 찾을 수 없습니다: ${csvPath}\n` +
          "  https://www.data.go.kr/data/15013108/standard.do 에서 다운로드",
      );
    }
    const rawRecords = parseCSV(csvPath, { region });
    stats.fetched = rawRecords.length;
    for (const raw of rawRecords) {
      const mapped = mapRecord(raw);
      if (!mapped) { stats.skipped++; continue; }
      if (!hasValidCoords(mapped)) stats.noCoords++;
      allMapped.push(mapped);
      stats.mapped++;
    }
  } else {
    // odcloud API
    for await (const batch of fetchAll({ region, delayMs: 200 })) {
      stats.fetched += batch.length;
      for (const raw of batch) {
        const mapped = mapRecord(raw);
        if (!mapped) { stats.skipped++; continue; }
        if (!hasValidCoords(mapped)) stats.noCoords++;
        allMapped.push(mapped);
        stats.mapped++;
      }
    }
  }

  log(
    `Fetched: ${stats.fetched} | Mapped: ${stats.mapped} | Skipped: ${stats.skipped} | No coords: ${stats.noCoords}`,
  );

  if (allMapped.length === 0) {
    logWarn("No facilities to sync. Check data source or filters.");
    await mongoose.disconnect();
    return;
  }

  if (dryRun) {
    log("DRY RUN complete. Sample record:");
    console.log(JSON.stringify(allMapped[0], null, 2));
    log(`\nSamples (first 5):`);
    for (const f of allMapped.slice(0, 5)) {
      console.log(
        `  ${f.name} | ${f.type} | ${f.region.sido} ${f.region.sigungu} | coords: [${f.location.coordinates}]`,
      );
    }
    await mongoose.disconnect();
    return;
  }

  // 4. Upsert to MongoDB
  log(`Upserting ${allMapped.length} facilities...`);
  const progress = new Progress("Upsert", allMapped.length);

  const BATCH_SIZE = 500;
  for (let i = 0; i < allMapped.length; i += BATCH_SIZE) {
    const batch = allMapped.slice(i, i + BATCH_SIZE);

    const ops = batch.map((f) => ({
      updateOne: {
        filter: { name: f.name, address: f.address },
        update: { $set: { ...f, lastSyncedAt: new Date() } },
        upsert: true,
      },
    }));

    try {
      const result = await collection.bulkWrite(ops, { ordered: false });
      stats.upserted += result.upsertedCount;
      stats.modified += result.modifiedCount;
    } catch (err) {
      stats.errors++;
      logError(
        `Bulk write error: ${err instanceof Error ? err.message : err}`,
      );
    }

    progress.tick(batch.length);
  }

  progress.done();

  // 5. Ensure indexes
  log("Ensuring indexes...");
  await collection.createIndex({ location: "2dsphere" }).catch(() => {});
  await collection.createIndex({ "region.sido": 1, "region.sigungu": 1 });
  await collection.createIndex({ status: 1, type: 1 });
  await collection.createIndex({ name: "text", address: "text" }).catch(() => {});
  await collection.createIndex({ name: 1, address: 1 }, { unique: true }).catch(() => {});

  // 6. Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const totalInDb = await collection.countDocuments();

  log("=== Sync Complete ===");
  log(`  Mode:      ${mode}`);
  log(`  Fetched:   ${stats.fetched}`);
  log(`  Mapped:    ${stats.mapped}`);
  log(`  Skipped:   ${stats.skipped} (closed/invalid)`);
  log(`  No coords: ${stats.noCoords}`);
  log(`  Upserted:  ${stats.upserted}`);
  log(`  Modified:  ${stats.modified}`);
  log(`  Errors:    ${stats.errors}`);
  log(`  Total DB:  ${totalInDb}`);
  log(`  Duration:  ${elapsed}s`);

  if (stats.noCoords > 0) {
    logWarn(
      `${stats.noCoords} facilities missing coords. Run:\n` +
        `  npx tsx --env-file=.env.local scripts/geocode-missing.ts`,
    );
  }

  await mongoose.disconnect();
  log("Done.");
}

main().catch((err) => {
  logError(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
