import fs from "node:fs";
import path from "node:path";

type FileAudit = {
	file: string;
	exists: boolean;
	hasDesignTokens: boolean;
	hasBrandAsset: boolean;
};

const TARGET_FILES = [
	"src/app/(app)/page.tsx",
	"src/app/(app)/community/page.tsx",
	"src/app/(app)/chat/page.tsx",
	"src/components/dotori/BottomTabBar.tsx",
	"src/components/dotori/FacilityCard.tsx",
	"src/components/dotori/facility/FacilityCapacitySection.tsx",
	"src/components/dotori/facility/FacilityContactSection.tsx",
	"src/components/dotori/chat/ChatPromptPanel.tsx",
];

const TOKENS_PATTERN = /@\/lib\/design-system\/tokens|DS_TYPOGRAPHY|DS_GLASS|DS_LAYOUT|DS_STATUS/;
const BRAND_PATTERN = /@\/lib\/brand-assets|BRAND\./;

function round(value: number): number {
	return Math.round(value);
}

function auditFile(projectRoot: string, file: string): FileAudit {
	const absolute = path.join(projectRoot, file);
	if (!fs.existsSync(absolute)) {
		return {
			file,
			exists: false,
			hasDesignTokens: false,
			hasBrandAsset: false,
		};
	}

	const content = fs.readFileSync(absolute, "utf8");
	return {
		file,
		exists: true,
		hasDesignTokens: TOKENS_PATTERN.test(content),
		hasBrandAsset: BRAND_PATTERN.test(content),
	};
}

function main() {
	const projectRoot = process.cwd();
	const audits = TARGET_FILES.map((file) => auditFile(projectRoot, file));
	const existing = audits.filter((audit) => audit.exists);

	const existingCount = existing.length === 0 ? 1 : existing.length;
	const tokenCovered = existing.filter((audit) => audit.hasDesignTokens).length;
	const brandCovered = existing.filter((audit) => audit.hasBrandAsset).length;

	const tokenScore = round((tokenCovered / existingCount) * 100);
	const brandScore = round((brandCovered / existingCount) * 100);
	const score = round(tokenScore * 0.7 + brandScore * 0.3);

	const report = {
		targetCount: TARGET_FILES.length,
		existingCount: existing.length,
		tokenScore,
		brandScore,
		score,
		files: audits,
	};

	if (process.env.DS_REPORT === "1") {
		console.log(JSON.stringify(report, null, 2));
	} else {
		console.log(
			`DS Audit: score=${score} (tokens=${tokenScore}, brand=${brandScore}, existing=${existing.length}/${TARGET_FILES.length})`,
		);
	}

	const enforce = process.env.DS_SCORE_ENFORCE === "1";
	const threshold = Number.parseInt(process.env.DS_SCORE_MIN ?? "80", 10);

	if (enforce && score < threshold) {
		console.error(`DS score ${score} is below threshold ${threshold}`);
		process.exit(1);
	}
}

main();
