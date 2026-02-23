import fs from "node:fs";
import path from "node:path";

type IntegrityCheck = {
	name: string;
	file: string;
	pattern: RegExp;
	expect: boolean;
};

const CHECKS: IntegrityCheck[] = [
	{
		name: "BottomTabBar uses max-w-md shell",
		file: "src/components/dotori/BottomTabBar.tsx",
		pattern: /max-w-md/,
		expect: true,
	},
	{
		name: "BottomTabBar uses safe-area inset bottom",
		file: "src/components/dotori/BottomTabBar.tsx",
		pattern: /safe-area-inset-bottom/,
		expect: true,
	},
	{
		name: "Facility contact sticky action uses safe-area",
		file: "src/components/dotori/facility/FacilityContactSection.tsx",
		pattern: /safe-area-inset-bottom/,
		expect: true,
	},
	{
		name: "App shell constrained to max-w-md",
		file: "src/app/(app)/layout.tsx",
		pattern: /max-w-md/,
		expect: true,
	},
	{
		name: "Facility card keeps compact tap target",
		file: "src/components/dotori/FacilityCard.tsx",
		pattern: /min-h-10|min-h-11/,
		expect: true,
	},
	{
		name: "No oversized desktop max-width class in tab bar",
		file: "src/components/dotori/BottomTabBar.tsx",
		pattern: /max-w-(2xl|3xl|4xl|5xl|6xl|7xl)/,
		expect: false,
	},
];

function readFile(projectRoot: string, file: string): string {
	const absolute = path.join(projectRoot, file);
	if (!fs.existsSync(absolute)) {
		return "";
	}
	return fs.readFileSync(absolute, "utf8");
}

function main() {
	const root = process.cwd();
	const results = CHECKS.map((check) => {
		const content = readFile(root, check.file);
		const exists = content.length > 0;
		const matched = exists && check.pattern.test(content);
		const pass = exists && (check.expect ? matched : !matched);
		return {
			...check,
			exists,
			pass,
		};
	});

	const total = results.length;
	const passed = results.filter((result) => result.pass).length;
	const score = Math.round((passed / Math.max(1, total)) * 100);

	console.log(`Mobile Integrity: score=${score} (${passed}/${total})`);
	for (const result of results) {
		const status = result.pass ? "PASS" : "FAIL";
		const missingSuffix = result.exists ? "" : " (missing file)";
		console.log(`- [${status}] ${result.name}${missingSuffix}`);
	}

	const enforce = process.env.MOBILE_SCORE_ENFORCE === "1";
	const threshold = Number.parseInt(process.env.MOBILE_SCORE_MIN ?? "85", 10);
	if (enforce && score < threshold) {
		console.error(`Mobile integrity score ${score} is below threshold ${threshold}`);
		process.exit(1);
	}
}

main();
