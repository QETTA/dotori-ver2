"use client";

import { EmptyState } from "@/components/dotori/EmptyState";
import { ErrorState } from "@/components/dotori/ErrorState";
import { Skeleton } from "@/components/dotori/Skeleton";
import { apiFetch } from "@/lib/api";
import { stagger, tap } from "@/lib/motion";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
	ArrowLeftIcon,
	BellIcon,
	DocumentCheckIcon,
	HeartIcon,
} from "@heroicons/react/24/outline";
import { motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

interface Notification {
	id: string;
	type: string;
	facility: {
		_id: string;
		name: string;
		type: string;
		status: string;
		address: string;
		capacity: { total: number; current: number; waiting: number };
	} | null;
	channels: string[];
	triggeredAt: string;
	createdAt: string;
}

const typeLabels: Record<string, { label: string; icon: "bell" | "heart" | "check"; tone: "positive" | "standard" | "urgent" }> = {
	vacancy: { label: "빈자리 알림", icon: "bell", tone: "positive" },
	waitlist_change: { label: "대기열 알림", icon: "check", tone: "urgent" },
	review: { label: "리뷰 알림", icon: "heart", tone: "standard" },
	interest: { label: "관심 알림", icon: "heart", tone: "standard" },
};

const toneStyles: Record<
	"positive" | "standard" | "urgent",
	{ titleColor: string; iconBg: string; iconText: string; border: string; badge: string }
> = {
	positive: {
		titleColor: "text-forest-600 dark:text-forest-200",
		iconBg: "bg-forest-50 dark:bg-forest-900/25",
		iconText: "text-forest-600 dark:text-forest-200",
		border: "border-forest-200 dark:border-forest-800",
		badge: "bg-forest-50 text-forest-600 dark:bg-forest-900/25 dark:text-forest-200",
	},
	standard: {
		titleColor: "text-dotori-600 dark:text-dotori-200",
		iconBg: "bg-dotori-50 dark:bg-dotori-900/40",
		iconText: "text-dotori-600 dark:text-dotori-200",
		border: "border-dotori-200 dark:border-dotori-700",
		badge: "bg-dotori-50 text-dotori-600 dark:bg-dotori-900/40 dark:text-dotori-200",
	},
	urgent: {
		titleColor: "text-dotori-700 dark:text-dotori-100",
		iconBg: "bg-dotori-100 dark:bg-dotori-800",
		iconText: "text-dotori-700 dark:text-dotori-100",
		border: "border-dotori-200 dark:border-dotori-700",
		badge: "bg-dotori-100 text-dotori-700 dark:bg-dotori-800 dark:text-dotori-100",
	},
};

const statusLabels: Record<string, { text: string; color: string }> = {
	available: {
		text: "여석 있음",
		color: "text-forest-600 bg-forest-50 dark:bg-forest-900/25 dark:text-forest-200",
	},
	waiting: {
		text: "대기 중",
		color: "text-dotori-600 bg-dotori-50 dark:bg-dotori-900/40 dark:text-dotori-200",
	},
	full: {
		text: "마감",
		color: "text-dotori-700 bg-dotori-100 dark:bg-dotori-800 dark:text-dotori-100",
	},
};

function renderTypeIcon(icon: "bell" | "heart" | "check", colorClass: string) {
	if (icon === "heart") {
		return <HeartIcon className={cn("h-5 w-5", colorClass)} />;
	}

	if (icon === "check") {
		return <DocumentCheckIcon className={cn("h-5 w-5", colorClass)} />;
	}

	return <BellIcon className={cn("h-5 w-5", colorClass)} />;
}

export default function NotificationsPage() {
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const mountedRef = useRef(true);

	const fetchNotifications = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const res = await apiFetch<{ data: Notification[] }>(
				"/api/notifications",
			);
			if (!mountedRef.current) return;
			setNotifications(res.data);
		} catch {
			if (mountedRef.current) setError("알림을 불러오지 못했어요");
		} finally {
			if (mountedRef.current) setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		mountedRef.current = true;
		fetchNotifications();
		return () => {
			mountedRef.current = false;
		};
	}, [fetchNotifications]);

	return (
		<div className="pb-8">
			{/* 헤더 */}
			<header className="glass-header sticky top-0 z-20 flex items-center gap-3 px-5 py-4 text-dotori-900 dark:text-dotori-50">
				<Link
					href="/my"
					aria-label="뒤로 가기"
					className="rounded-full p-2.5 transition-all active:scale-[0.97] hover:bg-dotori-50 dark:hover:bg-dotori-900"
				>
					<ArrowLeftIcon className="h-5 w-5" />
				</Link>
				<h1 className="text-lg font-bold">알림</h1>
			</header>

			<div className="px-5 pt-2">
				{isLoading ? (
					<Skeleton variant="card" count={4} />
				) : error ? (
					<ErrorState
						message={error}
						action={{ label: "다시 시도", onClick: fetchNotifications }}
					/>
				) : notifications.length === 0 ? (
					<EmptyState
						title="알림 없음"
						description="현재는 도착한 알림이 없어요. 시설을 저장하거나 관심 설정을 하면 새 소식을 받을 수 있어요."
						actionLabel="이동 가능 시설 찾기"
						actionHref="/explore"
					/>
				) : (
					<motion.ul {...stagger.container} className="space-y-3">
						{notifications.map((notification) => {
							const facility = notification.facility;
							const status = facility ? statusLabels[facility.status] : null;
							const typeMeta = typeLabels[notification.type] ??
								{ label: "알림", icon: "bell", tone: "standard" as const };
							const tone = toneStyles[typeMeta.tone];
							const toCount = facility
								? facility.capacity.total - facility.capacity.current
								: 0;

							return (
								<motion.li key={notification.id} {...stagger.item}>
									<Link
										href={facility ? `/facility/${facility._id}` : "/my"}
										className="block rounded-3xl focus:outline-hidden focus-visible:ring-2 focus-visible:ring-dotori-400/70"
									>
										<motion.div
											{...tap.card}
											className={cn(
												"rounded-3xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:bg-dotori-950 dark:shadow-none",
												tone.border,
											)}
										>
											<div className="flex items-start gap-3.5">
												<div
													className={cn(
														"grid h-10 w-10 shrink-0 place-items-center rounded-2xl",
														tone.iconBg,
														tone.iconText,
													)}
												>
													{renderTypeIcon(typeMeta.icon, tone.iconText)}
												</div>
												<div className="min-w-0 flex-1">
													<div className="flex items-center gap-2">
														<span className={cn("text-sm font-semibold", tone.titleColor)}>
															{typeMeta.label}
														</span>
														{status && (
															<span
																className={cn(
																	"rounded-full px-2 py-0.5 text-xs font-medium",
																	tone.badge,
																	status.color,
																)}
															>
																{status.text}
															</span>
														)}
													</div>
													{facility ? (
														<>
															<h3 className="mt-1 text-base font-semibold text-dotori-900 dark:text-dotori-50">
																{facility.name}
															</h3>
															<p className="mt-0.5 text-sm text-dotori-500 dark:text-dotori-300">
																{facility.status === "available"
																	? `TO ${toCount}석 (정원 ${facility.capacity.total}명)`
																	: `대기 ${facility.capacity.waiting}명 · ${facility.type}`}
															</p>
														</>
													) : (
														<h3 className="mt-1 text-base font-semibold text-dotori-900 dark:text-dotori-50">
															시설 정보를 확인할 수 없어요
														</h3>
													)}
													<span
														className="mt-1.5 block text-xs text-dotori-500 dark:text-dotori-300"
														suppressHydrationWarning
													>
														{formatRelativeTime(notification.triggeredAt)}
													</span>
												</div>
											</div>
										</motion.div>
									</Link>
								</motion.li>
							);
						})}
					</motion.ul>
				)}
			</div>
		</div>
	);
}
