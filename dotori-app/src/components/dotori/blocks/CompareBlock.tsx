"use client";

import dynamic from "next/dynamic";
import type { CompareBlock as CompareBlockType } from "@/types/dotori";

const CompareTable = dynamic(
	() =>
		import("@/components/dotori/CompareTable").then((m) => m.CompareTable),
	{ loading: () => null },
);

export function CompareBlock({ block }: { block: CompareBlockType }) {
	return (
		<div className="mt-2">
			<CompareTable facilities={block.facilities} highlightBest />
		</div>
	);
}
