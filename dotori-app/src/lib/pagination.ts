/**
 * Shared pagination helpers for service layers.
 */

export const PAGINATION = {
	MIN_PAGE: 1,
	MIN_LIMIT: 1,
	DEFAULT_LIMIT: 20,
	MAX_LIMIT: 100,
} as const;

export function toNumber(value?: string | number): number | undefined {
	if (value === undefined) return undefined;
	if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
}

export function normalizePage(value?: string | number): number {
	const parsed = toNumber(value);
	return Math.max(PAGINATION.MIN_PAGE, Math.floor(parsed ?? PAGINATION.MIN_PAGE));
}

export function normalizeLimit(
	value?: string | number,
	fallback = PAGINATION.DEFAULT_LIMIT,
): number {
	const parsed = toNumber(value);
	return Math.max(
		PAGINATION.MIN_LIMIT,
		Math.min(PAGINATION.MAX_LIMIT, Math.floor(parsed ?? fallback)),
	);
}
