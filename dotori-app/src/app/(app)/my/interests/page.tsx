"use client";

import { Button } from "@/components/catalyst/button";
import { FacilityCard } from "@/components/dotori/FacilityCard";
import { Skeleton } from "@/components/dotori/Skeleton";
import { apiFetch } from "@/lib/api";
import { BRAND } from "@/lib/brand-assets";
import { cn } from "@/lib/utils";
import { ArrowLeftIcon, HeartIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Facility } from "@/types/dotori";

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
		return () => {
			mountedRef.current = false;
		};
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
					className="grid h-11 w-11 place-items-center rounded-full transition-all active:scale-[0.97] hover:bg-dotori-50 dark:hover:bg-dotori-900"
				>
					<ArrowLeftIcon className="h-6 w-6" />
				</Link>
				<h1 className="text-base font-bold">관심 시설</h1>
				{facilities.length > 0 && (
					<span className="ml-auto text-body-sm text-dotori-500 dark:text-dotori-300">
						{facilities.length}곳
					</span>
				)}
			</header>

			{isLoading ? (
				<div className="mt-4 px-4">
					<Skeleton variant="card" count={3} />
				</div>
			) : facilities.length === 0 ? (
				/* 빈 상태 */
				<div className="px-4 pt-6">
					<div className="rounded-3xl border border-dotori-100 bg-white p-5 text-center shadow-sm dark:border-dotori-800 dark:bg-dotori-950 dark:shadow-none">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={BRAND.emptyState}
							alt=""
							aria-hidden="true"
							className="mx-auto h-24 w-24 opacity-70"
						/>
						<p className="mt-5 text-lg font-bold text-dotori-900 dark:text-dotori-50">
							아직 관심 등록한 시설이 없어요
						</p>
						<p className="mt-2 text-body-sm leading-relaxed text-dotori-500 dark:text-dotori-300">
							탐색에서 마음에 드는 어린이집에 하트를 눌러 저장해 보세요. 나중에 한 번에 비교하기 쉬워요.
						</p>
						<Button color="dotori" href="/explore" className="mt-5 w-full min-h-11">
							시설 탐색하기
						</Button>
					</div>
				</div>
			) : (
				/* 관심 시설 목록 */
				<div className="mt-3 flex flex-col gap-3 px-4">
					{facilities.map((facility) => (
						<div key={facility.id} className="relative">
							<Link
								href={`/facility/${facility.id}`}
								className="block rounded-3xl focus:outline-hidden focus-visible:ring-2 focus-visible:ring-dotori-400/70"
							>
								<FacilityCard facility={facility} compact={true} />
							</Link>
							{/* 관심 해제 버튼 */}
							<button
								onClick={(event) => {
									event.preventDefault();
									event.stopPropagation();
									removeInterest(facility.id);
								}}
								disabled={removingIds.has(facility.id)}
								aria-label="관심 시설 추가/제거"
								className={cn(
									"absolute right-3 top-3 grid min-h-11 min-w-11 h-11 w-11 place-items-center rounded-full",
									"bg-white/90 shadow-sm transition-all dark:bg-dotori-950/80 dark:shadow-none",
									"active:scale-[0.95] hover:bg-dotori-50 dark:hover:bg-dotori-900",
									removingIds.has(facility.id) && "opacity-50",
								)}
							>
								<HeartIcon className="h-5 w-5 fill-dotori-400 text-dotori-400" />
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
