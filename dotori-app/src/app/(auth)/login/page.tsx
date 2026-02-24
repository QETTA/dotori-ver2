"use client";

import { Button } from "@/components/catalyst/button";
import { BRAND } from "@/lib/brand-assets";
import { copy } from "@/lib/brand-copy";
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
	OAuthSignin: copy.auth.errors.oauthSignin,
	OAuthCallback: copy.auth.errors.oauthCallback,
	Default: copy.auth.errors.default,
};

function getAuthErrorMessage(error: string | null) {
	if (!error) return null;
	return AUTH_ERROR_MESSAGES[error] ?? AUTH_ERROR_MESSAGES.Default;
}

function getSafeCallbackPath(callbackUrl: string | null) {
	if (!callbackUrl) return "/";
	if (!callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) return "/";
	return callbackUrl;
}

function LoginPageErrorFallback() {
	return (
		<div className="mt-10 w-full rounded-3xl border border-dotori-100 bg-white/85 p-6 text-center shadow-[0_18px_50px_-30px_rgba(97,64,46,0.55)] dark:border-dotori-800 dark:bg-dotori-950/80 dark:shadow-none">
			<div className="h-4 w-2/3 rounded-full bg-dotori-100/80 motion-safe:animate-pulse dark:bg-dotori-800/60" />
			<div className="mt-4 h-11 rounded-xl bg-dotori-100/80 motion-safe:animate-pulse dark:bg-dotori-800/60" />
		</div>
	);
}

const LoginBackgroundDecoration = memo(function LoginBackgroundDecoration() {
	return (
		<div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
			<div className="absolute inset-0 bg-gradient-to-b from-dotori-100 via-dotori-50 to-white dark:from-dotori-900 dark:via-dotori-950 dark:to-dotori-950" />

			<svg
				className="absolute -left-16 -top-16 h-64 w-64 text-dotori-200/50 dark:text-dotori-700/35"
				viewBox="0 0 200 200"
				fill="currentColor"
			>
				<circle cx="100" cy="100" r="100" />
			</svg>

			<svg
				className="absolute -right-10 top-12 h-40 w-40 text-dotori-200/30 dark:text-dotori-700/25"
				viewBox="0 0 200 200"
				fill="currentColor"
			>
				<circle cx="100" cy="100" r="100" />
			</svg>

			<svg
				className="absolute bottom-32 left-6 h-20 w-20 text-dotori-200/20 dark:text-dotori-700/20"
				viewBox="0 0 200 200"
				fill="currentColor"
			>
				<circle cx="100" cy="100" r="100" />
			</svg>

			<svg
				className="absolute -right-8 bottom-48 h-32 w-32 text-dotori-100/60 dark:text-dotori-800/45"
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
			<div className="w-full">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src={BRAND.lockupHorizontalKr} alt="도토리" className="mx-auto h-9 w-auto" />
			</div>

				<motion.p
					initial={shouldReduceMotion ? false : FADE_UP_INITIAL}
					animate={FADE_UP_ANIMATE}
					transition={shouldReduceMotion ? NO_MOTION_TRANSITION : TAGLINE_TRANSITION}
					className="mt-6 text-sm font-semibold tracking-wide text-dotori-500"
				>
					{copy.auth.login.titleTagline}
				</motion.p>
				<motion.p
					initial={shouldReduceMotion ? false : FADE_UP_INITIAL}
					animate={FADE_UP_ANIMATE}
					transition={shouldReduceMotion ? NO_MOTION_TRANSITION : TITLE_TRANSITION}
					className="mt-3 text-base leading-snug font-bold text-dotori-700 dark:text-dotori-200 lg:text-lg"
				>
					{copy.auth.login.titleMain}
				</motion.p>
			<motion.p
				initial={shouldReduceMotion ? false : FADE_UP_INITIAL}
				animate={FADE_UP_ANIMATE}
				transition={shouldReduceMotion ? NO_MOTION_TRANSITION : SUBTITLE_TRANSITION}
				className="mt-2 text-xs text-dotori-500"
			>
				{copy.auth.login.subtitle}
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
			className="mt-6 w-full max-w-md rounded-2xl border border-dotori-300 bg-dotori-100/90 px-4 py-3 text-left shadow-sm dark:border-dotori-700 dark:bg-dotori-900/60"
			role="alert"
			aria-live="assertive"
			aria-atomic="true"
		>
			<div className="inline-flex items-center gap-2">
				<span
					className="inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-dotori-200 text-xs font-bold text-dotori-700 dark:bg-dotori-800 dark:text-dotori-100"
					aria-hidden="true"
				>
					!
				</span>
				<p className="text-xs font-medium leading-relaxed text-dotori-700 dark:text-dotori-200">
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
				className="mt-8 w-full rounded-3xl border border-dotori-100 bg-white/85 p-5 shadow-[0_18px_50px_-30px_rgba(97,64,46,0.55)] backdrop-blur dark:border-dotori-800 dark:bg-dotori-950/80 dark:shadow-none"
			>
			<p className="text-xs leading-relaxed text-dotori-500">
					{copy.auth.login.cardHint}
				</p>
			<Button
				onClick={onKakaoLogin}
				disabled={isLoading}
				aria-busy={isLoading}
				aria-label="카카오 계정으로 로그인"
				color="amber"
				className={cn(
					"mt-5 w-full min-h-11 gap-2.5 px-6 py-4 text-base font-semibold transition-transform active:scale-[0.97]",
					isLoading && "opacity-90",
				)}
			>
				{isLoading ? (
					<span
						className="mr-2 inline-flex h-4 w-4 flex-shrink-0 motion-safe:animate-spin rounded-full border-2 border-dotori-200 border-t-dotori-700"
						aria-hidden="true"
					/>
					) : (
						<svg
							className="mr-2 h-5 w-5 shrink-0"
							viewBox="0 0 24 24"
							fill="currentColor"
							aria-hidden="true"
						>
							<path d="M12 3C6.48 3 2 6.672 2 11.16c0 2.904 1.872 5.448 4.68 6.888l-1.2 4.416c-.096.36.336.648.648.432l5.136-3.408c.24.024.48.036.72.036 5.52 0 10-3.672 10-8.16C22 6.672 17.52 3 12 3z" />
						</svg>
					)}
					{isLoading ? "로그인 처리 중..." : "카카오 로그인"}
				</Button>
			<p className="mt-2 text-xs font-medium text-dotori-500">
				{copy.auth.login.quickHint}
			</p>
		</motion.div>
	);
});

LoginCard.displayName = "LoginCard";

const LoginGuestLink = memo(function LoginGuestLink({
	shouldReduceMotion,
}: MotionPreferenceProps) {
	return (
		<motion.div
			initial={shouldReduceMotion ? false : FADE_IN_INITIAL}
			animate={FADE_IN_ANIMATE}
			transition={shouldReduceMotion ? NO_MOTION_TRANSITION : GUEST_LINK_TRANSITION}
			className="w-full"
		>
				<Link
					href="/"
					className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-dotori-200 bg-white/60 px-4 text-sm font-semibold text-dotori-600 shadow-sm backdrop-blur transition-colors transition-transform hover:bg-white/80 active:scale-[0.97] dark:border-dotori-800 dark:bg-dotori-950/55 dark:text-dotori-200 dark:hover:bg-dotori-950/70"
				>
					{copy.auth.login.guestBrowse}
				</Link>
		</motion.div>
	);
});

LoginGuestLink.displayName = "LoginGuestLink";

const LoginFooter = memo(function LoginFooter({
	shouldReduceMotion,
}: MotionPreferenceProps) {
	return (
		<motion.p
			initial={shouldReduceMotion ? false : FADE_IN_INITIAL}
			animate={FADE_IN_ANIMATE}
			transition={shouldReduceMotion ? NO_MOTION_TRANSITION : TERMS_TRANSITION}
			className="mt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2 text-xs leading-relaxed text-dotori-500 dark:text-dotori-300"
		>
				{copy.auth.login.termsPrefix}{" "}
				<Link
					href="/my/terms"
					className="font-medium underline underline-offset-2 hover:text-dotori-600 dark:hover:text-dotori-200"
				>
					{copy.auth.login.termsService}
				</Link>
				{" "}및{" "}
				<Link
					href="/my/terms"
					className="font-medium underline underline-offset-2 hover:text-dotori-600 dark:hover:text-dotori-200"
				>
					{copy.auth.login.termsPrivacy}
				</Link>
				{` ${copy.auth.login.termsSuffix}`}
		</motion.p>
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
	const callbackPath = useMemo(
		() => getSafeCallbackPath(searchParams.get("callbackUrl")),
		[searchParams],
	);
	const queryError = useMemo(() => getAuthErrorMessage(errorCode), [errorCode]);
	const visibleError = queryError ?? error;

	const handleKakaoLogin = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			// OAuth redirect flow is more reliable when NextAuth handles navigation directly.
			await signIn("kakao", { redirectTo: callbackPath });
		} catch {
			setError(copy.auth.errors.default);
			setIsLoading(false);
		} finally {
			// Successful OAuth redirect leaves this page, so keep loading state only on failure.
		}
	}, [callbackPath]);

	return (
		<div className="relative min-h-dvh overflow-x-hidden bg-dotori-50 pb-[env(safe-area-inset-bottom)] dark:bg-dotori-900">
			<LoginBackgroundDecoration />

			{/* ── 메인 콘텐츠 ── */}
			{shouldReduceMotion ? (
				<div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col items-center px-6 text-center">
					<div className="flex w-full flex-1 flex-col items-center justify-center">
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
						<LoginGuestLink shouldReduceMotion={shouldReduceMotion} />
					</div>
					<LoginFooter shouldReduceMotion={shouldReduceMotion} />
				</div>
			) : (
				<motion.div
					initial={PAGE_CONTENT_INITIAL}
					animate={PAGE_CONTENT_ANIMATE}
					transition={PAGE_CONTENT_TRANSITION}
					className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col items-center px-6 text-center"
				>
					<div className="flex w-full flex-1 flex-col items-center justify-center">
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
						<LoginGuestLink shouldReduceMotion={shouldReduceMotion} />
					</div>
					<LoginFooter shouldReduceMotion={shouldReduceMotion} />
				</motion.div>
			)}
		</div>
	);
}
