"use client";

import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const reduceMotion = useReducedMotion();

	return (
		<motion.div
			key={pathname}
			initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{
				duration: reduceMotion ? 0 : 0.25,
				ease: [0.25, 0.1, 0.25, 1],
			}}
		>
			{children}
		</motion.div>
	);
}
