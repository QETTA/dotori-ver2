"use client";

import { Button } from "@/components/catalyst/button";
import { BRAND } from "@/lib/brand-assets";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";

const PAGE_CONTENT_INITIAL = { opacity: 0, y: 10 } as const;
const PAGE_CONTENT_ANIMATE = { opacity: 1, y: 0 } as const;
const NO_MOTION_TRANSITION = { duration: 0 } as const;
const PAGE_CONTENT_TRANSITION = { duration: 0.45, ease: "easeOut" } as const;

function AuthErrorBackgroundDecoration() {
	return (
		<div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
			<div className="absolute inset-0 bg-gradient-to-b from-dotori-100 via-dotori-50 to-white dark:from-dotori-900 dark:via-dotori-950 dark:to-dotori-950" />

			<svg
				className="absolute -left-14 -top-14 h-56 w-56 text-dotori-200/50 dark:text-dotori-700/35"
				viewBox="0 0 200 200"
				fill="currentColor"
			>
				<circle cx="100" cy="100" r="100" />
			</svg>

			<svg
				className="absolute -right-10 bottom-28 h-40 w-40 text-dotori-100/70 dark:text-dotori-800/45"
				viewBox="0 0 200 200"
				fill="currentColor"
			>
				<circle cx="100" cy="100" r="100" />
			</svg>
		</div>
	);
}

export default function AuthError({
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const shouldReduceMotion = useReducedMotion() === true;

	const content = (
		<div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col items-center px-6 text-center">
			<div className="flex w-full flex-1 flex-col items-center justify-center">
				<div className="w-full">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={BRAND.lockupHorizontalKr} alt="도토리" className="mx-auto h-9 w-auto" />
				</div>

				<div className="mt-6 inline-flex items-center gap-2 rounded-full border border-dotori-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-dotori-700 shadow-sm backdrop-blur dark:border-dotori-800 dark:bg-dotori-950/60 dark:text-dotori-100">
					<span
						className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-dotori-200 text-xs leading-none font-bold text-dotori-700 dark:bg-dotori-800 dark:text-dotori-100"
						aria-hidden="true"
					>
						!
					</span>
					로그인이 잠깐 막혔어요
				</div>

				<h2 className="mt-4 text-xl font-bold text-dotori-900 dark:text-dotori-50">
					로그인 중 문제가 발생했어요
				</h2>
				<p className="mt-2 text-sm leading-relaxed text-dotori-500 dark:text-dotori-200/80">
					잠시 후 다시 시도해주세요. 계속되면 홈으로 이동해 다시 로그인해보세요.
				</p>

				<div className="mt-8 w-full rounded-3xl border border-dotori-100 bg-white/85 p-5 text-left shadow-[0_18px_50px_-30px_rgba(97,64,46,0.55)] backdrop-blur dark:border-dotori-800 dark:bg-dotori-950/80 dark:shadow-none">
					<div className="grid gap-3">
						<Button
							onClick={reset}
							color="dotori"
							className="w-full min-h-11 text-base font-semibold transition-transform active:scale-[0.97]"
						>
							다시 시도
						</Button>
						<Link
							href="/"
							className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-dotori-200 bg-white/70 px-6 text-base font-semibold text-dotori-700 shadow-sm backdrop-blur transition-colors transition-transform hover:bg-white/90 active:scale-[0.97] dark:border-dotori-800 dark:bg-dotori-950/55 dark:text-dotori-100 dark:hover:bg-dotori-950/70"
						>
							홈으로
						</Link>
					</div>
				</div>
			</div>

			<p className="mt-4 pb-6 pt-4 text-xs leading-relaxed text-dotori-400 dark:text-dotori-300">
				문제가 계속되면 앱을 새로고침하거나, 잠시 뒤 다시 시도해주세요.
			</p>
		</div>
	);

	return (
		<div className="relative min-h-dvh overflow-x-hidden bg-dotori-50 pb-[env(safe-area-inset-bottom)] dark:bg-dotori-900">
			<AuthErrorBackgroundDecoration />

			{shouldReduceMotion ? (
				content
			) : (
				<motion.div
					initial={PAGE_CONTENT_INITIAL}
					animate={PAGE_CONTENT_ANIMATE}
					transition={shouldReduceMotion ? NO_MOTION_TRANSITION : PAGE_CONTENT_TRANSITION}
				>
					{content}
				</motion.div>
			)}
		</div>
	);
}
