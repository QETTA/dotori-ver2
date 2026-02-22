import {
	ANONYMOUS_BANNER_STYLES,
	facilityTypes,
	HOT_POST_THRESHOLD,
} from "./community-constants";
import type { CommunityPostWithViews } from "./community-types";

function hashSeed(value: string): number {
	let hash = 5381;
	for (let i = 0; i < value.length; i += 1) {
		hash = (hash * 33 + value.charCodeAt(i)) >>> 0;
	}
	return hash;
}

export function getAnonymousStyle(seed: string) {
	const idx = hashSeed(seed) % ANONYMOUS_BANNER_STYLES.length;
	return ANONYMOUS_BANNER_STYLES[idx] ?? ANONYMOUS_BANNER_STYLES[0];
}

export function isHotPost(post: CommunityPostWithViews): boolean {
	return post.likes + post.commentCount >= HOT_POST_THRESHOLD;
}

export function tagStyle(tag: string): string {
	if (facilityTypes.has(tag)) return "bg-forest-50 text-forest-700";
	return "bg-dotori-50 text-dotori-700";
}
