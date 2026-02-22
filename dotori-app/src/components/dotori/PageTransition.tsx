"use client";

import { memo, type ReactNode } from "react";
import {
	motion,
	useAnimationControls,
	useIsomorphicLayoutEffect,
	useReducedMotion,
} from "motion/react";
import { usePathname } from "next/navigation";

const PAGE_INITIAL = { opacity: 0, y: 8 } as const;
const PAGE_TARGET = { opacity: 1, y: 0 } as const;
const PAGE_TRANSITION = {
	duration: 0.25,
	ease: [0.25, 0.1, 0.25, 1] as const,
} as const;

type PageTransitionProps = {
	children: ReactNode;
	className?: string;
};

function PageTransitionComponent({ children, className }: PageTransitionProps) {
	const pathname = usePathname();
	const shouldReduceMotion = useReducedMotion() === true;
	const controls = useAnimationControls();

	useIsomorphicLayoutEffect(() => {
		controls.stop();

		if (shouldReduceMotion) {
			return;
		}

		controls.set(PAGE_INITIAL);
		void controls.start(PAGE_TARGET, PAGE_TRANSITION);

		return () => {
			controls.stop();
		};
	}, [controls, pathname, shouldReduceMotion]);

	if (shouldReduceMotion) {
		return <div className={className}>{children}</div>;
	}

	return (
		<motion.div initial={false} animate={controls} className={className}>
			{children}
		</motion.div>
	);
}

export const PageTransition = memo(PageTransitionComponent);
PageTransition.displayName = "PageTransition";
