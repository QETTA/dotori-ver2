"use client";

import type { TextBlock as TextBlockType } from "@/types/dotori";
import { motion } from "motion/react";
import { fadeUp } from "@/lib/motion";

export function TextBlock({ block }: { block: TextBlockType }) {
	const paragraphs = block.content
		.split(/\n+/)
		.map((paragraph) => paragraph.trim())
		.filter(Boolean);
	const content = paragraphs.length > 0 ? paragraphs : [block.content];

	return (
		<motion.div
			{...fadeUp}
			className="space-y-2.5 text-base leading-relaxed text-dotori-800 dark:text-dotori-100"
		>
			{content.map((paragraph, index) => (
				<p key={`${paragraph}-${index}`}>{paragraph}</p>
			))}
		</motion.div>
	);
}
