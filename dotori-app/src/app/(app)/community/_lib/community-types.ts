import type { CommunityPost } from "@/types/dotori";

export type CommunityPostWithViews = CommunityPost & { viewCount?: number };

export interface PostsResponse {
	data: CommunityPostWithViews[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export interface UserMeResponse {
	data: {
		gpsVerified: boolean;
		region?: { sido: string; sigungu: string; dong?: string };
	};
}

export interface ReverseGeocodeResponse {
	data: { sido: string; sigungu: string; dong: string };
}
