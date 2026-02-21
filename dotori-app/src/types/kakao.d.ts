export {};

declare global {
	/* ── Kakao JS SDK (Share, Auth, Channel) ── */
	interface KakaoStatic {
		init: (appKey: string) => void;
		isInitialized: () => boolean;
		cleanup: () => void;
		Share: {
			sendDefault: (settings: KakaoShareSettings) => void;
			createDefaultButton: (settings: KakaoShareButtonSettings) => void;
			sendCustom: (settings: {
				templateId: number;
				templateArgs?: Record<string, string>;
			}) => void;
		};
		Channel: {
			addChannel: (settings: { channelPublicId: string }) => void;
			chat: (settings: { channelPublicId: string }) => void;
			followChannel: (settings: {
				channelPublicId: string;
			}) => Promise<{
				response: { status: "success" | "fail"; channel_public_id: string };
			}>;
			createAddChannelButton: (settings: {
				container: string | HTMLElement;
				channelPublicId: string;
				size?: "small" | "large";
				supportMultipleDensities?: boolean;
			}) => void;
			createChatButton: (settings: {
				container: string | HTMLElement;
				channelPublicId: string;
				title?: "consult" | "question";
				size?: "small" | "large";
				color?: "yellow" | "black";
				shape?: "pc" | "mobile";
				supportMultipleDensities?: boolean;
			}) => void;
		};
		Auth: {
			authorize: (settings: {
				redirectUri: string;
				scope?: string;
				serviceTerms?: string;
				state?: string;
				prompt?: "login" | "none" | "create";
			}) => void;
			setAccessToken: (token: string) => void;
			getAccessToken: () => string | null;
			logout: () => Promise<void>;
		};
	}

	interface KakaoShareSettings {
		objectType: "feed" | "list" | "location" | "commerce" | "text";
		content: {
			title: string;
			description: string;
			imageUrl: string;
			imageWidth?: number;
			imageHeight?: number;
			link: {
				mobileWebUrl: string;
				webUrl: string;
			};
		};
		social?: {
			likeCount?: number;
			commentCount?: number;
			sharedCount?: number;
		};
		buttons?: Array<{
			title: string;
			link: {
				mobileWebUrl: string;
				webUrl: string;
			};
		}>;
		installTalk?: boolean;
	}

	interface KakaoShareButtonSettings extends KakaoShareSettings {
		container: string;
	}

	/* ── Kakao Maps SDK v3 Types ── */
	interface KakaoMapsMap {
		setCenter(latlng: KakaoMapsLatLng): void;
		setLevel(level: number): void;
		setBounds(bounds: KakaoMapsLatLngBounds, paddingTop?: number, paddingRight?: number, paddingBottom?: number, paddingLeft?: number): void;
		relayout(): void;
	}

	interface KakaoMapsLatLng {
		getLat(): number;
		getLng(): number;
	}

	interface KakaoMapsLatLngBounds {
		extend(latlng: KakaoMapsLatLng): void;
	}

	interface KakaoMapsMarker {
		setMap(map: KakaoMapsMap | null): void;
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	interface KakaoMapsMarkerImage {}
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	interface KakaoMapsSize {}
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	interface KakaoMapsPoint {}

	interface KakaoMapsStatic {
		load(callback: () => void): void;
		Map: new (container: HTMLElement, options: { center: KakaoMapsLatLng; level: number }) => KakaoMapsMap;
		LatLng: new (lat: number, lng: number) => KakaoMapsLatLng;
		LatLngBounds: new (sw?: KakaoMapsLatLng, ne?: KakaoMapsLatLng) => KakaoMapsLatLngBounds;
		Marker: new (options: { map?: KakaoMapsMap; position: KakaoMapsLatLng; image?: KakaoMapsMarkerImage; title?: string }) => KakaoMapsMarker;
		MarkerImage: new (src: string, size: KakaoMapsSize, options?: { offset?: KakaoMapsPoint }) => KakaoMapsMarkerImage;
		Size: new (width: number, height: number) => KakaoMapsSize;
		Point: new (x: number, y: number) => KakaoMapsPoint;
		event: {
			addListener(target: KakaoMapsMarker | KakaoMapsMap, type: string, handler: () => void): void;
			removeListener(target: KakaoMapsMarker | KakaoMapsMap, type: string, handler: () => void): void;
		};
	}

	interface Window {
		Kakao: KakaoStatic;
		kakao: {
			maps: KakaoMapsStatic;
		};
	}

	const kakao: {
		maps: KakaoMapsStatic;
	};
}
