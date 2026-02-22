"use client";

import { Skeleton } from "@/components/dotori/Skeleton";
import { apiFetch } from "@/lib/api";
import { BRAND } from "@/lib/brand-assets";
import { tap } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ArrowLeftIcon, HeartIcon } from "@heroicons/react/24/outline";
import { motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Facility } from "@/types/dotori";

const statusMeta = {
	available: {
		label: "TO 있음",
		dot: "bg-forest-500",
		pill: "bg-forest-50 text-forest-700 dark:bg-forest-900/25 dark:text-forest-100",
	},
	waiting: {
		label: "대기",
		dot: "bg-dotori-400",
		pill: "bg-dotori-100 text-dotori-700 dark:bg-dotori-800 dark:text-dotori-100",
	},
	full: {
		label: "마감",
		dot: "bg-dotori-400",
		pill: "bg-dotori-100 text-dotori-700 dark:bg-dotori-800 dark:text-dotori-100",
	},
} as const;

export default function InterestsPage() {
	const [facilities, setFacilities] = useState<Facility[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
	const mountedRef = useRef(true);

	const loadInterests = useCallback(async () => {
		setIsLoading(true);
		try {
			// Get user's interest facility IDs
			const userRes = await apiFetch<{
				data: { interests?: string[] };
			}>("/api/users/me");
			if (!mountedRef.current) return;
			const interests = userRes.data.interests || [];

			if (interests.length === 0) {
				setFacilities([]);
				return;
			}

			// Batch fetch all interest facilities in a single request
			const res = await apiFetch<{ data: Facility[] }>(
				`/api/facilities?ids=${interests.join(",")}`,
			);
			if (!mountedRef.current) return;
			setFacilities(res.data);
		} catch {
			// User not logged in or error
		} finally {
			if (mountedRef.current) setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		mountedRef.current = true;
		loadInterests();
		return () => { mountedRef.current = false; };
	}, [loadInterests]);

	async function removeInterest(facilityId: string) {
		if (removingIds.has(facilityId)) return;
		setRemovingIds((prev) => new Set(prev).add(facilityId));
		setFacilities((prev) => prev.filter((f) => f.id !== facilityId));
		try {
			await apiFetch("/api/users/me/interests", {
				method: "DELETE",
				body: JSON.stringify({ facilityId }),
			});
		} catch {
			// Revert on error
			loadInterests();
		} finally {
			setRemovingIds((prev) => {
				const next = new Set(prev);
				next.delete(facilityId);
				return next;
			});
		}
	}

	return (
		<div className="pb-8">
			{/* 헤더 */}
			<header className="glass-header sticky top-0 z-20 flex items-center gap-3 px-4 py-3 text-dotori-900 dark:text-dotori-50">
				<Link
					href="/my"
					aria-label="뒤로 가기"
					className="rounded-full p-2.5 transition-all active:scale-[0.97] hover:bg-dotori-50 dark:hover:bg-dotori-900"
				>
					<ArrowLeftIcon className="h-6 w-6" />
				</Link>
				<h1 className="text-base font-bold">관심 시설</h1>
				{facilities.length > 0 && (
					<span className="ml-auto text-sm text-dotori-500 dark:text-dotori-300">
						{facilities.length}곳
					</span>
				)}
			</header>

			{isLoading ? (
				<div className="px-4 mt-4">
					<Skeleton variant="card" count={3} />
				</div>
			) : facilities.length === 0 ? (
				/* 빈 상태 */
				<div className="flex flex-col items-center justify-center px-4 pt-20">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={BRAND.emptyState}
						alt=""
						className="h-32 w-32 opacity-60"
					/>
					<p className="mt-6 text-center text-base font-medium text-dotori-500 dark:text-dotori-300">
						아직 관심 등록한 시설이 없어요
					</p>
					<p className="mt-1.5 text-center text-sm text-dotori-500 dark:text-dotori-300">
						탐색에서 마음에 드는 어린이집에 하트를 눌러보세요
					</p>
					<Link
						href="/explore"
						className="mt-6 rounded-2xl bg-dotori-900 px-6 py-3.5 text-base font-semibold text-white transition-all active:scale-[0.97] dark:bg-dotori-500"
					>
						시설 탐색하기
					</Link>
				</div>
			) : (
				/* 관심 시설 목록 */
				<div className="px-4 mt-2 space-y-3">
					{facilities.map((facility) => (
						<div key={facility.id} className="relative">
							<Link
								href={`/facility/${facility.id}`}
								className="block rounded-3xl focus:outline-hidden focus-visible:ring-2 focus-visible:ring-dotori-400/70"
							>
								<motion.div
									{...tap.card}
									className="rounded-3xl border border-dotori-100 bg-white p-4 shadow-sm dark:border-dotori-800 dark:bg-dotori-950 dark:shadow-none"
								>
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0">
											<div className="flex items-center gap-2">
												<span
													className={cn(
														"h-2 w-2 rounded-full",
														(statusMeta[facility.status] ?? statusMeta.waiting).dot,
													)}
													aria-hidden="true"
												/>
												<p className="truncate text-base font-semibold text-dotori-900 dark:text-dotori-50">
													{facility.name}
												</p>
											</div>
											<p className="mt-1 line-clamp-2 text-sm text-dotori-600 dark:text-dotori-200">
												{facility.address}
											</p>
											<p className="mt-1 text-xs text-dotori-500 dark:text-dotori-300">
												{facility.distance ? `${facility.distance} · ` : ""}
												{facility.type}
											</p>
										</div>

										<div className="shrink-0 text-right">
											<span
												className={cn(
													"inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
													(statusMeta[facility.status] ?? statusMeta.waiting).pill,
												)}
											>
												{facility.status === "available"
													? "TO 있음"
													: facility.status === "waiting"
														? `대기 ${facility.capacity.waiting}`
														: "마감"}
											</span>
											{facility.status === "available" ? (
												<p className="mt-1 text-xs font-medium text-forest-700 dark:text-forest-100">
													자리{" "}
													{Math.max(
														0,
														facility.capacity.total - facility.capacity.current,
													)}
													석
												</p>
											) : null}
										</div>
									</div>
								</motion.div>
							</Link>
							{/* 관심 해제 버튼 */}
							<button
								onClick={() => removeInterest(facility.id)}
								disabled={removingIds.has(facility.id)}
								aria-label="관심 시설 추가/제거"
								className={cn(
									"absolute right-3 top-3 rounded-full p-2",
									"bg-white/90 shadow-sm transition-all dark:bg-dotori-950/80 dark:shadow-none",
									"active:scale-[0.95] hover:bg-dotori-50 dark:hover:bg-dotori-900",
									removingIds.has(facility.id) && "opacity-50",
								)}
							>
								<HeartIcon className="h-4.5 w-4.5 fill-dotori-400 text-dotori-400" />
							</button>

							{/* 상태 뱃지 */}
							{facility.status === "available" && (
								<span className="absolute left-3 top-3 rounded-full bg-forest-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
									TO 발생
								</span>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
