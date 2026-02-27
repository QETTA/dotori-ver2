import fs from "node:fs";
import path from "node:path";

type FileAudit = {
	file: string;
	exists: boolean;
	hasDesignTokens: boolean;
	hasDesignTokenImport: boolean;
	hasBrandAsset: boolean;
	hasBrandCopy: boolean;
	hasSemanticColorSignal: boolean;
	hasBrandTokenSignal: boolean;
	hasBrandSignal: boolean;
	classNameAssignments: number;
	rawClassNameLiterals: number;
	rawClassSamples: string[];
};

type ClassNameAssignment = {
	index: number;
	raw: string;
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
	"src/components/dotori/CompareTable.tsx",
];
const STYLE_NEUTRAL_TARGETS = [
	"src/app/(app)/facility/[id]/page.tsx",
	"src/components/dotori/WaitlistProgressBar.tsx",
] as const;

const TOKENS_IMPORT_PATTERN = /@\/lib\/design-system\/tokens/;
const TOKENS_USAGE_PATTERN =
	/\bDS_(?:TYPOGRAPHY|TEXT|GLASS|LAYOUT|SURFACE|STATUS|STATUS_ALIAS|SENTIMENT|FRESHNESS|PROGRESS|TOAST|SHADOW)\b/;
const BRAND_ASSET_PATTERN = /@\/lib\/brand-assets|BRAND\./;
const BRAND_COPY_PATTERN = /@\/lib\/brand-copy|COPY\./;
const SEMANTIC_COLOR_PATTERN = /color\s*=\s*["'](?:dotori|forest|amber)["']/;
const BRAND_ARCH_PATTERN =
	/\bDS_(?:GLASS|SURFACE|STATUS|STATUS_ALIAS|SENTIMENT|FRESHNESS|PROGRESS|TOAST)\b|color\s*=\s*["'](?:dotori|forest|amber)["']/;
const QUOTED_LITERAL_PATTERN = /(["'`])((?:\\.|(?!\1)[\s\S])*)\1/g;
const UTILITY_EXACT = new Set([
	"absolute",
	"block",
	"container",
	"contents",
	"fixed",
	"flex",
	"grid",
	"group",
	"hidden",
	"inline",
	"inline-block",
	"inline-flex",
	"relative",
	"sr-only",
	"static",
	"sticky",
	"table",
	"table-cell",
	"table-row",
	"touch-target",
	"truncate",
	"glass-card",
	"glass-header",
	"glass-float",
	"glass-sheet",
	"glass-overlay",
]);
const UTILITY_PREFIXES = [
	"animate",
	"aspect",
	"backdrop",
	"basis",
	"bg",
	"blur",
	"border",
	"bottom",
	"break",
	"col-span",
	"content",
	"decoration",
	"duration",
	"ease",
	"fill",
	"font",
	"from",
	"gap",
	"grow",
	"h",
	"inset",
	"items",
	"justify",
	"leading",
	"left",
	"line-clamp",
	"m",
	"max-h",
	"max-w",
	"mb",
	"min-h",
	"min-w",
	"mix-blend",
	"ml",
	"mr",
	"mt",
	"mx",
	"my",
	"object",
	"opacity",
	"order",
	"overflow",
	"p",
	"pb",
	"pl",
	"pointer-events",
	"pr",
	"pt",
	"px",
	"py",
	"relative",
	"right",
	"ring",
	"rotate",
	"rounded",
	"row-span",
	"scale",
	"select",
	"shadow",
	"shrink",
	"size",
	"space-x",
	"space-y",
	"stroke",
	"text",
	"top",
	"tracking",
	"transition",
	"translate",
	"underline",
	"via",
	"w",
	"whitespace",
	"z",
];

function round(value: number): number {
	return Math.round(value);
}

function parseOptionalInt(rawValue: string | undefined): number | undefined {
	if (rawValue === undefined) {
		return undefined;
	}
	const parsed = Number.parseInt(rawValue, 10);
	return Number.isNaN(parsed) ? undefined : parsed;
}

function toPosix(filePath: string): string {
	return filePath.replaceAll("\\", "/");
}

function collectRelativeFiles(
	rootDir: string,
	relativeRoot: string,
	shouldInclude: (relativePath: string) => boolean,
	out: string[],
): void {
	if (!fs.existsSync(rootDir)) {
		return;
	}
	for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
		if (entry.name.startsWith(".") || entry.name === "node_modules") {
			continue;
		}
		const absPath = path.join(rootDir, entry.name);
		const relPath = toPosix(path.join(relativeRoot, entry.name));
		if (entry.isDirectory()) {
			collectRelativeFiles(absPath, relPath, shouldInclude, out);
			continue;
		}
		if (entry.isFile() && shouldInclude(relPath)) {
			out.push(relPath);
		}
	}
}

function buildAuditTargets(projectRoot: string): string[] {
	const targetSet = new Set<string>(TARGET_FILES);
	if (process.env.DS_AUDIT_ALL !== "1") {
		return TARGET_FILES;
	}

	const hasRepoSrc = fs.existsSync(path.join(projectRoot, "src"));
	const sourceRoot = hasRepoSrc
		? path.join(projectRoot, "src")
		: path.join(projectRoot, "dotori-app/src");
	const sourceRootPrefix = hasRepoSrc ? "src" : "dotori-app/src";

	const discovered: string[] = [];
	collectRelativeFiles(
		path.join(sourceRoot, "app"),
		`${sourceRootPrefix}/app`,
		(relativePath) => /\/page\.tsx$/.test(relativePath),
		discovered,
	);
	collectRelativeFiles(
		path.join(sourceRoot, "components/dotori"),
		`${sourceRootPrefix}/components/dotori`,
		(relativePath) => relativePath.endsWith(".tsx"),
		discovered,
	);
	for (const file of discovered) {
		targetSet.add(file);
	}
	return Array.from(targetSet);
}

function unquote(raw: string): string {
	return raw.slice(1, -1);
}

function extractQuotedLiterals(source: string): string[] {
	const out: string[] = [];
	for (const match of source.matchAll(QUOTED_LITERAL_PATTERN)) {
		out.push(match[2] ?? "");
	}
	return out;
}

function isIdentifierChar(char: string | undefined): boolean {
	if (!char) {
		return false;
	}
	return /[A-Za-z0-9_$]/.test(char);
}

function skipQuotedLiteral(
	source: string,
	startIndex: number,
	quote: `"` | `'`,
): number {
	let cursor = startIndex + 1;
	while (cursor < source.length) {
		const char = source[cursor];
		if (char === "\\") {
			cursor += 2;
			continue;
		}
		if (char === quote) {
			return cursor + 1;
		}
		cursor += 1;
	}
	return source.length;
}

function skipBracedExpression(source: string, startIndex: number): number;

function skipTemplateLiteral(source: string, startIndex: number): number {
	let cursor = startIndex + 1;
	while (cursor < source.length) {
		const char = source[cursor];
		if (char === "\\") {
			cursor += 2;
			continue;
		}
		if (char === "`") {
			return cursor + 1;
		}
		if (char === "$" && source[cursor + 1] === "{") {
			cursor = skipBracedExpression(source, cursor + 1);
			continue;
		}
		cursor += 1;
	}
	return source.length;
}

function skipBracedExpression(source: string, startIndex: number): number {
	let depth = 0;
	let cursor = startIndex;

	while (cursor < source.length) {
		const char = source[cursor];
		if (char === "{") {
			depth += 1;
			cursor += 1;
			continue;
		}
		if (char === "}") {
			depth -= 1;
			cursor += 1;
			if (depth === 0) {
				return cursor;
			}
			continue;
		}
		if (char === `"` || char === `'`) {
			cursor = skipQuotedLiteral(source, cursor, char);
			continue;
		}
		if (char === "`") {
			cursor = skipTemplateLiteral(source, cursor);
			continue;
		}
		cursor += 1;
	}

	return source.length;
}

function readClassNameValue(
	source: string,
	startIndex: number,
): { raw: string; end: number } | undefined {
	let cursor = startIndex;
	while (cursor < source.length && /\s/.test(source[cursor] ?? "")) {
		cursor += 1;
	}
	if (cursor >= source.length) {
		return undefined;
	}

	const char = source[cursor];
	if (char === "{") {
		const end = skipBracedExpression(source, cursor);
		return {
			raw: source.slice(cursor, end),
			end,
		};
	}
	if (char === `"` || char === `'`) {
		const end = skipQuotedLiteral(source, cursor, char);
		return {
			raw: source.slice(cursor, end),
			end,
		};
	}
	if (char === "`") {
		const end = skipTemplateLiteral(source, cursor);
		return {
			raw: source.slice(cursor, end),
			end,
		};
	}

	return undefined;
}

function extractClassNameAssignments(source: string): ClassNameAssignment[] {
	const out: ClassNameAssignment[] = [];
	const key = "className";
	let cursor = 0;

	while (cursor < source.length) {
		const index = source.indexOf(key, cursor);
		if (index < 0) {
			break;
		}

		const before = source[index - 1];
		const after = source[index + key.length];
		if (isIdentifierChar(before) || isIdentifierChar(after)) {
			cursor = index + key.length;
			continue;
		}

		let valueCursor = index + key.length;
		while (valueCursor < source.length && /\s/.test(source[valueCursor] ?? "")) {
			valueCursor += 1;
		}
		if (source[valueCursor] !== "=") {
			cursor = valueCursor + 1;
			continue;
		}

		const value = readClassNameValue(source, valueCursor + 1);
		if (!value) {
			cursor = valueCursor + 1;
			continue;
		}

		out.push({
			index,
			raw: value.raw,
		});
		cursor = value.end;
	}

	return out;
}

function unwrapVariantToken(token: string): string {
	let base = token.trim();
	if (!base) {
		return "";
	}
	if (base.startsWith("!")) {
		base = base.slice(1);
	}
	if (base.startsWith("-")) {
		base = base.slice(1);
	}
	const parts = base.split(":");
	return (parts[parts.length - 1] ?? "").trim();
}

function isUtilityClassToken(token: string): boolean {
	const base = unwrapVariantToken(token);
	if (!base) {
		return false;
	}
	if (UTILITY_EXACT.has(base)) {
		return true;
	}
	if (base.startsWith("[") && base.endsWith("]")) {
		return true;
	}
	for (const prefix of UTILITY_PREFIXES) {
		if (base === prefix || base.startsWith(`${prefix}-`)) {
			return true;
		}
	}
	return false;
}

function looksLikeClassLiteral(value: string): boolean {
	const normalized = value.trim();
	if (!normalized) {
		return false;
	}
	const tokens = normalized.split(/\s+/).filter(Boolean);
	if (tokens.length === 0) {
		return false;
	}
	return tokens.some((token) => isUtilityClassToken(token));
}

function isHardcodedClassNameLiteral(raw: string): boolean {
	const normalized = raw.trim();
	if (!normalized) {
		return false;
	}

	if (normalized.startsWith("{")) {
		const inner = normalized.slice(1, -1);
		return extractQuotedLiterals(inner).some((value) =>
			looksLikeClassLiteral(value),
		);
	}

	if (
		(normalized.startsWith(`"`) ||
			normalized.startsWith(`'`) ||
			normalized.startsWith("`")) &&
		looksLikeClassLiteral(unquote(normalized))
	) {
		return true;
	}

	return false;
}

function collectHardcodedClassNameAssignments(
	content: string,
): ClassNameAssignment[] {
	return extractClassNameAssignments(content).filter((assignment) =>
		isHardcodedClassNameLiteral(assignment.raw),
	);
}

function countHardcodedClassNameLiterals(content: string): number {
	return collectHardcodedClassNameAssignments(content).length;
}

function sampleHardcodedClassNameLiterals(content: string, limit = 3): string[] {
	const samples: string[] = [];
	const assignments = collectHardcodedClassNameAssignments(content);

	for (const assignment of assignments) {
		if (samples.length >= limit) {
			break;
		}
		const line = content.slice(0, assignment.index).split("\n").length;
		const snippet = content
			.slice(assignment.index, assignment.index + 160)
			.replaceAll(/\s+/g, " ")
			.trim();
		samples.push(`L${line}: ${snippet}`);
	}

	return samples;
}

function isStyleNeutralTarget(file: string): boolean {
	return STYLE_NEUTRAL_TARGETS.some(
		(target) => file === target || file.endsWith(`/${target}`),
	);
}

function isStyleBearingAudit(audit: FileAudit): boolean {
	if (isStyleNeutralTarget(audit.file)) {
		return false;
	}
	return (
		audit.classNameAssignments > 0 ||
		audit.rawClassNameLiterals > 0 ||
		audit.hasSemanticColorSignal
	);
}

function isStyleNeutralViolation(audit: FileAudit): boolean {
	if (!isStyleNeutralTarget(audit.file)) {
		return false;
	}
	return (
		audit.classNameAssignments > 0 ||
		audit.rawClassNameLiterals > 0 ||
		audit.hasSemanticColorSignal
	);
}

function auditFile(projectRoot: string, file: string): FileAudit {
	const absolute = path.join(projectRoot, file);
	if (!fs.existsSync(absolute)) {
		return {
			file,
			exists: false,
			hasDesignTokens: false,
			hasDesignTokenImport: false,
			hasBrandAsset: false,
			hasBrandCopy: false,
			hasSemanticColorSignal: false,
			hasBrandTokenSignal: false,
			hasBrandSignal: false,
			classNameAssignments: 0,
			rawClassNameLiterals: 0,
			rawClassSamples: [],
		};
	}

	const content = fs.readFileSync(absolute, "utf8");
	const hasDesignTokenImport = TOKENS_IMPORT_PATTERN.test(content);
	const hasDesignTokens = TOKENS_USAGE_PATTERN.test(content);
	const hasBrandAsset = BRAND_ASSET_PATTERN.test(content);
	const hasBrandCopy = BRAND_COPY_PATTERN.test(content);
	const hasSemanticColorSignal = SEMANTIC_COLOR_PATTERN.test(content);
	const hasBrandTokenSignal = BRAND_ARCH_PATTERN.test(content);
	const classNameAssignments = extractClassNameAssignments(content).length;
	return {
		file,
		exists: true,
		hasDesignTokens,
		hasDesignTokenImport,
		hasBrandAsset,
		hasBrandCopy,
		hasSemanticColorSignal,
		hasBrandTokenSignal,
		hasBrandSignal: hasBrandTokenSignal,
		classNameAssignments,
		rawClassNameLiterals: countHardcodedClassNameLiterals(content),
		rawClassSamples: sampleHardcodedClassNameLiterals(content),
	};
}

function main() {
	const projectRoot = process.cwd();
	const targetFiles = buildAuditTargets(projectRoot);
	const audits = targetFiles.map((file) => auditFile(projectRoot, file));
	const baselineAudits = audits.filter((audit) => TARGET_FILES.includes(audit.file));
	const existing = audits.filter((audit) => audit.exists);
	const baselineExisting = baselineAudits.filter((audit) => audit.exists);
	const scoreBaseAudits =
		process.env.DS_AUDIT_ALL === "1" ? existing : baselineExisting;
	const styleBearingAudits = scoreBaseAudits.filter(isStyleBearingAudit);
	const scoreAudits =
		styleBearingAudits.length > 0 ? styleBearingAudits : scoreBaseAudits;

	const scoreExistingCount = scoreAudits.length === 0 ? 1 : scoreAudits.length;
	const tokenCovered = scoreAudits.filter((audit) => audit.hasDesignTokens).length;
	const brandCovered = scoreAudits.filter((audit) => audit.hasBrandSignal).length;

	const tokenScore = round((tokenCovered / scoreExistingCount) * 100);
	const brandScore = round((brandCovered / scoreExistingCount) * 100);
	const scopeLabel = process.env.DS_AUDIT_ALL === "1" ? "all" : "target";
	const scoreScope =
		styleBearingAudits.length > 0 ? `${scopeLabel}-style-bearing` : scopeLabel;
	const score = round(tokenScore * 0.7 + brandScore * 0.3);
	const totalHardcodedClassLiterals = existing.reduce(
		(sum, audit) => sum + audit.rawClassNameLiterals,
		0,
	);
	const rankedByHardcoded = [...existing].sort(
		(a, b) => b.rawClassNameLiterals - a.rawClassNameLiterals,
	);
	const appPageCount = existing.filter((audit) =>
		/\/app\/.+\/page\.tsx$/.test(audit.file),
	).length;
	const dotoriComponentCount = existing.filter((audit) =>
		audit.file.includes("/components/dotori/"),
	).length;
	const rawClassFreeFileCount = existing.filter(
		(audit) => audit.rawClassNameLiterals === 0,
	).length;
	const rawClassFreeRate = round(
		(rawClassFreeFileCount / (existing.length || 1)) * 100,
	);
	const styleNeutralCount = existing.filter((audit) =>
		isStyleNeutralTarget(audit.file),
	).length;
	const styleNeutralRate = round((styleNeutralCount / (existing.length || 1)) * 100);
	const styleBearingCount = existing.filter(isStyleBearingAudit).length;
	const styleBearingRate = round((styleBearingCount / (existing.length || 1)) * 100);
	const styleBearingScoreCount = scoreAudits.length;
	const styleBearingScoreRate = round(
		(styleBearingScoreCount / (scoreBaseAudits.length || 1)) * 100,
	);
	const brandSignalCount = existing.filter((audit) => audit.hasBrandSignal).length;
	const brandSignalRate = round((brandSignalCount / (existing.length || 1)) * 100);
	const brandArchitectureSignalCount = existing.filter(
		(audit) => audit.hasBrandTokenSignal,
	).length;
	const brandArchitectureSignalRate = round(
		(brandArchitectureSignalCount / (existing.length || 1)) * 100,
	);

	const report = {
		targetCount: TARGET_FILES.length,
		existingCount: baselineExisting.length,
		examinedCount: audits.length,
		scoreScope,
		scoreBaseCount: scoreBaseAudits.length,
		scoreTargetCount: scoreAudits.length,
		tokenScore,
		brandScore,
		score,
		totalHardcodedClassLiterals,
		waveMetrics: {
			appPageCount,
			dotoriComponentCount,
			styleBearingCount,
			styleBearingRate,
			styleBearingScoreCount,
			styleBearingScoreRate,
			styleNeutralCount,
			styleNeutralRate,
			brandSignalCount,
			brandSignalRate,
			brandArchitectureSignalCount,
			brandArchitectureSignalRate,
			rawClassFreeFileCount,
			rawClassFreeRate,
		},
		topHardcodedFiles: rankedByHardcoded.slice(0, 20).map((audit) => ({
			file: audit.file,
			rawClassNameLiterals: audit.rawClassNameLiterals,
		})),
		styleNeutralTargets: STYLE_NEUTRAL_TARGETS,
		files: audits,
	};

	if (process.env.DS_REPORT === "1") {
		console.log(JSON.stringify(report, null, 2));
	} else {
		console.log(
			`DS Audit: score=${score} (tokens=${tokenScore}, brand=${brandScore}, scope=${scoreScope}, scored=${scoreAudits.length}/${scoreBaseAudits.length})`,
		);
		console.log(
			`Hardcoded className literals: ${totalHardcodedClassLiterals} across ${audits.length} checked files`,
		);
		console.log(
			`Wave metrics: pages=${appPageCount}, dotori-components=${dotoriComponentCount}, styleBearing=${styleBearingCount}/${existing.length} (${styleBearingRate}%), styleBearingScore=${styleBearingScoreCount}/${scoreBaseAudits.length} (${styleBearingScoreRate}%), styleNeutral=${styleNeutralCount}/${existing.length} (${styleNeutralRate}%), brandSignal(arch)=${brandArchitectureSignalCount}/${existing.length} (${brandArchitectureSignalRate}%), rawClassFree=${rawClassFreeFileCount}/${existing.length} (${rawClassFreeRate}%)`,
		);
		if (rankedByHardcoded.length > 0) {
			console.log("Top 5 hardcoded files:");
			for (const item of rankedByHardcoded.slice(0, 5)) {
				console.log(`- ${item.file}: ${item.rawClassNameLiterals}`);
			}
		}
	}

	const enforce = process.env.DS_SCORE_ENFORCE === "1";
	const scoreMinRaw = process.env.DS_SCORE_MIN;
	const threshold = parseOptionalInt(scoreMinRaw);
	if (enforce && threshold === undefined) {
		console.error(
			`DS_SCORE_MIN is invalid (${scoreMinRaw ?? "undefined"}). Must be an integer.`,
		);
		process.exit(1);
	}
	const scoreThreshold = threshold ?? 80;
	const hardcodedThreshold = parseOptionalInt(process.env.DS_RAW_CLASS_MAX);
	const enforceHardcodedLimit = hardcodedThreshold !== undefined;
	if (
		enforceHardcodedLimit &&
		hardcodedThreshold !== undefined &&
		hardcodedThreshold < 0
	) {
		console.error(
			`DS_RAW_CLASS_MAX is invalid (${hardcodedThreshold}). Must be >= 0.`,
		);
		process.exit(1);
	}

	if (enforce && score < scoreThreshold) {
		console.error(`DS score ${score} is below threshold ${scoreThreshold}`);
		process.exit(1);
	}

	if (enforceHardcodedLimit) {
		const overThreshold = existing.filter(
			(audit) => audit.rawClassNameLiterals > hardcodedThreshold,
		);
		if (overThreshold.length > 0) {
			console.error(
				`Hardcoded className overflow (${hardcodedThreshold}) detected in:`,
			);
			for (const item of overThreshold) {
				console.error(`- ${item.file}: ${item.rawClassNameLiterals}`);
				for (const sample of item.rawClassSamples) {
					console.error(`  ${sample}`);
				}
			}
			process.exit(1);
		}
	}

	const enforceStyleNeutral = process.env.DS_STYLE_NEUTRAL_ENFORCE !== "0";
	if (enforceStyleNeutral) {
		const neutralViolations = existing.filter(isStyleNeutralViolation);
		if (neutralViolations.length > 0) {
			console.error("Style-neutral target violation detected:");
			for (const audit of neutralViolations) {
				console.error(
					`- ${audit.file}: classNameAssignments=${audit.classNameAssignments}, rawClassNameLiterals=${audit.rawClassNameLiterals}, semanticColorSignal=${audit.hasSemanticColorSignal}`,
				);
			}
			process.exit(1);
		}
	}
}

main();
