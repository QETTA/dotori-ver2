"use client";

import { memo, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";

const PAGE_INITIAL = { opacity: 0, y: 8 } as const;
const PAGE_TARGET = { opacity: 1, y: 0 } as const;
const PAGE_TRANSITION = {
	duration: 0.25,
	ease: [0.25, 0.1, 0.25, 1] as const,
} as const;
const NO_MOTION_TRANSITION = { duration: 0 } as const;

type PageTransitionProps = {
	children: ReactNode;
};

function PageTransitionComponent({ children }: PageTransitionProps) {
	const pathname = usePathname();
	const reduceMotion = useReducedMotion();

	return (
		<motion.div
			key={pathname}
			initial={reduceMotion ? PAGE_TARGET : PAGE_INITIAL}
			animate={PAGE_TARGET}
			transition={reduceMotion ? NO_MOTION_TRANSITION : PAGE_TRANSITION}
		>
			{children}
		</motion.div>
	);
}

export const PageTransition = memo(PageTransitionComponent);
PageTransition.displayName = "PageTransition";
