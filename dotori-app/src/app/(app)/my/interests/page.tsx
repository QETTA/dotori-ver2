"use client";

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
			<header className="sticky top-0 z-20 flex items-center gap-3 bg-white/95 px-4 py-3 backdrop-blur-sm">
				<Link
					href="/my"
					aria-label="뒤로 가기"
					className="rounded-full p-2.5 transition-all active:scale-[0.97] hover:bg-dotori-50"
				>
					<ArrowLeftIcon className="h-6 w-6" />
				</Link>
				<h1 className="text-base font-bold">관심 시설</h1>
				{facilities.length > 0 && (
					<span className="ml-auto text-[14px] text-dotori-400">
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
					<p className="mt-6 text-center text-[15px] font-medium text-dotori-500">
						아직 관심 등록한 시설이 없어요
					</p>
					<p className="mt-1.5 text-center text-[14px] text-dotori-400">
						탐색에서 마음에 드는 어린이집에 하트를 눌러보세요
					</p>
					<Link
						href="/explore"
						className="mt-6 rounded-2xl bg-dotori-900 px-6 py-3.5 text-[15px] font-semibold text-white transition-all active:scale-[0.97]"
					>
						시설 탐색하기
					</Link>
				</div>
			) : (
				/* 관심 시설 목록 */
				<div className="px-4 mt-2 space-y-3">
					{facilities.map((facility) => (
						<div key={facility.id} className="relative">
							<Link href={`/facility/${facility.id}`}>
								<FacilityCard facility={facility} compact />
							</Link>
							{/* 관심 해제 버튼 */}
							<button
								onClick={() => removeInterest(facility.id)}
								disabled={removingIds.has(facility.id)}
								aria-label="관심 해제"
								className={cn(
									"absolute right-3 top-3 rounded-full p-2",
									"bg-white/90 shadow-sm transition-all",
									"active:scale-[0.95] hover:bg-red-50",
									removingIds.has(facility.id) && "opacity-50",
								)}
							>
								<HeartIcon className="h-4.5 w-4.5 fill-red-400 text-red-400" />
							</button>

							{/* 상태 뱃지 */}
							{facility.status === "available" && (
								<span className="absolute left-3 top-3 rounded-full bg-forest-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
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
