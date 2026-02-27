"use client";

import { memo } from "react";
import dynamic from "next/dynamic";
import { copy as COPY } from "@/lib/brand-copy";
import type { ChatBlock } from "@/types/dotori";
import { Skeleton } from "@/components/dotori/Skeleton";
import { ActionsBlock } from "./ActionsBlock";
import { FacilityListBlock } from "./FacilityListBlock";
import { TextBlock } from "./TextBlock";

function BlockLoadingFallback() {
	return (
		<div className={'space-y-4'}>
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

function renderFallbackText(key: string, content: string) {
	return <TextBlock key={key} block={{ type: "text", content }} />;
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
			{blocks.map((block, i) => {
				const key = `${block.type}-${i}`;
				switch (block.type) {
					case "text": {
						const content =
							block.content.trim().length > 0
								? block.content
								: BLOCK_FALLBACK_COPY.text;
						return <TextBlock key={key} block={{ ...block, content }} />;
					}
					case "facility_list":
						return <FacilityListBlock key={key} block={block} />;
					case "map":
						return <MapBlock key={key} block={block} />;
					case "compare":
						return <CompareBlock key={key} block={block} />;
					case "actions":
						if (block.buttons.length === 0) {
							return renderFallbackText(key, BLOCK_FALLBACK_COPY.unknown);
						}
						return (
							<ActionsBlock key={key} block={block} onAction={onAction} />
						);
					case "checklist":
						if (block.categories.length === 0) {
							return renderFallbackText(key, BLOCK_FALLBACK_COPY.unknown);
						}
						return <ChecklistBlock key={key} block={block} />;
					default:
						return renderFallbackText(key, BLOCK_FALLBACK_COPY.unknown);
				}
			})}
		</div>
	);
});
