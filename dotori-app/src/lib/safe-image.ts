const ALLOWED_IMAGE_PROTOCOLS = new Set(["http:", "https:", "data:", "blob:"]);

/**
 * Normalizes an image URL and blocks unsafe/unsupported protocols.
 * Only allows http, https, data, and blob URLs.
 */
export function sanitizeImageUrl(rawUrl: string | null | undefined): string | null {
	if (typeof rawUrl !== "string") return null;

	const trimmed = rawUrl.trim();
	if (!trimmed) return null;
	if (/^javascript:/i.test(trimmed)) return null;
	if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;

	try {
		const parsed = new URL(trimmed);
		if (!ALLOWED_IMAGE_PROTOCOLS.has(parsed.protocol)) return null;
		return parsed.toString();
	} catch {
		return null;
	}
}

export function sanitizeImageUrls(
	rawUrls: Array<string | null | undefined> | null | undefined,
): string[] {
	if (!rawUrls || rawUrls.length === 0) return [];

	return rawUrls
		.map((rawUrl) => sanitizeImageUrl(rawUrl))
		.filter((url): url is string => Boolean(url));
}

export function getFirstSafeImageUrl(
	rawUrls: Array<string | null | undefined> | null | undefined,
): string | null {
	if (!rawUrls) return null;

	for (const rawUrl of rawUrls) {
		const safeUrl = sanitizeImageUrl(rawUrl);
		if (safeUrl) return safeUrl;
	}

	return null;
}
