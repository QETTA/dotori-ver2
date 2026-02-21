"use client";

import { EmptyState } from "@/components/dotori/EmptyState";
import { ErrorState } from "@/components/dotori/ErrorState";
import { Skeleton } from "@/components/dotori/Skeleton";
import { apiFetch } from "@/lib/api";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
	ArrowLeftIcon,
	BellAlertIcon,
	BuildingOffice2Icon,
} from "@heroicons/react/24/outline";
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

const typeLabels: Record<string, string> = {
	vacancy: "빈자리 알림",
	waitlist_change: "대기 변동",
	review: "리뷰 알림",
};

const statusLabels: Record<string, { text: string; color: string }> = {
	available: { text: "여석 있음", color: "text-forest-600 bg-forest-50" },
	waiting: { text: "대기 중", color: "text-warning bg-amber-50" },
	full: { text: "마감", color: "text-danger bg-red-50" },
};

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
		return () => { mountedRef.current = false; };
	}, [fetchNotifications]);

	return (
		<div className="pb-8">
			{/* 헤더 */}
			<header className="sticky top-0 z-20 flex items-center gap-3 bg-white/80 px-5 py-4 backdrop-blur-xl">
				<Link href="/my" aria-label="뒤로 가기" className="rounded-full p-2.5 transition-all active:scale-[0.97] hover:bg-dotori-50">
					<ArrowLeftIcon className="h-5 w-5" />
				</Link>
				<h1 className="text-[17px] font-bold">알림</h1>
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
						icon={<BellAlertIcon className="h-10 w-10" />}
						title="아직 알림이 없어요"
						description="관심 시설에 TO가 발생하면 알려드릴게요"
						actionLabel="탐색하기"
						actionHref="/explore"
					/>
				) : (
					<div className="space-y-3">
						{notifications.map((notification, index) => {
							const facility = notification.facility;
							const status = facility
								? statusLabels[facility.status]
								: null;
							const toCount = facility
								? facility.capacity.total -
									facility.capacity.current
								: 0;

							return (
								<Link
									key={notification.id}
									href={
										facility
											? `/facility/${facility._id}`
											: "#"
									}
									className={cn(
										"block rounded-3xl bg-white p-5 shadow-sm transition-all hover:shadow-md active:scale-[0.99]",
										"motion-safe:animate-in motion-safe:fade-in duration-300",
									)}
									style={{
										animationDelay: `${index * 50}ms`,
										animationFillMode: "both",
									}}
								>
									<div className="flex items-start gap-3.5">
										<div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-dotori-100">
											{facility?.status ===
											"available" ? (
												<span className="text-lg">
													🎉
												</span>
											) : (
												<BuildingOffice2Icon className="h-5 w-5 text-dotori-500" />
											)}
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<span className="text-[13px] font-medium text-dotori-500">
													{typeLabels[
														notification.type
													] ?? "알림"}
												</span>
												{status && (
													<span
														className={cn(
															"rounded-full px-2 py-0.5 text-[11px] font-medium",
															status.color,
														)}
													>
														{status.text}
													</span>
												)}
											</div>
											{facility ? (
												<>
													<h3 className="mt-1 text-[15px] font-semibold text-dotori-900">
														{facility.name}
													</h3>
													<p className="mt-0.5 text-[13px] text-dotori-500">
														{facility.status ===
														"available"
															? `TO ${toCount}석 (정원 ${facility.capacity.total}명)`
															: `대기 ${facility.capacity.waiting}명 · ${facility.type}`}
													</p>
												</>
											) : (
												<h3 className="mt-1 text-[15px] font-semibold text-dotori-900">
													시설 정보를 확인할 수 없어요
												</h3>
											)}
											<span
												className="mt-1.5 block text-[12px] text-dotori-400"
												suppressHydrationWarning
											>
												{formatRelativeTime(
													notification.triggeredAt,
												)}
											</span>
										</div>
									</div>
								</Link>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
