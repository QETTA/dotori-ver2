"use client";

import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

let hasHydrated = false;

export function PageTransition({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const isInitialRender = useRef(!hasHydrated);

	useEffect(() => {
		hasHydrated = true;
	}, []);

	return (
		<motion.div
			key={pathname}
			initial={isInitialRender.current ? false : { opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{
				duration: 0.25,
				ease: [0.25, 0.1, 0.25, 1],
			}}
		>
			{children}
		</motion.div>
	);
}
