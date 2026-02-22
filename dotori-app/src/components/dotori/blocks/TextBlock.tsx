"use client";

import type { TextBlock as TextBlockType } from "@/types/dotori";
import { motion } from "motion/react";
import { fadeUp } from "@/lib/motion";

export function TextBlock({ block }: { block: TextBlockType }) {
	return (
		<motion.p
			{...fadeUp}
			className="text-base leading-relaxed text-dotori-800 dark:text-dotori-100"
		>
			{block.content}
		</motion.p>
	);
}
