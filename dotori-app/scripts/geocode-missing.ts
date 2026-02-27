/**
 * geocode-missing.ts
 *
 * Finds facilities with missing or invalid coordinates (0,0 or outside Korea)
 * and geocodes them using Kakao Local API.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/geocode-missing.ts
 *   npx tsx --env-file=.env.local scripts/geocode-missing.ts --limit 100
 *   npx tsx --env-file=.env.local scripts/geocode-missing.ts --dry-run
 */

import mongoose from "mongoose";
import { geocodeAddress } from "./lib/kakao-geocoder";
import { log, logError, logWarn, Progress } from "./lib/progress";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  let limit = 0; // 0 = no limit
  let dryRun = false;
  let delayMs = 50;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit" && args[i + 1]) limit = parseInt(args[++i], 10);
    else if (args[i] === "--dry-run") dryRun = true;
    else if (args[i] === "--delay" && args[i + 1]) delayMs = parseInt(args[++i], 10);
  }

  return { limit, dryRun, delayMs };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { limit, dryRun, delayMs } = parseArgs();

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI 환경변수를 설정해주세요");
    process.exit(1);
  }

  await mongoose.connect(uri, { dbName: "dotori" });
  log("MongoDB connected");

  const db = mongoose.connection.db!;
  const collection = db.collection("facilities");

  // Find facilities with missing/invalid coordinates
  // Invalid = [0,0] or outside Korea bounding box (lat 33-39, lng 124-132)
  const query = {
    $or: [
      { "location.coordinates": [0, 0] },
      { "location.coordinates.0": { $lt: 124 } },
      { "location.coordinates.0": { $gt: 132 } },
      { "location.coordinates.1": { $lt: 33 } },
      { "location.coordinates.1": { $gt: 39 } },
      { "location.coordinates": { $exists: false } },
    ],
  };

  const cursor = collection.find(query, {
    projection: { _id: 1, name: 1, address: 1, "location.coordinates": 1 },
  });

  if (limit > 0) cursor.limit(limit);

  const facilities = await cursor.toArray();
  log(`Found ${facilities.length} facilities with missing/invalid coordinates`);

  if (facilities.length === 0) {
    log("All facilities have valid coordinates!");
    await mongoose.disconnect();
    return;
  }

  if (dryRun) {
    log("DRY RUN — showing first 5:");
    for (const f of facilities.slice(0, 5)) {
      console.log(`  ${f.name} | ${f.address} | coords: ${JSON.stringify(f.location?.coordinates)}`);
    }
    await mongoose.disconnect();
    return;
  }

  const progress = new Progress("Geocoding", facilities.length);
  let success = 0;
  let failed = 0;

  for (let i = 0; i < facilities.length; i++) {
    const f = facilities[i];
    const result = await geocodeAddress(f.address);

    if (result) {
      await collection.updateOne(
        { _id: f._id },
        {
          $set: {
            "location.type": "Point",
            "location.coordinates": [result.lng, result.lat],
          },
        },
      );
      success++;
    } else {
      logWarn(`Could not geocode: "${f.name}" — "${f.address}"`);
      failed++;
    }

    progress.tick();

    // Rate limiting
    if (i < facilities.length - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  progress.done();

  log("=== Geocoding Complete ===");
  log(`  Total:   ${facilities.length}`);
  log(`  Success: ${success}`);
  log(`  Failed:  ${failed}`);

  // Check remaining
  const remaining = await collection.countDocuments(query);
  if (remaining > 0) {
    logWarn(`${remaining} facilities still have invalid coordinates`);
  } else {
    log("All facilities now have valid coordinates!");
  }

  await mongoose.disconnect();
  log("Done.");
}

main().catch((err) => {
  logError(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
