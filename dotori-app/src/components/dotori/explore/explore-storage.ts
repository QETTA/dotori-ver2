import {
	MAX_RECENT_SEARCHES,
	RECENT_SEARCHES_KEY,
} from "./explore-constants";

export function getRecentSearches(): string[] {
	if (typeof window === "undefined") return [];

	try {
		const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
		if (!raw) return [];

		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];

		return parsed
			.filter((entry): entry is string => typeof entry === "string")
			.slice(0, MAX_RECENT_SEARCHES);
	} catch {
		return [];
	}
}

export function saveRecentSearch(term: string) {
	if (typeof window === "undefined") return;

	const trimmed = term.trim();
	if (!trimmed) return;

	try {
		const prev = getRecentSearches();
		const next = [trimmed, ...prev.filter((entry) => entry !== trimmed)].slice(
			0,
			MAX_RECENT_SEARCHES,
		);
		localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
	} catch {
		// Storage full or blocked — silently fail
	}
}

export function clearRecentSearches() {
	if (typeof window === "undefined") return;

	try {
		localStorage.removeItem(RECENT_SEARCHES_KEY);
	} catch {
		// silently fail
	}
}
