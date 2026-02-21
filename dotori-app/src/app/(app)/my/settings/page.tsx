"use client";

import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { useUserProfile } from "@/hooks/use-user-profile";
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
	const [plan, setPlan] = useState<UserPlan>("free");
	const [nextRenewalDate, setNextRenewalDate] = useState("");
	const [isUpgrading, setIsUpgrading] = useState(false);
	const [successMessage, setSuccessMessage] = useState("");

	const isPremium = plan === "premium";
	const planLabel = useMemo(() => (isPremium ? "premium" : "free"), [isPremium]);

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
				<div className="h-7 w-36 rounded-full bg-dotori-100" />
				<div className="mt-4 h-28 rounded-3xl border border-dotori-100 bg-white" />
				<div className="mt-3 h-24 rounded-3xl border border-dotori-100 bg-white" />
			</div>
		);
	}

	if (error && !user) {
		return (
			<div className="pb-8">
				<div className="px-5 pt-8">
					<h1 className="text-xl font-bold">설정</h1>
					<p className="mt-2 text-sm text-dotori-500">{error}</p>
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
					<h1 className="text-xl font-bold">설정</h1>
					<p className="mt-2 text-sm text-dotori-500">로그인 후 플랜 관리가 가능합니다.</p>
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
				<h1 className="text-xl font-bold">플랜 설정</h1>
				<p className="mt-1 text-xs text-dotori-500">
					현재 플랜과 혜택을 확인하고 관리해요
				</p>
			</header>

			<section className="mt-5 px-5">
				<div className="rounded-3xl border border-dotori-100 bg-white px-4 py-4">
					<div className="flex items-center justify-between gap-3">
						<h2 className="text-sm font-semibold">현재 플랜</h2>
						<Badge color={isPremium ? "forest" : "dotori"} className="text-xs">
							{planLabel}
						</Badge>
					</div>
					<p className="mt-2 text-lg font-bold text-dotori-900">{planLabel}</p>
					{isPremium && (
						<p className="mt-1 text-sm text-forest-600">
							다음 갱신일: {nextRenewalDate || "확인 중"}
						</p>
					)}
				</div>
			</section>

			<section className="mt-4 px-5">
				<div className="rounded-3xl bg-dotori-50 px-4 py-4">
					<h2 className="text-sm font-semibold">프리미엄 혜택</h2>
					<ul className="mt-2 space-y-2">
						{PREMIUM_BENEFITS.map((benefit) => (
							<li key={benefit} className="flex items-start gap-2">
								<CheckCircleIcon className="mt-0.5 h-4 w-4 text-forest-500" />
								<span className="text-sm text-dotori-700">{benefit}</span>
							</li>
						))}
					</ul>
				</div>
			</section>

			<section className="mt-4 px-5">
				<div className="rounded-3xl border border-dotori-100 bg-white px-4 py-4">
					{isPremium ? (
						<div className="flex items-center justify-between gap-3 rounded-2xl bg-forest-50 px-3 py-2.5">
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
						<div className="mt-2 rounded-2xl bg-dotori-50 px-3 py-2.5 text-xs text-dotori-600">
							<CreditCardIcon className="h-4 w-4 inline-block translate-y-[-1px]" />
							<span className="ml-1">월 1,900원</span>
						</div>
					)}

					{successMessage && (
						<p className="mt-3 rounded-2xl bg-forest-50 px-3 py-2.5 text-xs text-forest-700">
							{successMessage}
						</p>
					)}
				</div>
			</section>

			<section className="mt-4 px-5">
				<div className="rounded-3xl border border-dotori-100 bg-white px-4 py-4">
					<h2 className="text-sm font-semibold">고객센터</h2>
					<p className="mt-1 text-xs text-dotori-500">
						결제가 안 되거나 궁금한 점이 있으면 채널로 연락해 주세요.
					</p>
					<a
						href={supportChannelUrl}
						target="_blank"
						rel="noreferrer noopener"
						className="mt-3 inline-flex items-center rounded-full border border-dotori-200 px-4 py-2.5 text-sm font-semibold text-dotori-700 transition-colors hover:bg-dotori-50"
					>
						카카오톡 채널로 문의하기
					</a>
				</div>
			</section>

			<div className="mt-6 px-5">
				<Link
					href="/my"
					className="inline-flex w-full justify-center rounded-2xl border border-dotori-100 px-4 py-2.5 text-center text-sm text-dotori-500"
				>
					MY로 돌아가기
				</Link>
			</div>
		</div>
	);
}
