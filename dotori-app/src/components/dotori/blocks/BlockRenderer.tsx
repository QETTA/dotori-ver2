"use client";

import { memo } from "react";
import dynamic from "next/dynamic";
import type { ChatBlock } from "@/types/dotori";
import { ActionsBlock } from "./ActionsBlock";
import { FacilityListBlock } from "./FacilityListBlock";
import { TextBlock } from "./TextBlock";

// Heavy sub-blocks: dynamically imported for code splitting
const MapBlock = dynamic(
	() => import("./MapBlock").then((m) => m.MapBlock),
	{ ssr: false, loading: () => null },
);
const CompareBlock = dynamic(
	() => import("./CompareBlock").then((m) => m.CompareBlock),
	{ loading: () => null },
);
const ChecklistBlock = dynamic(
	() => import("./ChecklistBlock").then((m) => m.ChecklistBlock),
	{ loading: () => null },
);

export const BlockRenderer = memo(function BlockRenderer({
	blocks,
	onAction,
}: {
	blocks: ChatBlock[];
	onAction?: (actionId: string) => void;
}) {
	return (
		<div className="space-y-4">
			{blocks.map((block, i) => {
				const key = `${block.type}-${i}`;
				switch (block.type) {
					case "text":
						return <TextBlock key={key} block={block} />;
					case "facility_list":
						return <FacilityListBlock key={key} block={block} />;
					case "map":
						return <MapBlock key={key} block={block} />;
					case "compare":
						return <CompareBlock key={key} block={block} />;
					case "actions":
						return (
							<ActionsBlock key={key} block={block} onAction={onAction} />
						);
					case "checklist":
						return <ChecklistBlock key={key} block={block} />;
					default:
						return null;
				}
			})}
		</div>
	);
});
