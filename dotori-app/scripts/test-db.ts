import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.log("❌ MONGODB_URI 환경변수 없음");
  process.exit(1);
}
console.log("URI:", uri.replace(/:([^@]+)@/, ":****@"));

async function main() {
  try {
    await mongoose.connect(uri!, {
      dbName: "dotori",
      serverSelectionTimeoutMS: 10000,
    });
    console.log("✅ MongoDB Atlas 연결 성공");
    console.log("DB:", mongoose.connection.db!.databaseName);

    const collections = await mongoose.connection.db!
      .listCollections()
      .toArray();
    console.log(`\n컬렉션 (${collections.length}개):`);

    for (const col of collections) {
      const count = await mongoose.connection.db!
        .collection(col.name)
        .countDocuments();
      console.log(`  ${col.name}: ${count}건`);
    }

    // Check key indexes
    console.log("\n인덱스 확인:");
    for (const name of ["facilities", "users", "waitlists", "alerts", "posts", "chathistories"]) {
      try {
        const indexes = await mongoose.connection.db!
          .collection(name)
          .indexes();
        console.log(`  ${name}: ${indexes.length}개 인덱스`);
      } catch {
        console.log(`  ${name}: 컬렉션 없음`);
      }
    }

    await mongoose.disconnect();
    console.log("\n✅ DB 연결 테스트 완료");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.log("❌ MongoDB 연결 실패:", message);
    process.exit(1);
  }
}

main();
