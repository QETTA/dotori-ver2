import { chromium } from "@playwright/test";
import fs from "fs";

const VIEWPORT = { width: 375, height: 812 };
const SCALE = 2;
const DIR = "/tmp/dotori-audit-v3";
const BASE = process.env.BASE_URL ?? "http://localhost:3002";
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

type RouteSpec = {
	name: string;
	path: string;
	scrolls: number[];
	waitUntil?: "domcontentloaded" | "load";
};

function toValidFacilityId(value: unknown): string {
	if (typeof value !== "string") return "";
	const trimmed = value.trim();
	return OBJECT_ID_PATTERN.test(trimmed) ? trimmed : "";
}

async function getFacilityId(): Promise<string> {
	try {
		const res = await fetch(`${BASE}/api/facilities?limit=1`);
		if (!res.ok) return "";
		const json = await res.json();
		const first = Array.isArray(json?.data) ? json.data[0] : null;
		if (!first || typeof first !== "object") return "";
		return toValidFacilityId((first as { id?: unknown }).id);
	} catch {
		return "";
	}
}

async function main() {
	fs.mkdirSync(DIR, { recursive: true });

	const facilityId = await getFacilityId();
	const facilityPath = facilityId ? `/facility/${facilityId}` : "/facility/f1";

	const routes: RouteSpec[] = [
		{ name: "home", path: "/", scrolls: [0, 400, 800, 1200] },
		{ name: "explore", path: "/explore", scrolls: [0, 400, 800], waitUntil: "load" },
		{ name: "chat", path: "/chat", scrolls: [0, 400] },
		{ name: "community", path: "/community", scrolls: [0, 400, 800] },
		{ name: "my", path: "/my", scrolls: [0, 400, 800] },
		{ name: "settings", path: "/my/settings", scrolls: [0, 300] },
		{ name: "facility", path: facilityPath, scrolls: [0, 300, 600, 900] },
		{ name: "onboarding", path: "/onboarding", scrolls: [0] },
		{ name: "landing", path: "/landing", scrolls: [0, 500, 1000, 1500, 2000, 2500] },
		{ name: "login", path: "/login", scrolls: [0] },
	];

	const browser = await chromium.launch();
	const ctx = await browser.newContext({
		viewport: VIEWPORT,
		deviceScaleFactor: SCALE,
		userAgent:
			"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
	});

	for (const route of routes) {
		const page = await ctx.newPage();
		try {
			await page.goto(`${BASE}${route.path}`, {
				waitUntil: route.waitUntil ?? "domcontentloaded",
				timeout: 30000,
			});
			await page.waitForTimeout(1000);

			for (const y of route.scrolls) {
				await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
				await page.waitForTimeout(400);
				await page.screenshot({ path: `${DIR}/${route.name}-y${y}.png` });
				console.log(`📸 ${route.name}-y${y}`);
			}
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);
			console.log(`❌ ${route.name} — ${message}`);
		} finally {
			await page.close();
		}
	}

	await browser.close();
	console.log(`\n✅ ${DIR}`);
}

main().catch((err: unknown) => {
	const message = err instanceof Error ? err.message : String(err);
	console.error(`scroll-audit 실행 실패: ${message}`);
	process.exit(1);
});
