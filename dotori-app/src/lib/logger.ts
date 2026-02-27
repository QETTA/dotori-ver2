/**
 * Structured logging utility.
 *
 * - Development: pretty-prints with ANSI colors to console
 * - Production: outputs single-line JSON for log aggregation
 *
 * Usage:
 *   import { log } from "@/lib/logger";
 *   log.info("Server started", { port: 3000 });
 *   log.error("DB failed", { code: "ECONNREFUSED" });
 *
 *   // Scoped logger with requestId:
 *   const rlog = log.withRequestId("abc-123");
 *   rlog.info("Handling request", { path: "/api/foo" });
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
	level: LogLevel;
	message: string;
	timestamp: string;
	requestId?: string;
	[key: string]: unknown;
}

interface Logger {
	debug: (message: string, meta?: Record<string, unknown>) => void;
	info: (message: string, meta?: Record<string, unknown>) => void;
	warn: (message: string, meta?: Record<string, unknown>) => void;
	error: (message: string, meta?: Record<string, unknown>) => void;
	withRequestId: (requestId: string) => Logger;
}

const isDev = process.env.NODE_ENV !== "production";

const LEVEL_COLORS: Record<LogLevel, string> = {
	debug: "\x1b[36m", // cyan
	info: "\x1b[32m",  // green
	warn: "\x1b[33m",  // yellow
	error: "\x1b[31m", // red
};

const RESET = "\x1b[0m";
const DIM = "\x1b[2m";

/** Map log levels to the appropriate console method */
const CONSOLE_METHOD: Record<LogLevel, "debug" | "info" | "warn" | "error"> = {
	debug: "debug",
	info: "info",
	warn: "warn",
	error: "error",
};

function formatPretty(entry: LogEntry): string {
	const color = LEVEL_COLORS[entry.level];
	const label = entry.level.toUpperCase().padEnd(5);
	const time = entry.timestamp.split("T")[1]?.replace("Z", "") ?? entry.timestamp;

	let line = `${DIM}${time}${RESET} ${color}${label}${RESET} ${entry.message}`;

	// Append requestId if present
	if (entry.requestId) {
		line += ` ${DIM}rid=${entry.requestId}${RESET}`;
	}

	// Append extra meta fields
	const metaKeys = Object.keys(entry).filter(
		(k) => !["level", "message", "timestamp", "requestId"].includes(k),
	);
	if (metaKeys.length > 0) {
		const metaObj: Record<string, unknown> = {};
		for (const k of metaKeys) {
			metaObj[k] = entry[k];
		}
		line += ` ${DIM}${JSON.stringify(metaObj)}${RESET}`;
	}

	return line;
}

function emit(level: LogLevel, message: string, meta?: Record<string, unknown>, requestId?: string): void {
	const entry: LogEntry = {
		level,
		message,
		timestamp: new Date().toISOString(),
		...(requestId ? { requestId } : {}),
		...meta,
	};

	const method = CONSOLE_METHOD[level];

	if (isDev) {
		console[method](formatPretty(entry));
	} else {
		console[method](JSON.stringify(entry));
	}
}

function createLogger(requestId?: string): Logger {
	return {
		debug: (message, meta) => emit("debug", message, meta, requestId),
		info: (message, meta) => emit("info", message, meta, requestId),
		warn: (message, meta) => emit("warn", message, meta, requestId),
		error: (message, meta) => emit("error", message, meta, requestId),
		withRequestId: (rid: string) => createLogger(rid),
	};
}

/** Default logger instance */
export const log: Logger = createLogger();

export type { Logger, LogLevel, LogEntry };
