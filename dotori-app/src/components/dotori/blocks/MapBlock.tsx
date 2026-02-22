"use client";

import { MapEmbed } from "@/components/dotori/MapEmbed";
import type { MapBlock as MapBlockType } from "@/types/dotori";

export function MapBlock({ block }: { block: MapBlockType }) {
	return (
		<div className="mt-2 overflow-hidden rounded-2xl bg-dotori-50/80 p-4 ring-1 ring-dotori-100/70 dark:bg-dotori-900/60 dark:ring-dotori-800/60">
			<div className="overflow-hidden rounded-xl">
				<MapEmbed facilities={block.markers} center={block.center} />
			</div>
		</div>
	);
}
