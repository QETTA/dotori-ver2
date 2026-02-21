import type { FacilityType } from "@/types/dotori";

/* ===== Facility Type Placeholder Config ===== */

interface PlaceholderConfig {
	label: string;
	gradientFrom: string;
	gradientTo: string;
	accentColor: string;
}

const PLACEHOLDER_MAP: Record<FacilityType, PlaceholderConfig> = {
	국공립: {
		label: "국공립",
		gradientFrom: "#c8956a", // dotori-400
		gradientTo: "#a06840", // deeper warm
		accentColor: "#e0b892",
	},
	민간: {
		label: "민간",
		gradientFrom: "#d4a574", // lighter dotori
		gradientTo: "#b07a4a", // dotori-500
		accentColor: "#e8c5a0",
	},
	가정: {
		label: "가정",
		gradientFrom: "#4a7a42", // forest-500
		gradientTo: "#355430", // deeper forest
		accentColor: "#72a468",
	},
	직장: {
		label: "직장",
		gradientFrom: "#8b7355", // muted brown
		gradientTo: "#5e4d38", // dark warm
		accentColor: "#b09878",
	},
	협동: {
		label: "협동",
		gradientFrom: "#b08a5a", // warm mid
		gradientTo: "#6a7a42", // olive-forest blend
		accentColor: "#c8a878",
	},
	사회복지: {
		label: "사회복지",
		gradientFrom: "#c87a6a", // warm rose
		gradientTo: "#9a5a4a", // deeper rose
		accentColor: "#e0a090",
	},
};

const DEFAULT_CONFIG: PlaceholderConfig = {
	label: "어린이집",
	gradientFrom: "#c8956a",
	gradientTo: "#a06840",
	accentColor: "#e0b892",
};

/* ===== SVG Building Icon Path ===== */

/**
 * Stylized building/house icon — a simple childcare facility silhouette.
 * Drawn to fit roughly within a 60x60 bounding box centered at (200, 90).
 * Composed of: pitched roof + rectangular body + door + small window.
 */
const BUILDING_ICON = [
	// Roof — a wide triangle
	"M170 90 L200 62 L230 90 Z",
	// Body — rectangle below the roof
	"M175 90 L175 120 L225 120 L225 90 Z",
	// Door — center rectangle
	"M194 106 L194 120 L206 120 L206 106 Q206 103 200 103 Q194 103 194 106 Z",
	// Left window
	"M180 96 L180 104 L190 104 L190 96 Z",
	// Right window
	"M210 96 L210 104 L220 104 L220 96 Z",
].join(" ");

/* ===== SVG Generation ===== */

function buildPlaceholderSvg(config: PlaceholderConfig): string {
	const { label, gradientFrom, gradientTo, accentColor } = config;

	// Unique-ish IDs to avoid SVG filter collisions in DOM (though data-URIs are isolated)
	const uid = label.charCodeAt(0);

	const svg = [
		'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225">',

		/* === Defs: gradients, filters, clip === */
		"<defs>",
		// Main background gradient (top-left → bottom-right)
		`<linearGradient id="bg${uid}" x1="0%" y1="0%" x2="100%" y2="100%">`,
		`<stop offset="0%" stop-color="${gradientFrom}"/>`,
		`<stop offset="100%" stop-color="${gradientTo}"/>`,
		"</linearGradient>",
		// Radial highlight for depth
		`<radialGradient id="hl${uid}" cx="30%" cy="25%" r="70%">`,
		'<stop offset="0%" stop-color="rgba(255,255,255,0.15)"/>',
		'<stop offset="100%" stop-color="rgba(255,255,255,0)"/>',
		"</radialGradient>",
		// Subtle noise texture filter
		`<filter id="noise${uid}" x="0" y="0" width="100%" height="100%">`,
		`<feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise"/>`,
		`<feColorMatrix type="saturate" values="0" in="noise" result="grayNoise"/>`,
		`<feBlend in="SourceGraphic" in2="grayNoise" mode="overlay" result="blended"/>`,
		`<feComponentTransfer in="blended">`,
		'<feFuncA type="linear" slope="1"/>',
		"</feComponentTransfer>",
		"</filter>",
		// Soft glow for the icon
		`<filter id="glow${uid}">`,
		'<feGaussianBlur stdDeviation="4" result="blur"/>',
		'<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>',
		"</filter>",
		// Bottom fade gradient (defined here, used at bottom of image)
		`<linearGradient id="fadeBot${uid}" x1="0" y1="0" x2="0" y2="1">`,
		'<stop offset="0%" stop-color="rgba(0,0,0,0)"/>',
		'<stop offset="100%" stop-color="rgba(0,0,0,0.15)"/>',
		"</linearGradient>",
		"</defs>",

		/* === Background === */
		`<rect width="400" height="225" fill="url(#bg${uid})" rx="12"/>`,
		// Noise overlay for texture
		`<rect width="400" height="225" fill="url(#bg${uid})" rx="12" filter="url(#noise${uid})" opacity="0.35"/>`,
		// Radial highlight
		`<rect width="400" height="225" fill="url(#hl${uid})" rx="12"/>`,

		/* === Decorative geometric shapes === */
		// Large background circle — top right
		`<circle cx="330" cy="30" r="100" fill="${accentColor}" opacity="0.08"/>`,
		// Medium circle — bottom left
		`<circle cx="60" cy="200" r="75" fill="rgba(255,255,255,0.06)"/>`,
		// Small circle cluster — mid right
		`<circle cx="350" cy="160" r="35" fill="rgba(255,255,255,0.05)"/>`,
		`<circle cx="320" cy="180" r="20" fill="${accentColor}" opacity="0.06"/>`,
		// Floating ring — top left area
		`<circle cx="90" cy="50" r="30" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>`,
		// Soft horizontal lines — architectural feel
		`<line x1="140" y1="145" x2="260" y2="145" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`,
		`<line x1="155" y1="152" x2="245" y2="152" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`,
		// Small diamond accent — top center
		`<rect x="196" y="38" width="8" height="8" rx="1" fill="rgba(255,255,255,0.1)" transform="rotate(45 200 42)"/>`,
		// Tiny dots for subtle pattern
		`<circle cx="130" cy="75" r="2" fill="rgba(255,255,255,0.1)"/>`,
		`<circle cx="270" cy="80" r="2" fill="rgba(255,255,255,0.1)"/>`,
		`<circle cx="150" cy="170" r="1.5" fill="rgba(255,255,255,0.08)"/>`,
		`<circle cx="250" cy="165" r="1.5" fill="rgba(255,255,255,0.08)"/>`,

		/* === Building icon (centered) === */
		// Icon glow backdrop
		`<circle cx="200" cy="95" r="32" fill="rgba(255,255,255,0.08)"/>`,
		// Building path
		`<path d="${BUILDING_ICON}" fill="rgba(255,255,255,0.85)" filter="url(#glow${uid})"/>`,

		/* === Bottom fade stripe for card overlap readability === */
		`<rect x="0" y="195" width="400" height="30" rx="0" fill="url(#fadeBot${uid})"/>`,

		"</svg>",
	].join("");

	return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/* ===== Placeholder Cache ===== */

const placeholderCache = new Map<string, string>();

function getCachedPlaceholder(type: string): string {
	const cached = placeholderCache.get(type);
	if (cached) return cached;

	const config =
		PLACEHOLDER_MAP[type as FacilityType] ?? DEFAULT_CONFIG;
	const dataUrl = buildPlaceholderSvg(config);

	placeholderCache.set(type, dataUrl);
	return dataUrl;
}

/* ===== Public API ===== */

/**
 * Returns the best available image for a facility.
 * Uses the first real image if available, otherwise returns
 * a branded SVG placeholder specific to the facility type.
 */
export function getFacilityImage(facility: {
	type: string;
	images?: string[];
}): string {
	if (facility.images && facility.images.length > 0) {
		return facility.images[0];
	}
	return getCachedPlaceholder(facility.type);
}
