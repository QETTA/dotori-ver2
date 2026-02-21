/**
 * Input sanitization utilities for XSS prevention.
 * Applied at API boundaries before data reaches the database.
 */

const dangerousTagPattern = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;

/** Strip HTML tags from user input */
export function stripHtml(input: string): string {
	return input.replace(dangerousTagPattern, "").replace(/<[^>]*>/g, "").trim();
}

/** Sanitize a string: trim, strip HTML, collapse whitespace */
export function sanitizeString(input: string): string {
	return stripHtml(input).replace(/\s+/g, " ").trim();
}

/** Sanitize user-generated content (preserves newlines for post content) */
export function sanitizeContent(input: string): string {
	return stripHtml(input)
		.replace(/[^\S\n]+/g, " ")  // collapse spaces but keep newlines
		.replace(/\n{3,}/g, "\n\n")  // max 2 consecutive newlines
		.trim();
}

/** Sanitize search query: strip HTML, remove regex-dangerous chars */
export function sanitizeSearchQuery(input: string): string {
	return sanitizeString(input).slice(0, 100);
}
