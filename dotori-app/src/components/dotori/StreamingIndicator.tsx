"use client";

import { motion } from "motion/react";

export function StreamingIndicator({ text }: { text?: string }) {
	return (
		<div className="flex items-center gap-1.5">
			{[0, 1, 2].map((i) => (
				<motion.span
					key={i}
					className="h-2 w-2 rounded-full bg-forest-500"
					animate={{ y: [0, -6, 0] }}
					transition={{
						repeat: Infinity,
						duration: 0.6,
						delay: i * 0.15,
						ease: "easeInOut",
					}}
				/>
			))}
			{text !== undefined ? (
				<span className="ml-1 text-[15px] text-dotori-500">{text}</span>
			) : (
				<span className="ml-1 text-[15px] text-dotori-500">
					토리가 분석 중이에요...
				</span>
			)}
		</div>
	);
}
