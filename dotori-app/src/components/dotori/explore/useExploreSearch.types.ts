import type { ExploreSortKey } from "./explore-constants";
import type { Facility, FacilityStatus } from "@/types/dotori";

export interface GPSState {
	lat: number | null;
	lng: number | null;
	loading: boolean;
}

export interface ExploreMapPoint {
	id: string;
	name: string;
	lat: number;
	lng: number;
	status: FacilityStatus;
}

export interface ExploreSearchHeaderState {
	searchInput: string;
	toOnly: boolean;
	sortBy: ExploreSortKey;
	selectedTypes: string[];
	selectedSido: string;
	selectedSigungu: string;
	showFilters: boolean;
	showMap: boolean;
	resultLabel: string;
	activeFilterCount: number;
	toCount: number;
	recentSearches: string[];
	sidoOptions: string[];
	sigunguOptions: string[];
	isLoadingSido: boolean;
	isLoadingSigungu: boolean;
	isGpsLoading: boolean;
	isMapAvailable: boolean;
	mapDisabledReason: string | null;
}

export interface ExploreSearchHeaderActions {
	onSearchInputChange: (value: string) => void;
	onSubmitSearch: () => void;
	onApplySearch: (term: string) => void;
	onClearSearch: () => void;
	onClearRecentSearches: () => void;
	onToggleFilters: () => void;
	onToggleMap: () => void;
	onToggleType: (type: string) => void;
	onToggleToOnly: () => void;
	onSortChange: (nextSort: ExploreSortKey) => void;
	onSidoChange: (nextSido: string) => void;
	onSigunguChange: (nextSigungu: string) => void;
	onUseCurrentLocation: () => void;
	onResetFilters: () => void;
}

export interface ExploreResultState {
	facilities: Facility[];
	isLoading: boolean;
	isLoadingMore: boolean;
	error: string | null;
	isTimeout: boolean;
	hasMore: boolean;
	hasSearchInput: boolean;
	hasFilterApplied: boolean;
	debouncedSearch: string;
	sortBy: ExploreSortKey;
	vacancyOnly: boolean;
	chatPromptHref: string;
}

export interface ExploreResultActions {
	onRetry: () => void;
	onLoadMore: () => void;
	onResetSearch: () => void;
	onResetFilters: () => void;
	onOpenFilters: () => void;
	onOpenMap: () => void;
}

export interface ExploreResultInteraction {
	loadingAction: string | null;
	onRegisterInterest: (facilityId: string) => void;
	onApplyWaiting: (facilityId: string) => void;
}

export interface ExploreMapState {
	showMap: boolean;
	hasMapContent: boolean;
	facilities: ExploreMapPoint[];
	center: { lat: number; lng: number } | undefined;
	userLocation: { lat: number; lng: number } | undefined;
}

export interface UseExploreSearchReturn {
	headerState: ExploreSearchHeaderState;
	headerActions: ExploreSearchHeaderActions;
	resultState: ExploreResultState;
	resultActions: ExploreResultActions;
	resultInteraction: ExploreResultInteraction;
	mapState: ExploreMapState;
}
