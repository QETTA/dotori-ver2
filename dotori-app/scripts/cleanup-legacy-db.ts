/**
 * cleanup-legacy-db.ts
 * kidsmap DB (레거시) 삭제 스크립트
 * 실행: npx tsx --env-file=.env.local scripts/cleanup-legacy-db.ts
 * --dry-run 플래그로 삭제 없이 목록만 확인 가능
 */
import { MongoClient } from "mongodb";

const isDryRun = process.argv.includes("--dry-run");

async function cleanupLegacyDB() {
	const uri = process.env.MONGODB_URI;
	if (!uri) {
		console.error("❌ MONGODB_URI 환경변수가 없습니다.");
		process.exit(1);
	}

	const client = new MongoClient(uri);
	try {
		await client.connect();
		console.log("✅ MongoDB 연결 완료\n");

		// 1. kidsmap DB 컬렉션 목록 및 도큐먼트 수 확인
		const kidsmap = client.db("kidsmap");
		const collections = await kidsmap.listCollections().toArray();
		console.log(`📦 kidsmap DB에 ${collections.length}개 컬렉션 존재:\n`);

		let totalDocs = 0;
		for (const col of collections) {
			const count = await kidsmap.collection(col.name).countDocuments();
			totalDocs += count;
			const marker = count > 0 ? "📄" : "  ";
			console.log(`  ${marker} ${col.name}: ${count.toLocaleString()} docs`);
		}
		console.log(`\n  합계: ${totalDocs.toLocaleString()} docs\n`);

		// 2. dotori DB 확인 (앱 사용 DB)
		const dotori = client.db("dotori");
		const dotoriCols = await dotori.listCollections().toArray();
		console.log(`✅ dotori DB (앱 사용): ${dotoriCols.length}개 컬렉션`);
		const facCount = await dotori.collection("facilities").countDocuments();
		console.log(`   └─ facilities: ${facCount.toLocaleString()} docs\n`);

		if (isDryRun) {
			console.log("🔍 DRY RUN 모드 — 실제 삭제 없이 종료");
			console.log("   실제 삭제하려면 --dry-run 없이 실행하세요.");
			return;
		}

		// 3. kidsmap DB 삭제
		console.log("⚠️  kidsmap DB 전체를 삭제합니다...");
		await kidsmap.dropDatabase();
		console.log("✅ kidsmap DB 삭제 완료");

		// 4. 삭제 확인
		const adminDb = client.db("admin");
		const dbList = await adminDb.admin().listDatabases();
		const remaining = dbList.databases.map((d: { name: string }) => d.name);
		console.log(`\n남은 DB 목록: ${remaining.join(", ")}`);

	} finally {
		await client.close();
	}
}

cleanupLegacyDB().catch((e) => {
	console.error("❌ 실패:", e.message);
	process.exit(1);
});
