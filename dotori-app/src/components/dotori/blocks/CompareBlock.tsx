"use client";

import dynamic from "next/dynamic";
import type { CompareBlock as CompareBlockType } from "@/types/dotori";
import { motion } from "motion/react";
import { fadeUp } from "@/lib/motion";

const CompareTable = dynamic(
	() =>
		import("@/components/dotori/CompareTable").then((m) => m.CompareTable),
	{ loading: () => null },
);

export function CompareBlock({ block }: { block: CompareBlockType }) {
	return (
		<motion.div
			{...fadeUp}
			className="glass-card mt-2 overflow-hidden rounded-2xl border border-dotori-100 px-4 py-3 dark:border-dotori-800 dark:[&_.text-dotori-500]:text-dotori-300 dark:[&_.text-dotori-600]:text-dotori-300 dark:[&_.text-dotori-700]:text-dotori-200"
		>
			<CompareTable facilities={block.facilities} highlightBest />
		</motion.div>
	);
}
