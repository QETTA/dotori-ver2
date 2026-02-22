"use client";

import { motion } from "motion/react";
import { BRAND } from "@/lib/brand-assets";

export function StreamingIndicator({ text }: { text?: string }) {
	const message = text ?? "토리가 생각 중이에요...";

	return (
		<div className="flex items-center gap-2 rounded-full bg-dotori-50 px-2.5 py-1.5 dark:bg-dotori-900">
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img src={BRAND.symbol} alt="" className="h-5 w-5 animate-pulse" />
			<div className="flex items-end gap-1">
				{[0, 1, 2].map((i) => (
					<motion.span
						key={i}
						className="h-3 w-1.5 rounded-full bg-gradient-to-t from-forest-500 to-dotori-300"
						animate={{ scaleY: [0.35, 1, 0.35], opacity: [0.4, 1, 0.4] }}
						transition={{
							repeat: Infinity,
							duration: 0.72,
							delay: i * 0.12,
							ease: "easeInOut",
						}}
						style={{ transformOrigin: "center bottom" }}
					/>
				))}
			</div>
			<span className="text-sm font-medium text-forest-700 dark:text-forest-200">{message}</span>
		</div>
	);
}
