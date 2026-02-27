"use client";

/**
 * BlockRenderer — Chat block rendering engine
 *
 * hasDesignTokens: true  — DS_TYPOGRAPHY, DS_SURFACE
 * hasBrandSignal:  true  — DS_SURFACE.sunken (block container)
 */
import { memo, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { copy as COPY } from "@/lib/brand-copy";
import { DS_TYPOGRAPHY } from "@/lib/design-system/tokens";
import { DS_SURFACE } from "@/lib/design-system/page-tokens";
import type { ChatBlock } from "@/types/dotori";
import { Skeleton } from "@/components/dotori/Skeleton";
import { cn } from "@/lib/utils";
import { ActionsBlock } from "./ActionsBlock";
import { FacilityListBlock } from "./FacilityListBlock";
import { TextBlock } from "./TextBlock";
import { UiBlock } from "./UiBlock";

function BlockLoadingFallback() {
	return (
		<div className={cn('space-y-4', DS_SURFACE.sunken, 'rounded-xl p-3')}>
			<Skeleton variant="card" count={1} />
		</div>
	);
}

// Heavy sub-blocks: dynamically imported for code splitting
const MapBlock = dynamic(
	() => import("./MapBlock").then((m) => m.MapBlock),
	{ ssr: false, loading: BlockLoadingFallback },
);
const CompareBlock = dynamic(
	() => import("./CompareBlock").then((m) => m.CompareBlock),
	{ loading: BlockLoadingFallback },
);
const ChecklistBlock = dynamic(
	() => import("./ChecklistBlock").then((m) => m.ChecklistBlock),
	{ loading: BlockLoadingFallback },
);

const BLOCK_FALLBACK_COPY = {
	text: COPY.chat.panelDescription,
	unknown: COPY.emptyState.default.description,
} as const;

type BlockRenderContext = {
	key: string;
	onAction?: (actionId: string) => void;
};

type BlockRenderFn = (block: ChatBlock, context: BlockRenderContext) => ReactNode;

function defineBlockRenderer<T extends ChatBlock["type"]>(
	type: T,
	render: (
		block: Extract<ChatBlock, { type: T }>,
		context: BlockRenderContext,
	) => ReactNode,
): BlockRenderFn {
	return (block, context) => {
		if (block.type !== type) {
			return renderFallbackText(context.key, BLOCK_FALLBACK_COPY.unknown);
		}
		return render(block as Extract<ChatBlock, { type: T }>, context);
	};
}

function renderFallbackText(key: string, content: string) {
	return (
		<div key={key} className={cn("space-y-0", DS_TYPOGRAPHY.bodySm)}>
			<TextBlock block={{ type: "text", content }} />
		</div>
	);
}

const BLOCK_RENDERERS: Record<ChatBlock["type"], BlockRenderFn> = {
	text: defineBlockRenderer("text", (block, { key }) => {
		const content =
			block.content.trim().length > 0
				? block.content
				: BLOCK_FALLBACK_COPY.text;
		return <TextBlock key={key} block={{ ...block, content }} />;
	}),
	facility_list: defineBlockRenderer("facility_list", (block, { key }) => (
		<FacilityListBlock key={key} block={block} />
	)),
	map: defineBlockRenderer("map", (block, { key }) => (
		<MapBlock key={key} block={block} />
	)),
	compare: defineBlockRenderer("compare", (block, { key }) => (
		<CompareBlock key={key} block={block} />
	)),
	actions: defineBlockRenderer("actions", (block, { key, onAction }) =>
		block.buttons.length === 0 ? (
			renderFallbackText(key, BLOCK_FALLBACK_COPY.unknown)
		) : (
			<ActionsBlock key={key} block={block} onAction={onAction} />
		),
	),
	checklist: defineBlockRenderer("checklist", (block, { key }) =>
		block.categories.length === 0 ? (
			renderFallbackText(key, BLOCK_FALLBACK_COPY.unknown)
		) : (
			<ChecklistBlock key={key} block={block} />
		),
	),
	ui_block: defineBlockRenderer("ui_block", (block, { key, onAction }) => (
		<UiBlock key={key} block={block} onAction={onAction} />
	)),
};

function renderBlock(
	block: ChatBlock,
	index: number,
	onAction?: (actionId: string) => void,
) {
	const key = `${block.type}-${index}`;
	const renderer = (BLOCK_RENDERERS as Partial<Record<string, BlockRenderFn>>)[
		block.type
	];
	if (!renderer) {
		return renderFallbackText(key, BLOCK_FALLBACK_COPY.unknown);
	}
	return renderer(block, { key, onAction });
}

export const BlockRenderer = memo(function BlockRenderer({
	blocks,
	onAction,
}: {
	blocks: ChatBlock[];
	onAction?: (actionId: string) => void;
}) {
	if (blocks.length === 0) {
		return (
			<div className={'space-y-4'}>
				{renderFallbackText("fallback-empty", BLOCK_FALLBACK_COPY.text)}
			</div>
		);
	}

	return (
		<div className={'space-y-4'}>
			{blocks.map((block, i) => renderBlock(block, i, onAction))}
		</div>
	);
});
