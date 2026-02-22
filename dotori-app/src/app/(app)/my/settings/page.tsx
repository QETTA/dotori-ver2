"use client";

import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { Heading } from "@/components/catalyst/heading";
import { Text } from "@/components/catalyst/text";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useTheme } from "@/hooks/useTheme";
import { apiFetch } from "@/lib/api";
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

const kakaoChannelPath = process.env.NEXT_PUBLIC_KAKAO_CHANNEL_ID || "_dotori";
const supportChannelUrl = `https://pf.kakao.com/${kakaoChannelPath}`;

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
	const planLabel = useMemo(() => (isPremium ? "premium" : "free"), [isPremium]);
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
					? "프리미엄 결제가 완료되었어요. 다음 갱신일에 맞춰 자동 결제돼요."
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
			<div className="pb-8 px-5 pt-8">
				<div className="h-7 w-36 rounded-full bg-dotori-100 dark:bg-dotori-800" />
				<div className="mt-4 h-28 rounded-3xl border border-dotori-100 dark:border-dotori-800 bg-white dark:bg-dotori-950" />
				<div className="mt-3 h-24 rounded-3xl border border-dotori-100 dark:border-dotori-800 bg-white dark:bg-dotori-950" />
			</div>
		);
	}

	if (error && !user) {
		return (
			<div className="pb-8">
				<div className="px-5 pt-8">
					<Heading level={1}>설정</Heading>
					<Text className="mt-2 text-dotori-500">{error}</Text>
					<Button href="/login" color="dotori" className="mt-4 w-full">
						로그인하기
					</Button>
				</div>
			</div>
		);
	}

	if (!user) {
		return (
			<div className="pb-8">
				<div className="px-5 pt-8">
					<Heading level={1}>설정</Heading>
					<Text className="mt-2 text-dotori-500">로그인 후 플랜 관리가 가능합니다.</Text>
					<Button href="/login" color="dotori" className="mt-4 w-full">
						로그인하기
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="pb-8">
			<header className="px-5 pt-8 pb-2">
				<Heading level={1}>플랜 설정</Heading>
				<Text className="mt-1 text-dotori-500">
					현재 플랜과 혜택을 확인하고 관리해요
				</Text>
			</header>

			<section className="mt-4 px-5">
				<div className="rounded-3xl border border-dotori-100 dark:border-dotori-800 bg-white dark:bg-dotori-950 px-4 py-4">
					<div className="flex items-center justify-between gap-3">
						<Heading level={2} className="text-base">
							화면 테마
						</Heading>
						<Text className="text-xs text-dotori-500">현재: {themeLabel}</Text>
					</div>

					<div
						role="radiogroup"
						aria-label="화면 테마 선택"
						className="mt-3 flex gap-1 rounded-2xl border border-dotori-200 dark:border-dotori-700 bg-dotori-50 dark:bg-dotori-900 p-1"
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
										"flex-1 min-h-10 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
										isSelected
											? "bg-white dark:bg-dotori-950 text-dotori-900 dark:text-dotori-50 shadow-sm"
											: "text-dotori-600 dark:text-dotori-300 hover:bg-white/70 dark:hover:bg-dotori-950/40",
									].join(" ")}
								>
									{option.label}
								</button>
							);
						})}
					</div>

					<Text className="mt-2 text-xs text-dotori-500">
						시스템은 기기 설정을 따라가요.
					</Text>
				</div>
			</section>

			<section className="mt-5 px-5">
				<div className="rounded-3xl border border-dotori-100 dark:border-dotori-800 bg-white dark:bg-dotori-950 px-4 py-4">
					<div className="flex items-center justify-between gap-3">
						<Heading level={2} className="text-base">
							현재 플랜
						</Heading>
						<Badge color={isPremium ? "forest" : "dotori"} className="text-xs">
							{planLabel}
						</Badge>
					</div>
					<p className="mt-2 text-lg font-bold text-dotori-900 dark:text-dotori-50">{planLabel}</p>
					{isPremium && (
						<p className="mt-1 text-sm text-forest-600">
							다음 갱신일: {nextRenewalDate || "확인 중"}
						</p>
					)}
				</div>
			</section>

			<section className="mt-4 px-5">
				<div className="rounded-3xl bg-dotori-50 dark:bg-dotori-900 px-4 py-4">
					<Heading level={2} className="text-base">
						프리미엄 혜택
					</Heading>
					<ul className="mt-2 space-y-2">
						{PREMIUM_BENEFITS.map((benefit) => (
							<li key={benefit} className="flex items-start gap-2">
								<CheckCircleIcon className="mt-0.5 h-4 w-4 text-forest-500" />
								<span className="text-sm text-dotori-700 dark:text-dotori-200">{benefit}</span>
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
								<Badge color="forest" className="text-xs">
									이용 중
								</Badge>
							</div>
							<p className="text-xs text-forest-600">
								{nextRenewalDate
									? `다음 갱신일은 ${nextRenewalDate}이에요`
									: "다음 갱신일 정보를 불러오는 중이에요"}
							</p>
						</div>
					) : (
						<Button
							color="dotori"
							className="w-full"
							onClick={handleStartPremium}
							disabled={isUpgrading}
						>
							{isUpgrading ? "처리 중" : "프리미엄 시작하기"}
						</Button>
					)}

					{isPremium && (
						<div className="mt-2 rounded-2xl bg-dotori-50 dark:bg-dotori-900 px-3 py-2.5 text-xs text-dotori-600 dark:text-dotori-300">
							<CreditCardIcon className="h-4 w-4 inline-block translate-y-[-1px]" />
							<span className="ml-1">월 1,900원</span>
						</div>
					)}

					{successMessage && (
						<p className="mt-3 rounded-2xl bg-forest-50 dark:bg-dotori-900 px-3 py-2.5 text-xs text-forest-700">
							{successMessage}
						</p>
					)}
				</div>
			</section>

			<section className="mt-4 px-5">
				<div className="rounded-3xl border border-dotori-100 dark:border-dotori-800 bg-white dark:bg-dotori-950 px-4 py-4">
					<Heading level={2} className="text-base">
						고객센터
					</Heading>
					<Text className="mt-1 text-dotori-500">
						결제가 안 되거나 궁금한 점이 있으면 채널로 연락해 주세요.
					</Text>
					<a
						href={supportChannelUrl}
						target="_blank"
						rel="noreferrer noopener"
						className="mt-3 inline-flex items-center rounded-full border border-dotori-200 dark:border-dotori-700 px-4 py-2.5 text-sm font-semibold text-dotori-700 dark:text-dotori-200 transition-colors hover:bg-dotori-50 dark:hover:bg-dotori-900"
					>
						카카오톡 채널로 문의하기
					</a>
				</div>
			</section>

			<div className="mt-6 px-5">
				<Link
					href="/my"
					className="inline-flex w-full justify-center rounded-2xl border border-dotori-100 dark:border-dotori-800 px-4 py-2.5 text-center text-sm text-dotori-500 dark:text-dotori-300"
				>
					MY로 돌아가기
				</Link>
			</div>
		</div>
	);
}
