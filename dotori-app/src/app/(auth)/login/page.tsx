"use client";

import { Button } from "@/components/catalyst/button";
import { BRAND } from "@/lib/brand-assets";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { memo, Suspense, useCallback, useMemo, useState } from "react";

const PAGE_CONTENT_INITIAL = { opacity: 0, y: 10 } as const;
const PAGE_CONTENT_ANIMATE = { opacity: 1, y: 0 } as const;
const FADE_UP_INITIAL = { opacity: 0, y: 12 } as const;
const FADE_UP_ANIMATE = { opacity: 1, y: 0 } as const;
const LOGIN_CARD_INITIAL = { opacity: 0, y: 16 } as const;
const LOGIN_CARD_ANIMATE = { opacity: 1, y: 0 } as const;
const FADE_IN_INITIAL = { opacity: 0 } as const;
const FADE_IN_ANIMATE = { opacity: 1 } as const;
const ERROR_INITIAL = { opacity: 0, scale: 0.98 } as const;
const ERROR_ANIMATE = { opacity: 1, scale: 1 } as const;

const NO_MOTION_TRANSITION = { duration: 0 } as const;
const PAGE_CONTENT_TRANSITION = { duration: 0.5, ease: "easeOut" } as const;
const TAGLINE_TRANSITION = { delay: 0.1, duration: 0.5, ease: "easeOut" } as const;
const TITLE_TRANSITION = { delay: 0.2, duration: 0.5, ease: "easeOut" } as const;
const SUBTITLE_TRANSITION = { delay: 0.3, duration: 0.5, ease: "easeOut" } as const;
const ERROR_TRANSITION = { duration: 0.25, ease: "easeOut" } as const;
const LOGIN_CARD_TRANSITION = {
	delay: 0.2,
	duration: 0.55,
	ease: "easeOut",
} as const;
const GUEST_LINK_TRANSITION = { delay: 0.55, duration: 0.4 } as const;
const TERMS_TRANSITION = { delay: 0.62, duration: 0.4 } as const;

const AUTH_ERROR_MESSAGES: Record<string, string> = {
	OAuthSignin: "카카오 로그인 연결에 문제가 있어요. 잠시 후 다시 시도해주세요.",
	OAuthCallback: "카카오 로그인 연결에 문제가 있어요. 잠시 후 다시 시도해주세요.",
	Default: "로그인에 실패했어요. 다시 시도해주세요.",
};

function getAuthErrorMessage(error: string | null) {
	if (!error) return null;
	return AUTH_ERROR_MESSAGES[error] ?? AUTH_ERROR_MESSAGES.Default;
}

function LoginPageErrorFallback() {
	return (
		<div className="mt-10 w-full rounded-3xl border border-dotori-100 bg-white/85 p-6 text-center shadow-[0_18px_50px_-30px_rgba(97,64,46,0.55)]">
			<div className="h-4 w-2/3 motion-safe:animate-pulse rounded-full bg-dotori-100/80" />
			<div className="mt-4 h-11 motion-safe:animate-pulse rounded-xl bg-dotori-100/80" />
		</div>
	);
}

const LoginBackgroundDecoration = memo(function LoginBackgroundDecoration() {
	return (
		<div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
			<div className="absolute inset-0 bg-gradient-to-b from-dotori-100 via-dotori-50 to-white" />

			<svg
				className="absolute -left-16 -top-16 h-64 w-64 text-dotori-200/50"
				viewBox="0 0 200 200"
				fill="currentColor"
			>
				<circle cx="100" cy="100" r="100" />
			</svg>

			<svg
				className="absolute -right-10 top-12 h-40 w-40 text-dotori-200/30"
				viewBox="0 0 200 200"
				fill="currentColor"
			>
				<circle cx="100" cy="100" r="100" />
			</svg>

			<svg
				className="absolute bottom-32 left-6 h-20 w-20 text-dotori-200/20"
				viewBox="0 0 200 200"
				fill="currentColor"
			>
				<circle cx="100" cy="100" r="100" />
			</svg>

			<svg
				className="absolute -right-8 bottom-48 h-32 w-32 text-dotori-100/60"
				viewBox="0 0 200 200"
				fill="currentColor"
			>
				<circle cx="100" cy="100" r="100" />
			</svg>
		</div>
	);
});

LoginBackgroundDecoration.displayName = "LoginBackgroundDecoration";

type MotionPreferenceProps = {
	shouldReduceMotion: boolean;
};

type LoginErrorAlertProps = MotionPreferenceProps & {
	message: string;
};

type LoginCardProps = MotionPreferenceProps & {
	isLoading: boolean;
	onKakaoLogin: () => void;
};

const LoginIntro = memo(function LoginIntro({
	shouldReduceMotion,
}: MotionPreferenceProps) {
	return (
		<>
			<div className="mt-6 w-full">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src={BRAND.lockupHorizontalKr} alt="도토리" className="mx-auto h-9 w-auto" />
			</div>

			<motion.p
				initial={shouldReduceMotion ? false : FADE_UP_INITIAL}
				animate={FADE_UP_ANIMATE}
				transition={shouldReduceMotion ? NO_MOTION_TRANSITION : TAGLINE_TRANSITION}
				className="mt-8 text-sm font-semibold tracking-wide text-dotori-500"
			>
				이동 고민, 토리가 해결해드려요
			</motion.p>
			<motion.p
				initial={shouldReduceMotion ? false : FADE_UP_INITIAL}
				animate={FADE_UP_ANIMATE}
				transition={shouldReduceMotion ? NO_MOTION_TRANSITION : TITLE_TRANSITION}
				className="mt-3 text-lg leading-relaxed font-bold text-dotori-700"
			>
				반편성 불만·교사 교체·빈자리 탐색, 도토리가 한 번에
			</motion.p>
			<motion.p
				initial={shouldReduceMotion ? false : FADE_UP_INITIAL}
				animate={FADE_UP_ANIMATE}
				transition={shouldReduceMotion ? NO_MOTION_TRANSITION : SUBTITLE_TRANSITION}
				className="mt-2 text-xs text-dotori-400"
			>
				전국 20,000+ 어린이집 데이터
			</motion.p>
		</>
	);
});

LoginIntro.displayName = "LoginIntro";

const LoginErrorAlert = memo(function LoginErrorAlert({
	message,
	shouldReduceMotion,
}: LoginErrorAlertProps) {
	return (
		<motion.div
			initial={shouldReduceMotion ? false : ERROR_INITIAL}
			animate={ERROR_ANIMATE}
			transition={shouldReduceMotion ? NO_MOTION_TRANSITION : ERROR_TRANSITION}
			className="mt-6 w-full max-w-md rounded-2xl border border-dotori-300 bg-dotori-100/90 px-4 py-3 text-left shadow-sm"
			role="alert"
			aria-live="assertive"
			aria-atomic="true"
		>
			<div className="inline-flex items-center gap-2">
				<span
					className="inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-dotori-200 text-xs font-bold text-dotori-700"
					aria-hidden="true"
				>
					!
				</span>
				<p className="text-xs font-medium leading-relaxed text-dotori-700">
					{message}
				</p>
			</div>
		</motion.div>
	);
});

LoginErrorAlert.displayName = "LoginErrorAlert";

const LoginCard = memo(function LoginCard({
	isLoading,
	onKakaoLogin,
	shouldReduceMotion,
}: LoginCardProps) {
	return (
		<motion.div
			initial={shouldReduceMotion ? false : LOGIN_CARD_INITIAL}
			animate={LOGIN_CARD_ANIMATE}
			transition={shouldReduceMotion ? NO_MOTION_TRANSITION : LOGIN_CARD_TRANSITION}
			className="mt-7 w-full rounded-3xl border border-dotori-100 bg-white/85 p-6 shadow-[0_18px_50px_-30px_rgba(97,64,46,0.55)] backdrop-blur"
		>
			<p className="text-xs leading-relaxed text-dotori-500">
				빠르게 시작하고, 서비스와 바로 연결해보세요.
			</p>
			<Button
				onClick={onKakaoLogin}
				disabled={isLoading}
				aria-busy={isLoading}
				aria-label="카카오 계정으로 로그인"
				color="amber"
				className={cn(
					"mt-5 w-full gap-2.5 px-6 py-4.5 text-base font-semibold",
					isLoading && "opacity-90",
				)}
			>
				{isLoading ? (
					<span
						className="mr-2 inline-flex h-4 w-4 flex-shrink-0 motion-safe:animate-spin rounded-full border-2 border-dotori-200 border-t-dotori-700"
						aria-hidden="true"
					/>
				) : (
					<span
						className="mr-2 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-dotori-700/15 text-xs font-bold text-dotori-700"
						aria-hidden="true"
					>
						◯
					</span>
				)}
				{isLoading ? "로그인 처리 중..." : "카카오 로그인"}
			</Button>
			<p className="mt-2 text-xs font-medium text-dotori-400">
				카카오 계정으로 1초 만에 시작
			</p>
		</motion.div>
	);
});

LoginCard.displayName = "LoginCard";

const LoginFooter = memo(function LoginFooter({
	shouldReduceMotion,
}: MotionPreferenceProps) {
	return (
		<>
			<motion.div
				initial={shouldReduceMotion ? false : FADE_IN_INITIAL}
				animate={FADE_IN_ANIMATE}
				transition={shouldReduceMotion ? NO_MOTION_TRANSITION : GUEST_LINK_TRANSITION}
			>
				<Link
					href="/"
					className="mt-7 inline-block py-2.5 text-sm text-dotori-500 transition-colors hover:text-dotori-700"
				>
					로그인 없이 둘러보기
				</Link>
			</motion.div>

			<motion.p
				initial={shouldReduceMotion ? false : FADE_IN_INITIAL}
				animate={FADE_IN_ANIMATE}
				transition={shouldReduceMotion ? NO_MOTION_TRANSITION : TERMS_TRANSITION}
				className="mt-auto pt-10 pb-6 text-xs leading-relaxed text-dotori-300"
			>
				로그인 시{" "}
				<Link href="/my/terms" className="font-medium underline">
					서비스 이용약관
				</Link>
				{" "}및{" "}
				<Link href="/my/terms" className="font-medium underline">
					개인정보처리방침
				</Link>
				에 동의합니다
			</motion.p>
		</>
	);
});

LoginFooter.displayName = "LoginFooter";

export default function LoginPage() {
	return (
		<Suspense fallback={<LoginPageErrorFallback />}>
			<LoginPageClient />
		</Suspense>
	);
}

function LoginPageClient() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const shouldReduceMotion = useReducedMotion() === true;
	const searchParams = useSearchParams();
	const errorCode = searchParams.get("error");
	const queryError = useMemo(() => getAuthErrorMessage(errorCode), [errorCode]);
	const visibleError = queryError ?? error;

	const handleKakaoLogin = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const result = await signIn("kakao", {
				callbackUrl: "/",
				redirect: false,
			});
			if (result?.error) {
				setError("로그인에 실패했어요. 다시 시도해주세요");
			} else if (result?.url) {
				window.location.href = result.url;
			}
		} catch {
			setError("로그인에 실패했어요. 다시 시도해주세요");
		} finally {
			setIsLoading(false);
		}
	}, []);

	const pageContent = (
		<>
			<LoginIntro shouldReduceMotion={shouldReduceMotion} />
			{visibleError && (
				<LoginErrorAlert
					message={visibleError}
					shouldReduceMotion={shouldReduceMotion}
				/>
			)}
			<LoginCard
				isLoading={isLoading}
				onKakaoLogin={handleKakaoLogin}
				shouldReduceMotion={shouldReduceMotion}
			/>
			<LoginFooter shouldReduceMotion={shouldReduceMotion} />
		</>
	);

	return (
		<div className="relative min-h-dvh overflow-x-hidden bg-dotori-50 pb-[env(safe-area-inset-bottom)]">
			<LoginBackgroundDecoration />

			{/* ── 메인 콘텐츠 ── */}
			{shouldReduceMotion ? (
				<div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col items-center px-6 pt-8 text-center">
					{pageContent}
				</div>
			) : (
				<motion.div
					initial={PAGE_CONTENT_INITIAL}
					animate={PAGE_CONTENT_ANIMATE}
					transition={PAGE_CONTENT_TRANSITION}
					className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col items-center px-6 pt-8 text-center"
				>
					{pageContent}
				</motion.div>
			)}
		</div>
	);
}
