"use client";

import { MapEmbed } from "@/components/dotori/MapEmbed";
import type { MapBlock as MapBlockType } from "@/types/dotori";

export function MapBlock({ block }: { block: MapBlockType }) {
	return (
		<div className="mt-2">
			<MapEmbed facilities={block.markers} center={block.center} />
		</div>
	);
}
