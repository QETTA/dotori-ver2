import type {
	ActionButton,
	ActionType,
	ChatBlock,
	Facility,
	FacilityType,
	MapMarker,
	UiBlockItem,
	UiBlockVariant,
	UiBlockTone,
	UiBlockDensity,
	UiBlockCtaMode,
	UiBlockAccentStyle,
} from "@/types/dotori";

type RawRecord = Record<string, unknown>;

const FALLBACK_BLOCK_CONTENT = "지원되지 않는 메시지입니다.";
const FALLBACK_ACTION: ActionType = "compare";
const FALLBACK_FACILITY_TYPE: FacilityType = "국공립";
const ALLOWED_FACILITY_TYPES: readonly FacilityType[] = [
	"국공립",
	"민간",
	"가정",
	"직장",
	"협동",
	"사회복지",
	"국립유치원",
	"공립유치원",
	"사립유치원",
];

const ALLOWED_ACTIONS: readonly ActionType[] = [
	"register_interest",
	"apply_waiting",
	"set_alert",
	"compare",
	"generate_checklist",
	"generate_report",
];

function asRecord(value: unknown): RawRecord | null {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as RawRecord)
		: null;
}

function asString(value: unknown): string | undefined {
	return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown): number {
	return typeof value === "number" ? value : Number(value) || 0;
}

function asStatus(value: unknown): "available" | "waiting" | "full" {
	return value === "waiting" || value === "full" ? value : "available";
}

function sanitizeFacilityType(value: unknown): FacilityType {
	const raw = asString(value);
	return ALLOWED_FACILITY_TYPES.includes(raw as FacilityType)
		? raw as FacilityType
		: FALLBACK_FACILITY_TYPE;
}

function sanitizeFacility(raw: unknown): Facility {
	const record = asRecord(raw);
	const id = asString(record?.id) || asString(record?._id) || "facility";

	return {
		id,
		name: asString(record?.name) || "시설",
		type: sanitizeFacilityType(record?.type),
		status: asStatus(asString(record?.status)),
		address: asString(record?.address) || "",
		lat: asNumber(record?.lat),
		lng: asNumber(record?.lng),
		distance: asString(record?.distance),
		phone: asString(record?.phone),
		capacity: {
			total: asNumber(asRecord(record?.capacity)?.total),
			current: asNumber(asRecord(record?.capacity)?.current),
			waiting: asNumber(asRecord(record?.capacity)?.waiting),
		},
		rating: asNumber(record?.rating),
		reviewCount: asNumber(record?.reviewCount),
		features: Array.isArray(record?.features)
			? record.features.filter((item): item is string => typeof item === "string")
			: [],
		lastSyncedAt: asString(record?.lastSyncedAt) || new Date(0).toISOString(),
		evaluationGrade: asString(record?.evaluationGrade),
	};
}

function sanitizeMapMarker(raw: unknown): MapMarker {
	const record = asRecord(raw);
	return {
		id: asString(record?.id) || asString(record?._id) || "facility",
		name: asString(record?.name) || "시설",
		lat: asNumber(record?.lat),
		lng: asNumber(record?.lng),
		status: asStatus(asString(record?.status)),
	};
}

function sanitizeActionType(value: unknown): ActionType {
	if (typeof value !== "string") {
		return FALLBACK_ACTION;
	}

	return ALLOWED_ACTIONS.includes(value as ActionType)
		? (value as ActionType)
		: FALLBACK_ACTION;
}

type ChecklistCategory = {
	title: string;
	items: {
		id: string;
		text: string;
		detail?: string;
		checked: boolean;
		required?: boolean;
	}[];
};

function normalizeChecklistCategories(raw: unknown): ChecklistCategory[] {
	if (!Array.isArray(raw)) {
		return [];
	}

	const categories: ChecklistCategory[] = [];

	for (const category of raw) {
		const record = asRecord(category);
		if (!record) continue;

		const title = asString(record.title);
		if (!title) continue;

		const items: ChecklistCategory["items"] = [];
		if (Array.isArray(record.items)) {
			for (const item of record.items) {
				const itemRecord = asRecord(item);
				if (!itemRecord) continue;
				const text = asString(itemRecord.text);
				if (!text) continue;

				items.push({
					id: asString(itemRecord.id) || "item",
					text,
					detail: asString(itemRecord.detail),
					checked: typeof itemRecord.checked === "boolean" ? itemRecord.checked : false,
					required:
						typeof itemRecord.required === "boolean"
							? itemRecord.required
							: undefined,
				});
			}
		}

		categories.push({
			title,
			items,
		});
	}

	return categories;
}

const ALLOWED_VARIANTS: readonly UiBlockVariant[] = ["default", "hero", "panel", "strip"];
const ALLOWED_TONES: readonly UiBlockTone[] = ["dotori", "forest", "amber", "neutral"];
const ALLOWED_DENSITIES: readonly UiBlockDensity[] = ["default", "compact", "spacious"];
const ALLOWED_CTA_MODES: readonly UiBlockCtaMode[] = ["inline", "footer", "hidden"];
const ALLOWED_ACCENT_STYLES: readonly UiBlockAccentStyle[] = ["bar", "glow", "none"];
const ALLOWED_MEDIA_SLOTS = [
	"none",
	"top",
	"bottom",
	"start",
	"end",
	"inline",
	"background",
] as const;
const FORM_LIKE_LAYOUT_ALIASES = new Set(["form-like", "form_like", "formlike", "form"]);
const MEDIA_SLOT_ALIASES: Record<string, (typeof ALLOWED_MEDIA_SLOTS)[number]> = {
	left: "start",
	right: "end",
	leading: "start",
	trailing: "end",
	header: "top",
	footer: "bottom",
	bg: "background",
};

function pickFirstDefined(...values: unknown[]): unknown {
	for (const value of values) {
		if (value !== undefined && value !== null) {
			return value;
		}
	}

	return undefined;
}

function sanitizeEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
	return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

function normalizeUiBlockLayout(value: unknown): "grid" | "list" {
	if (value === "grid" || value === "list") {
		return value;
	}

	const raw = asString(value);
	return raw && FORM_LIKE_LAYOUT_ALIASES.has(raw.toLowerCase()) ? "list" : "grid";
}

function normalizeLegacyVariantFromLayout(value: unknown): UiBlockVariant | undefined {
	if (value === "hero" || value === "panel" || value === "strip") {
		return value;
	}

	const raw = asString(value);
	if (!raw) {
		return undefined;
	}

	return FORM_LIKE_LAYOUT_ALIASES.has(raw.toLowerCase()) ? "panel" : undefined;
}

function normalizeUiBlockMediaSlot(value: unknown): (typeof ALLOWED_MEDIA_SLOTS)[number] {
	const raw = asString(value)?.trim().toLowerCase();
	if (!raw) {
		return "none";
	}

	const canonical = MEDIA_SLOT_ALIASES[raw] ?? raw;
	return ALLOWED_MEDIA_SLOTS.includes(canonical as (typeof ALLOWED_MEDIA_SLOTS)[number])
		? (canonical as (typeof ALLOWED_MEDIA_SLOTS)[number])
		: "none";
}

function normalizeUiBlockMedia(raw: unknown): RawRecord | undefined {
	const mediaSrc = asString(raw);
	if (mediaSrc) {
		return { src: mediaSrc };
	}

	const record = asRecord(raw);
	if (!record) {
		return undefined;
	}

	const src = asString(record.src) || asString(record.url);
	if (!src) {
		return undefined;
	}

	const media: RawRecord = { src };
	const alt = asString(record.alt);
	const kind = asString(record.kind) || asString(record.type);
	const fit = asString(record.fit);
	const width = asNumber(record.width);
	const height = asNumber(record.height);

	if (alt) media.alt = alt;
	if (kind) media.kind = kind;
	if (fit) media.fit = fit;
	if (width > 0) media.width = width;
	if (height > 0) media.height = height;

	return media;
}

function normalizeUiBlockItems(raw: unknown): UiBlockItem[] {
	if (!Array.isArray(raw)) {
		return [];
	}

	const items: UiBlockItem[] = [];

	for (const [index, item] of raw.entries()) {
		const record = asRecord(item);
		if (!record) continue;
		const title = asString(record.title);
		if (!title) continue;

		const actionId = asString(record.actionId);
		const href = asString(record.href);

		const normalizedItem: UiBlockItem & RawRecord = {
			id: asString(record.id) || `ui-item-${index}`,
			title,
			description: asString(record.description),
			badge: asString(record.badge),
			actionId,
			actionLabel: asString(record.actionLabel),
			href,
			meta: asString(record.meta),
			tone: typeof record.tone === "string" && ALLOWED_TONES.includes(record.tone as UiBlockTone)
				? (record.tone as UiBlockTone)
				: undefined,
		};

		const media = normalizeUiBlockMedia(
			pickFirstDefined(record.media, record.mediaAsset, record.image, record.thumbnail),
		);
		if (media) {
			normalizedItem.media = media;
		}

		items.push(normalizedItem);
	}

	return items;
}

export function normalizeQuickReplies(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map((item) => asString(item))
		.filter((item): item is string => typeof item === "string");
}

export function normalizeChatBlocks(rawBlocks: unknown): ChatBlock[] {
	if (!Array.isArray(rawBlocks)) {
		return [{ type: "text", content: FALLBACK_BLOCK_CONTENT }];
	}

	const blocks: ChatBlock[] = [];

	for (const block of rawBlocks) {
		const record = asRecord(block);
		if (!record || typeof record.type !== "string") {
			blocks.push({
				type: "text",
				content: FALLBACK_BLOCK_CONTENT,
			});
			continue;
		}

		switch (record.type) {
			case "text":
				blocks.push({
					type: "text",
					content: asString(record.content) || "",
				});
				break;
			case "facility_list": {
				const facilitiesRaw = Array.isArray(record.facilities)
					? record.facilities
					: [];
				blocks.push({
					type: "facility_list",
					facilities: facilitiesRaw.map(sanitizeFacility),
				});
				break;
			}
			case "map": {
				const centerRecord = asRecord(record.center);
				const center = centerRecord
					? {
							lat: asNumber(centerRecord.lat),
							lng: asNumber(centerRecord.lng),
					  }
					: { lat: 0, lng: 0 };
				const markersRaw = Array.isArray(record.markers) ? record.markers : [];
				blocks.push({
					type: "map",
					center,
					markers: markersRaw.map(sanitizeMapMarker),
				});
				break;
			}
			case "compare": {
				const facilitiesRaw = Array.isArray(record.facilities)
					? record.facilities
					: [];
				blocks.push({
					type: "compare",
					facilities: facilitiesRaw.map(sanitizeFacility),
					criteria: Array.isArray(record.criteria)
						? record.criteria
								.map((item) => asString(item))
								.filter((item): item is string => typeof item === "string")
						: [],
				});
				break;
			}
			case "actions": {
				const buttonsRaw = Array.isArray(record.buttons) ? record.buttons : [];
				const buttons: ActionButton[] = [];
				for (const [index, button] of buttonsRaw.entries()) {
					const buttonRecord = asRecord(button);
					if (!buttonRecord) continue;
					const action =
						buttonRecord.action != null
							? sanitizeActionType(buttonRecord.action)
							: undefined;
					buttons.push({
						id: asString(buttonRecord.id) || `action-${index}`,
						label: asString(buttonRecord.label) || "버튼",
						...(action != null && { action }),
						variant:
							buttonRecord.variant === "solid" || buttonRecord.variant === "outline"
								? buttonRecord.variant
								: "outline",
						icon: asString(buttonRecord.icon),
					});
				}
				blocks.push({
					type: "actions",
					buttons,
				});
				break;
			}
			case "checklist": {
				blocks.push({
					type: "checklist",
					title: asString(record.title) || "체크리스트",
					categories: normalizeChecklistCategories(record.categories),
				});
				break;
			}
			case "ui_block": {
				const layout = pickFirstDefined(record.layout, record.layoutType, record.layout_type);
				const uiBlock = {
					type: "ui_block",
					title: asString(record.title) || "추천 UI 블록",
					subtitle: asString(record.subtitle),
					layout: normalizeUiBlockLayout(layout),
					items: normalizeUiBlockItems(record.items),
					variant: sanitizeEnum(
						pickFirstDefined(record.variant, normalizeLegacyVariantFromLayout(layout)),
						ALLOWED_VARIANTS,
						"default",
					),
					tone: sanitizeEnum(record.tone, ALLOWED_TONES, "dotori"),
					density: sanitizeEnum(record.density, ALLOWED_DENSITIES, "default"),
					ctaMode: sanitizeEnum(
						pickFirstDefined(record.ctaMode, record.cta_mode),
						ALLOWED_CTA_MODES,
						"inline",
					),
					accentStyle: sanitizeEnum(
						pickFirstDefined(record.accentStyle, record.accent_style),
						ALLOWED_ACCENT_STYLES,
						"bar",
					),
				} as Extract<ChatBlock, { type: "ui_block" }> & RawRecord;

				uiBlock.mediaSlot = normalizeUiBlockMediaSlot(
					pickFirstDefined(record.mediaSlot, record.media_slot, asRecord(record.media)?.slot),
				);

				const media = normalizeUiBlockMedia(
					pickFirstDefined(record.media, record.mediaAsset, record.heroMedia),
				);
				if (media) {
					uiBlock.media = media;
				}

				blocks.push(uiBlock as Extract<ChatBlock, { type: "ui_block" }>);
				break;
			}
			default:
				blocks.push({
					type: "text",
					content: FALLBACK_BLOCK_CONTENT,
				});
				break;
		}
	}

	if (blocks.length === 0) {
		return [{ type: "text", content: FALLBACK_BLOCK_CONTENT }];
	}

	return blocks;
}
