/**
 * Web Vitals monitoring — logs Core Web Vitals metrics.
 * In production, these could be sent to an analytics endpoint.
 */

type WebVitalMetric = {
	id: string;
	name: string;
	value: number;
	rating: "good" | "needs-improvement" | "poor";
	delta: number;
	navigationType: string;
};

/** Thresholds from web.dev/vitals */
const thresholds: Record<string, [number, number]> = {
	CLS: [0.1, 0.25],
	FID: [100, 300],
	INP: [200, 500],
	LCP: [2500, 4000],
	FCP: [1800, 3000],
	TTFB: [800, 1800],
};

function getRating(
	name: string,
	value: number,
): "good" | "needs-improvement" | "poor" {
	const threshold = thresholds[name];
	if (!threshold) return "good";
	if (value <= threshold[0]) return "good";
	if (value <= threshold[1]) return "needs-improvement";
	return "poor";
}

export function reportWebVital(metric: WebVitalMetric): void {
	const rating = getRating(metric.name, metric.value);

	// In production, send to analytics endpoint
	if (
		process.env.NODE_ENV === "production" &&
		typeof navigator !== "undefined" &&
		"sendBeacon" in navigator
	) {
		const body = JSON.stringify({
			name: metric.name,
			value: Math.round(metric.value),
			rating,
			id: metric.id,
			page: window.location.pathname,
		});
		navigator.sendBeacon("/api/analytics/vitals", body);
	}
}
