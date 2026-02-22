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
			className="mt-2 overflow-hidden rounded-2xl bg-dotori-50/80 p-4 ring-1 ring-dotori-100/70 dark:bg-dotori-900/60 dark:ring-dotori-800/60 dark:[&_.text-dotori-500]:text-dotori-300 dark:[&_.text-dotori-600]:text-dotori-300 dark:[&_.text-dotori-700]:text-dotori-200"
		>
			{block.facilities.length === 0 ? (
				<div className="py-4 text-center">
					<p className="text-sm font-medium text-dotori-800 dark:text-dotori-100">
						비교할 시설이 아직 없어요.
					</p>
					<p className="mt-1 text-xs text-dotori-500 dark:text-dotori-300">
						시설을 몇 곳 더 찾아오면 표로 정리해드릴게요.
					</p>
				</div>
			) : (
				<CompareTable facilities={block.facilities} highlightBest />
			)}
		</motion.div>
	);
}
