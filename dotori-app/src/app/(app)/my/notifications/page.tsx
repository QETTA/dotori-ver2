"use client";

import { ErrorState } from "@/components/dotori/ErrorState";
import { Skeleton } from "@/components/dotori/Skeleton";
import { apiFetch } from "@/lib/api";
import { BRAND } from "@/lib/brand-assets";
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/catalyst/button";

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

const READ_STORAGE_KEY = "dotori.notifications.read.v1";

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

function toTimestamp(value: string | undefined) {
	if (!value) return 0;
	const parsed = new Date(value).getTime();
	return Number.isFinite(parsed) ? parsed : 0;
}

function loadReadMap(): Record<string, string> {
	if (typeof window === "undefined") return {};

	try {
		const raw = window.localStorage.getItem(READ_STORAGE_KEY);
		if (!raw) return {};
		const parsed = JSON.parse(raw) as unknown;
		if (!parsed || typeof parsed !== "object") return {};
		return parsed as Record<string, string>;
	} catch {
		return {};
	}
}

export default function NotificationsPage() {
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const mountedRef = useRef(true);
	const [readMap, setReadMap] = useState<Record<string, string>>({});
	const [isReadMapReady, setIsReadMapReady] = useState(false);

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

	useEffect(() => {
		setReadMap(loadReadMap());
		setIsReadMapReady(true);
	}, []);

	useEffect(() => {
		if (!isReadMapReady) return;
		try {
			window.localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(readMap));
		} catch {
			// ignore
		}
	}, [isReadMapReady, readMap]);

	const isUnread = useCallback(
		(notification: Notification) => {
			const readTriggeredAt = readMap[notification.id];
			if (!readTriggeredAt) return true;
			return toTimestamp(notification.triggeredAt) > toTimestamp(readTriggeredAt);
		},
		[readMap],
	);

	const unreadCount = useMemo(() => {
		if (!isReadMapReady || isLoading || notifications.length === 0) return 0;
		return notifications.reduce((acc, n) => acc + (isUnread(n) ? 1 : 0), 0);
	}, [isLoading, isReadMapReady, isUnread, notifications]);

	const markAsRead = useCallback(
		(notification: Notification) => {
			setReadMap((prev) => {
				const next = { ...prev };
				const prevRead = next[notification.id];
				if (toTimestamp(prevRead) >= toTimestamp(notification.triggeredAt)) {
					return prev;
				}
				next[notification.id] = notification.triggeredAt;
				return next;
			});
		},
		[],
	);

	return (
		<div className="pb-8">
			{/* 헤더 */}
			<header className="glass-header sticky top-0 z-20 flex items-center gap-3 px-4 py-3 text-dotori-900 dark:text-dotori-50">
				<Link
					href="/my"
					aria-label="뒤로 가기"
					className="grid h-11 w-11 place-items-center rounded-full transition-all active:scale-[0.97] hover:bg-dotori-50 dark:hover:bg-dotori-900"
				>
					<ArrowLeftIcon className="h-6 w-6" />
				</Link>
				<h1 className="text-base font-bold">알림</h1>
				{unreadCount > 0 ? (
					<span className="ml-auto text-sm font-medium text-dotori-500 dark:text-dotori-300">
						안 읽음 {unreadCount}
					</span>
				) : null}
			</header>

			<div className="px-4 pt-2">
				{isLoading ? (
					<Skeleton variant="card" count={4} />
				) : error ? (
					<ErrorState
						message={error}
						action={{ label: "다시 시도", onClick: fetchNotifications }}
					/>
				) : notifications.length === 0 ? (
					<div className="pt-4">
						<div className="rounded-3xl border border-dotori-100 bg-white p-5 text-center shadow-sm dark:border-dotori-800 dark:bg-dotori-950 dark:shadow-none">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={BRAND.emptyState}
								alt=""
								aria-hidden="true"
								className="mx-auto h-24 w-24 opacity-70"
							/>
							<p className="mt-5 text-lg font-bold text-dotori-900 dark:text-dotori-50">
								아직 도착한 알림이 없어요
							</p>
							<p className="mt-2 text-sm leading-relaxed text-dotori-500 dark:text-dotori-300">
								시설을 저장하거나 대기 신청을 하면, 빈자리/대기열 변동 소식을 알림으로 받아볼 수 있어요.
							</p>
							<Button color="dotori" href="/explore" className="mt-5 w-full min-h-11">
								이동 가능 시설 찾기
							</Button>
						</div>
					</div>
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
							const unread = isUnread(notification);

							return (
								<motion.li key={notification.id} {...stagger.item}>
									<Link
										href={facility ? `/facility/${facility._id}` : "/my"}
										onClick={() => markAsRead(notification)}
										className="block rounded-3xl focus:outline-hidden focus-visible:ring-2 focus-visible:ring-dotori-400/70"
									>
										<motion.div
											{...tap.card}
											className={cn(
												"rounded-3xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:bg-dotori-950 dark:shadow-none",
												tone.border,
												unread
													? "border-l-4 border-l-dotori-400"
													: "border-l-4 border-l-transparent",
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
														{unread ? (
															<span className="rounded-full bg-dotori-100 px-2 py-0.5 text-xs font-semibold text-dotori-700 dark:bg-dotori-800 dark:text-dotori-100">
																새 알림
															</span>
														) : null}
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
