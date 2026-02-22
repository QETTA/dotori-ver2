import type { ChatBlock } from "@/types/dotori";

export interface StreamEvent {
	type: "start" | "block" | "text" | "done" | "error";
	intent?: string;
	block?: ChatBlock;
	text?: string;
	timestamp?: string;
	error?: string;
	quick_replies?: string[];
}

export function getStreamErrorPayload(
	response: Response,
): Promise<{ isQuotaExceeded: boolean; message: string }> {
	const fallback = "스트리밍 응답을 받을 수 없습니다.";
	if (!response.headers.get("content-type")?.includes("application/json")) {
		return response
			.text()
			.then((text) => ({
				isQuotaExceeded: false,
				message: text.trim() || fallback,
			}))
			.catch(() => ({
				isQuotaExceeded: false,
				message: fallback,
			}));
	}

	return response
		.json()
		.then((payload) => {
			if (!payload || typeof payload !== "object") {
				return { isQuotaExceeded: false, message: fallback };
			}
			const record = payload as Record<string, unknown>;
			const isQuotaExceeded = record.error === "quota_exceeded";
			const message =
				typeof record.message === "string" ? record.message : fallback;
			return { isQuotaExceeded, message };
		})
		.catch(() => ({ isQuotaExceeded: false, message: fallback }));
}

export function parseSseEvent(rawEvent: string): StreamEvent | null {
	const lines = rawEvent.split("\n");
	const dataLines = lines.filter((line) => line.startsWith("data:"));
	if (dataLines.length === 0) return null;

	const data = dataLines.map((line) => line.replace(/^data:\s?/, "")).join("\n");
	let payload: unknown;
	try {
		payload = JSON.parse(data);
	} catch {
		return null;
	}

	if (typeof payload !== "object" || payload === null || !("type" in payload)) {
		return null;
	}

	const typed = payload as { type: string; [key: string]: unknown };
	if (
		typed.type !== "start" &&
		typed.type !== "block" &&
		typed.type !== "text" &&
		typed.type !== "done" &&
		typed.type !== "error"
	) {
		return null;
	}

	return {
		type: typed.type,
		...(typed as Record<string, unknown>),
	} as StreamEvent;
}
