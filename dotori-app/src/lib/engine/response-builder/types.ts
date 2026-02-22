export interface ConversationContext {
	previousMessages?: { role: string; content: string }[];
	mentionedFacilityIds?: string[];
	mentionedFacilityNames?: string[];
	establishedRegion?: {
		sido?: string;
		sigungu?: string;
		confidence?: number;
	};
	establishedFacilityType?: string;
}

export type UserContext = {
	nickname?: string;
	children?: Array<{ name: string; birthDate: string }>;
	region?: { sido: string; sigungu: string };
};

export type TransferScenario =
	| "반편성"
	| "교사교체"
	| "설명회실망"
	| "국공립당첨"
	| "이사예정"
	| "일반";

export type RegionMatch = { sido: string; sigungu: string; confidence: number };
export type ExtractedRegion = {
	sido?: string;
	sigungu?: string;
	confidence: number;
};
