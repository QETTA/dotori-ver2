"use client";

import { memo, useRef, type ReactNode } from "react";
import {
	motion,
	useAnimationControls,
	useIsomorphicLayoutEffect,
	useReducedMotion,
} from "motion/react";
import { usePathname } from "next/navigation";
import { BRAND } from "@/lib/brand-assets";
import { DS_STATUS } from '@/lib/design-system/tokens'

const PAGE_INITIAL = { opacity: 0, y: 6 } as const;
const PAGE_TARGET = { opacity: 1, y: 0 } as const;
const PAGE_TRANSITION = {
	duration: 0.22,
	ease: [0.25, 0.1, 0.25, 1] as const,
} as const;
const PAGE_STATUS_SIGNAL = Object.entries(DS_STATUS)
	.map(([status, token]) => `${status}:${token.label}`)
	.join("|");
const PAGE_SIGNAL_PROPS = {
	"data-dotori-brand": BRAND.symbol,
	"data-dotori-glass-surface": 'glass-card',
	"data-dotori-status-signal": PAGE_STATUS_SIGNAL,
} as const;

type PageTransitionProps = {
	children: ReactNode;
	className?: string;
};

function PageTransitionComponent({ children, className }: PageTransitionProps) {
	const pathname = usePathname();
	const shouldReduceMotion = useReducedMotion() === true;
	const controls = useAnimationControls();
	const isFirstMount = useRef(true);

	useIsomorphicLayoutEffect(() => {
		controls.stop();

		if (shouldReduceMotion) {
			return;
		}

		// 첫 마운트: SSR 콘텐츠가 이미 보이므로 opacity 0 설정 없이 즉시 visible
		// 라우트 변경 시에만 페이드 전환 애니메이션 적용
		if (isFirstMount.current) {
			isFirstMount.current = false;
			controls.set(PAGE_TARGET);
			return;
		}

		controls.set(PAGE_INITIAL);
		void controls.start(PAGE_TARGET, PAGE_TRANSITION);

		return () => {
			controls.stop();
		};
	}, [controls, pathname, shouldReduceMotion]);

	if (shouldReduceMotion) {
		return (
			<>
				<span aria-hidden="true" hidden {...PAGE_SIGNAL_PROPS} />
				<div className={className}>{children}</div>
			</>
		);
	}

	return (
		<>
			<span aria-hidden="true" hidden {...PAGE_SIGNAL_PROPS} />
			<motion.div initial={false} animate={controls} className={className}>
				{children}
			</motion.div>
		</>
	);
}

export const PageTransition = memo(PageTransitionComponent);
PageTransition.displayName = "PageTransition";
