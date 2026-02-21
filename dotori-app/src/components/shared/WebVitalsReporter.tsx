"use client";

import { reportWebVital } from "@/lib/web-vitals";
import { useReportWebVitals } from "next/web-vitals";

export function WebVitalsReporter() {
	useReportWebVitals((metric) => {
		reportWebVital(metric as Parameters<typeof reportWebVital>[0]);
	});
	return null;
}
