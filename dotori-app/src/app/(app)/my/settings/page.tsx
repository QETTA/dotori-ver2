"use client";

import { Badge } from "@/components/catalyst/badge";
import { DsButton } from "@/components/ds/DsButton";
import { Heading } from "@/components/catalyst/heading";
import { Text } from "@/components/catalyst/text";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useTheme } from "@/hooks/useTheme";
import { apiFetch } from "@/lib/api";
import { BRAND } from "@/lib/brand-assets";
import type { UserPlan } from "@/types/dotori";
import { CheckCircleIcon, CreditCardIcon, SparklesIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type SubscriptionResponse = {
	plan?: UserPlan;
	nextRenewalDate?: string;
	data?: {
		plan?: UserPlan;
		nextRenewalDate?: string;
	};
};

const PREMIUM_BENEFITS = [
	"빈자리 즉시 알림",
	"토리챗 무제한 대화",
	"이동 우선 매칭",
] as const;

const KAKAO_CHANNEL_ID = process.env.NEXT_PUBLIC_KAKAO_CHANNEL_ID || "_dotori";
const supportChannelUrl = `https://pf.kakao.com/${KAKAO_CHANNEL_ID}`;

function formatDateLabel(dateString?: string) {
	if (!dateString) return "";
	const date = new Date(dateString);
	if (Number.isNaN(date.getTime())) return "";

	return new Intl.DateTimeFormat("ko-KR", {
		year: "numeric",
		month: "long",
		day: "numeric",
	}).format(date);
}

function defaultNextRenewal() {
	const nextMonth = new Date();
	nextMonth.setMonth(nextMonth.getMonth() + 1);
	return formatDateLabel(nextMonth.toISOString());
}

export default function SettingsPage() {
	const { user, isLoading, error, refresh } = useUserProfile();
	const { mode, resolved, setMode } = useTheme();
	const [plan, setPlan] = useState<UserPlan>("free");
	const [nextRenewalDate, setNextRenewalDate] = useState("");
	const [isUpgrading, setIsUpgrading] = useState(false);
	const [successMessage, setSuccessMessage] = useState("");

	const isPremium = plan === "premium";
	const planLabel = useMemo(() => (isPremium ? "프리미엄" : "무료"), [isPremium]);
	const themeLabel =
		mode === "system"
			? `시스템 (${resolved === "dark" ? "다크" : "라이트"})`
			: mode === "dark"
				? "다크"
				: "라이트";

	useEffect(() => {
		if (!user) {
			setPlan("free");
			setNextRenewalDate("");
			return;
		}

		setPlan(user.plan);
		setNextRenewalDate(
			user.plan === "premium" ? formatDateLabel(defaultNextRenewal()) : "",
		);
	}, [user]);

	async function handleStartPremium() {
		setIsUpgrading(true);
		setSuccessMessage("");

		try {
			const response = await apiFetch<SubscriptionResponse>(
				"/api/subscriptions",
				{
					method: "POST",
					body: JSON.stringify({ action: "upgrade", plan: "premium" }),
				},
			);

			const nextPlan = response?.plan ?? response?.data?.plan ?? "premium";
			const renewalDate =
				response?.nextRenewalDate ??
				response?.data?.nextRenewalDate ??
				defaultNextRenewal();

			setPlan(nextPlan);
			setNextRenewalDate(formatDateLabel(renewalDate));
			setSuccessMessage(
				nextPlan === "premium"
					? "프리미엄 결제가 완료되었어요. 다음 결제일에 맞춰 자동 결제돼요."
					: "요청은 접수되었지만 플랜 반영은 조금 뒤에 반영될 수 있어요.",
			);
			refresh();
		} catch {
			setPlan("premium");
			setNextRenewalDate(defaultNextRenewal());
			setSuccessMessage(
				"현재는 모의 결제로 처리돼요. 결제 시스템이 준비되면 실제 결제가 적용됩니다.",
			);
		} finally {
			setIsUpgrading(false);
		}
	}

	if (isLoading) {
		return (
			<div className="pb-8 px-5 pt-6">
				<div className="h-7 w-36 rounded-full bg-dotori-100 dark:bg-dotori-800" />
				<div className="mt-4 h-28 rounded-3xl border border-dotori-100 dark:border-dotori-800 bg-white dark:bg-dotori-950" />
				<div className="mt-3 h-24 rounded-3xl border border-dotori-100 dark:border-dotori-800 bg-white dark:bg-dotori-950" />
			</div>
		);
	}

	if (error && !user) {
		return (
			<div className="pb-8 px-5 pt-6 text-dotori-900 dark:text-dotori-50">
				<div className="rounded-3xl bg-gradient-to-r from-dotori-100 via-dotori-50 to-forest-100 dark:from-dotori-900 dark:via-dotori-950 dark:to-dotori-900 px-5 py-5">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={BRAND.lockupHorizontalKr} alt="도토리" className="mb-3 h-6" />
					<Heading level={1} className="text-h2">
						설정
					</Heading>
					<Text className="mt-1 text-body-sm text-dotori-700 dark:text-dotori-200">
						{error}
					</Text>
					<div className="mt-4 space-y-2">
						<DsButton onClick={refresh} className="w-full min-h-11">
							다시 시도
						</DsButton>
						<DsButton href="/login" className="w-full min-h-11">
							로그인하기
						</DsButton>
					</div>
				</div>
			</div>
		);
	}

	if (!user) {
		return (
			<div className="pb-8 px-5 pt-6 text-dotori-900 dark:text-dotori-50">
				<div className="rounded-3xl bg-gradient-to-r from-dotori-100 via-dotori-50 to-forest-100 dark:from-dotori-900 dark:via-dotori-950 dark:to-dotori-900 px-5 py-5">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={BRAND.lockupHorizontalKr} alt="도토리" className="mb-3 h-6" />
					<Heading level={1} className="text-h2">
						설정
					</Heading>
					<Text className="mt-1 text-body-sm text-dotori-700 dark:text-dotori-200">
						로그인하면 플랜 관리와 테마 설정을 바로 할 수 있어요.
					</Text>
					<DsButton href="/login" className="mt-4 w-full min-h-11">
						로그인하기
					</DsButton>
					<Text className="mt-2 text-center text-caption text-dotori-500 dark:text-dotori-300">
						로그인 후 마이페이지에서 관심·대기·알림도 함께 확인할 수 있어요.
					</Text>
				</div>
			</div>
		);
	}

	return (
		<div className="pb-8">
			<header className="px-5 pt-6 pb-2">
				<Heading level={1}>플랜 설정</Heading>
				<Text className="mt-1 text-dotori-500">
					현재 플랜과 혜택을 확인하고 관리해요
				</Text>
			</header>

			<section className="mt-4 px-5">
				<div className="rounded-3xl border border-dotori-100 dark:border-dotori-800 bg-white dark:bg-dotori-950 px-4 py-4">
					<div className="flex items-center justify-between gap-3">
						<Heading level={2} className="text-h3">
							화면 테마
						</Heading>
						<Text className="text-caption text-dotori-500">현재: {themeLabel}</Text>
					</div>

					<div
						role="radiogroup"
						aria-label="화면 테마 선택"
						className="mt-3 flex gap-1 rounded-2xl border border-dotori-200 dark:border-dotori-700 bg-dotori-50 dark:bg-dotori-950/60 p-1"
					>
						{([
							{ value: "light", label: "라이트" },
							{ value: "dark", label: "다크" },
							{ value: "system", label: "시스템" },
						] as const).map((option) => {
							const isSelected = mode === option.value;
							return (
								<button
									key={option.value}
									type="button"
									role="radio"
									aria-checked={isSelected}
									onClick={() => setMode(option.value)}
									className={[
										"flex-1 min-h-11 rounded-xl px-3 text-body-sm font-semibold transition-colors transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dotori-400 active:scale-[0.98]",
										isSelected
											? "bg-dotori-900 text-white shadow-sm ring-2 ring-dotori-400"
											: "text-dotori-600 dark:text-dotori-300 hover:bg-white/70 dark:hover:bg-dotori-950/40",
									].join(" ")}
								>
									{option.label}
								</button>
							);
						})}
					</div>

					<Text className="mt-2 text-caption text-dotori-500">
						시스템은 기기 설정을 따라가요.
					</Text>
				</div>
			</section>

			<section className="mt-5 px-5">
				<div className="rounded-3xl border border-dotori-100 dark:border-dotori-800 bg-white dark:bg-dotori-950 px-4 py-4">
					<div className="flex items-center justify-between gap-3">
						<Heading level={2} className="text-h3">
							현재 플랜
						</Heading>
						<Badge color={isPremium ? "forest" : "dotori"} className="text-caption">
							{isPremium ? "프리미엄" : "무료"}
						</Badge>
					</div>
					<p className="mt-2 text-lg font-bold text-dotori-900 dark:text-dotori-50">{planLabel}</p>
					{isPremium && (
						<p className="mt-1 text-body-sm text-forest-600">
							다음 결제일: {nextRenewalDate || "확인 중"}
						</p>
					)}
				</div>
			</section>

			<section className="mt-4 px-5">
				<div className="rounded-3xl bg-dotori-50 dark:bg-dotori-900 px-4 py-4">
					<Heading level={2} className="text-h3">
						프리미엄 혜택
					</Heading>
					<ul className="mt-2 space-y-2">
						{PREMIUM_BENEFITS.map((benefit) => (
							<li key={benefit} className="flex items-start gap-2">
								<CheckCircleIcon className="mt-0.5 h-4 w-4 text-forest-500" />
								<span className="text-body-sm text-dotori-700 dark:text-dotori-200">{benefit}</span>
							</li>
						))}
					</ul>
				</div>
			</section>

			<section className="mt-4 px-5">
				<div className="rounded-3xl border border-dotori-100 dark:border-dotori-800 bg-white dark:bg-dotori-950 px-4 py-4">
					{isPremium ? (
						<div className="flex items-center justify-between gap-3 rounded-2xl bg-forest-50 dark:bg-dotori-900 px-3 py-2.5">
							<div className="flex items-center gap-2">
								<SparklesIcon className="h-5 w-5 text-forest-600" />
								<Badge color="forest" className="text-caption">
									이용 중
								</Badge>
							</div>
							<p className="text-caption text-forest-600">
								{nextRenewalDate
									? `다음 결제일은 ${nextRenewalDate}이에요`
									: "다음 결제일 정보를 불러오는 중이에요"}
							</p>
						</div>
					) : (
						<DsButton
						
							className="w-full min-h-11"
							onClick={handleStartPremium}
							disabled={isUpgrading}
						>
							{isUpgrading ? "처리 중" : "프리미엄 시작하기"}
						</DsButton>
					)}

					{isPremium && (
						<div className="mt-2 rounded-2xl bg-dotori-50 dark:bg-dotori-900 px-3 py-2.5 text-caption text-dotori-600 dark:text-dotori-300">
							<CreditCardIcon className="h-4 w-4 inline-block translate-y-[-1px]" />
							<span className="ml-1">월 1,900원</span>
						</div>
					)}

					{successMessage && (
						<p className="mt-3 rounded-2xl bg-forest-50 dark:bg-dotori-900 px-3 py-2.5 text-caption text-forest-700">
							{successMessage}
						</p>
					)}
				</div>
			</section>

			<section className="mt-4 px-5">
				<div className="rounded-3xl border border-dotori-100 dark:border-dotori-800 bg-white dark:bg-dotori-950 px-4 py-4">
					<Heading level={2} className="text-h3">
						카카오 채널
					</Heading>
					<Text className="mt-1 text-dotori-500">
						친구 추가하면 빈자리 소식과 이동 팁을 받을 수 있어요.
					</Text>
					<div className="mt-3 flex gap-2">
						<button
							type="button"
							onClick={() => {
								if (typeof window !== "undefined" && window.Kakao?.isInitialized?.()) {
									window.Kakao.Channel.addChannel({ channelPublicId: KAKAO_CHANNEL_ID });
								} else {
									window.open(supportChannelUrl, "_blank", "noopener,noreferrer");
								}
							}}
							className="flex-1 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#FEE500] px-4 text-body-sm font-semibold text-[#191919] transition-transform active:scale-[0.97]"
						>
							친구 추가
						</button>
						<button
							type="button"
							onClick={() => {
								if (typeof window !== "undefined" && window.Kakao?.isInitialized?.()) {
									window.Kakao.Channel.chat({ channelPublicId: KAKAO_CHANNEL_ID });
								} else {
									window.open(supportChannelUrl, "_blank", "noopener,noreferrer");
								}
							}}
							className="flex-1 inline-flex min-h-11 items-center justify-center rounded-2xl border border-dotori-200 dark:border-dotori-700 px-4 text-body-sm font-semibold text-dotori-700 dark:text-dotori-200 transition-colors transition-transform hover:bg-dotori-50 dark:hover:bg-dotori-900 active:scale-[0.97]"
						>
							1:1 문의하기
						</button>
					</div>
				</div>
			</section>

			<div className="mt-6 px-5">
				<Link
					href="/my"
					className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-dotori-100 dark:border-dotori-800 px-4 text-center text-body-sm font-semibold text-dotori-600 dark:text-dotori-200 transition-colors transition-transform hover:bg-dotori-50 dark:hover:bg-dotori-900 active:scale-[0.98]"
				>
					MY로 돌아가기
				</Link>
			</div>
		</div>
	);
}
