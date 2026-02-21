"use client";

import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { ErrorState } from "@/components/dotori/ErrorState";
import { Skeleton } from "@/components/dotori/Skeleton";
import { apiFetch } from "@/lib/api";
import { BRAND } from "@/lib/brand-assets";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
	ArrowDownIcon,
	ArrowLeftIcon,
	ArrowUpIcon,
	CameraIcon,
	DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ISALANG_PORTAL, openIsalangLink, openIsalangApp } from "@/lib/external/isalang-api";

interface WaitlistDoc {
	docId: string;
	name: string;
	submitted: boolean;
	submittedAt?: string;
}

type WaitlistStatus = "pending" | "accepted" | "confirmed" | "cancelled";

interface WaitlistItem {
	_id: string;
	estimatedDate?: string;
	previousPosition?: number;
	facilityId:
		| {
				_id: string;
				name: string;
				type: string;
				status: string;
				address: string;
				capacity: { total: number; current: number; waiting: number };
		  }
		| string;
	childName: string;
	childBirthDate: string;
	status: WaitlistStatus;
	position?: number;
	ageClass?: string;
	requiredDocs?: WaitlistDoc[];
	appliedAt: string;
}

const statusConfig = {
	pending: { label: "대기 중", color: "dotori" as const },
	accepted: { label: "입소 확정", color: "forest" as const },
	confirmed: { label: "입소 확정", color: "forest" as const },
	cancelled: { label: "취소됨", color: "zinc" as const },
};

function formatPositionTrend(current?: number, previous?: number) {
	if (typeof current !== "number" || typeof previous !== "number") {
		return null;
	}

	const diff = current - previous;
	if (diff === 0) return null;

	return {
		diff: Math.abs(diff),
		direction: diff < 0 ? "up" : "down",
	};
}

function getEstimatedAdmissionLabel(raw?: string) {
	if (!raw) return "미정";

	const date = new Date(raw);
	if (Number.isNaN(date.getTime())) {
		return raw;
	}

	return date.toLocaleDateString("ko-KR", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

export default function WaitlistPage() {
	const [waitlists, setWaitlists] = useState<WaitlistItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set());
	const mountedRef = useRef(true);

	const loadWaitlists = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const res = await apiFetch<{ data: WaitlistItem[] }>("/api/waitlist");
			if (!mountedRef.current) return;
			setWaitlists(res.data.filter((w) => w.status !== "cancelled"));
		} catch {
			if (mountedRef.current) setError("대기 현황을 불러오지 못했어요");
		} finally {
			if (mountedRef.current) setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		mountedRef.current = true;
		loadWaitlists();
		return () => { mountedRef.current = false; };
	}, [loadWaitlists]);

	const cancelWaitlist = useCallback(async (id: string) => {
		if (cancellingIds.has(id)) return;
		setCancellingIds((prev) => new Set(prev).add(id));
		setWaitlists((prev) => prev.filter((w) => w._id !== id));
		try {
			await apiFetch(`/api/waitlist/${id}`, {
				method: "PATCH",
				body: JSON.stringify({ status: "cancelled" }),
			});
		} catch {
			loadWaitlists();
		} finally {
			setCancellingIds((prev) => {
				const next = new Set(prev);
				next.delete(id);
				return next;
			});
		}
	}, [cancellingIds, loadWaitlists]);

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
				<h1 className="text-base font-bold">대기 신청 현황</h1>
				{waitlists.length > 0 && (
					<span className="ml-auto text-[14px] text-dotori-400">
						{waitlists.length}건
					</span>
				)}
			</header>

			{isLoading ? (
				<div className="px-4 mt-4">
					<Skeleton variant="card" count={3} />
				</div>
			) : error ? (
				<div className="px-4 pt-8">
					<ErrorState
						message={error}
						action={{ label: "다시 시도", onClick: loadWaitlists }}
					/>
				</div>
			) : waitlists.length === 0 ? (
				/* 빈 상태 */
				<div className="flex flex-col items-center justify-center px-4 pt-20">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={BRAND.emptyState}
						alt=""
						className="h-32 w-32 opacity-60"
					/>
					<p className="mt-6 text-center text-[15px] font-medium text-dotori-500">
						대기 중인 어린이집이 없어요
					</p>
					<p className="mt-1.5 text-center text-[14px] text-dotori-400">
						관심 시설에서 대기 신청을 하면 여기서 현황을 확인할 수 있어요
					</p>
					<Link
						href="/explore"
						className="mt-6 rounded-2xl bg-dotori-900 px-6 py-3.5 text-[15px] font-semibold text-white transition-all active:scale-[0.97]"
					>
						탐색하기
					</Link>
					<Link
						href="/my/import"
						className="mt-3 flex items-center gap-2 rounded-2xl border border-dotori-200/60 px-5 py-3 text-[14px] font-medium text-dotori-600 transition-all active:scale-[0.97]"
					>
						<CameraIcon className="h-4.5 w-4.5" />
						스크린샷으로 가져오기
					</Link>
				</div>
			) : (
				/* 대기 목록 */
				<div className="px-4 mt-2 space-y-3">
					{waitlists.map((item) => {
						const facility =
							typeof item.facilityId === "object"
								? item.facilityId
								: null;
						const config = statusConfig[item.status];
						const facilityId =
							typeof item.facilityId === "object"
								? item.facilityId._id
								: item.facilityId;

						return (
							<div
								key={item._id}
								className="rounded-2xl bg-white p-5 shadow-sm"
							>
								{/* 시설 정보 */}
								<div className="flex items-start justify-between">
									<Link
										href={`/facility/${facilityId}`}
										className="min-w-0 flex-1"
									>
										<h3 className="text-[15px] font-semibold text-dotori-900 hover:text-dotori-600 transition-colors">
											{facility?.name || "시설 정보 없음"}
										</h3>
										{facility && (
											<p className="mt-0.5 text-[13px] text-dotori-400">
												{facility.type} · {facility.address}
											</p>
										)}
									</Link>
									<Badge color={config.color}>
										{config.label}
									</Badge>
								</div>

								{/* 상세 정보 */}
								<div className="mt-3 flex items-center gap-4 text-[13px] text-dotori-500">
									<span>아이: {item.childName}</span>
									{item.ageClass && (
										<span>{item.ageClass}</span>
									)}
									{item.position && (
										<span className="font-semibold text-dotori-700">
											대기 {item.position}번째
										</span>
									)}
									<span
										className="ml-auto"
										suppressHydrationWarning
									>
										{formatRelativeTime(item.appliedAt)}
									</span>
								</div>

								{/* 대기 상태 요약 */}
								<div className="mt-3 grid grid-cols-2 gap-2">
									<div className="rounded-xl bg-dotori-50 px-3 py-2.5 text-center">
										<span className="block text-[12px] text-dotori-400">
											현재 대기 순위
										</span>
										<span className="mt-0.5 inline-flex items-center justify-center gap-1">
											<span className="text-[14px] font-bold text-dotori-900">
												{item.position ? `${item.position}번째` : "미정"}
											</span>
											{(() => {
												const trend = formatPositionTrend(
													item.position,
													item.previousPosition,
												);
												if (!trend) {
													return null;
												}
												const trendClass =
													trend.direction === "down"
														? "text-forest-600"
														: "text-danger";
												return (
													<span
														className={cn(
															"text-[11px] font-semibold",
															trendClass,
														)}
													>
														{trend.direction === "down" ? (
															<ArrowDownIcon className="h-3.5 w-3.5" />
														) : (
															<ArrowUpIcon className="h-3.5 w-3.5" />
														)}
														<span className="ml-0.5">
															{trend.direction === "up" ? `-${trend.diff}` : `+${trend.diff}`}
														</span>
													</span>
												);
											})()}
										</span>
									</div>
									<div className="rounded-xl bg-dotori-50 px-3 py-2.5 text-center">
										<span className="block text-[12px] text-dotori-400">
											예상 입소 시기
										</span>
										<span className="text-[13px] font-bold text-dotori-900">
											{getEstimatedAdmissionLabel(item.estimatedDate)}
										</span>
									</div>
								</div>

								{/* 시설 현황 */}
								{facility && (
									<div className="mt-3 flex gap-3">
										<div className="flex-1 rounded-xl bg-dotori-50 px-3 py-2.5 text-center">
											<span className="block text-[13px] text-dotori-400">
												정원
											</span>
											<span className="text-[14px] font-bold text-dotori-900">
												{facility.capacity.total}
											</span>
										</div>
										<div className="flex-1 rounded-xl bg-dotori-50 px-3 py-2.5 text-center">
											<span className="block text-[13px] text-dotori-400">
												현원
											</span>
											<span className="text-[14px] font-bold text-dotori-900">
												{facility.capacity.current}
											</span>
										</div>
										<div
											className={cn(
												"flex-1 rounded-xl px-3 py-2.5 text-center",
												facility.status === "available"
													? "bg-forest-50"
													: "bg-dotori-50",
											)}
										>
											<span className="block text-[13px] text-dotori-400">
												{facility.status === "available"
													? "여석"
													: "대기"}
											</span>
											<span
												className={cn(
													"text-[14px] font-bold",
													facility.status === "available"
														? "text-forest-600"
														: "text-dotori-900",
												)}
											>
												{facility.status === "available"
													? facility.capacity.total -
														facility.capacity.current
													: facility.capacity.waiting}
											</span>
										</div>
									</div>
								)}

								{/* 서류 제출 현황 */}
								{item.requiredDocs &&
									item.requiredDocs.length > 0 && (() => {
										const total = item.requiredDocs!.length;
										const submitted = item.requiredDocs!.filter(
											(d) => d.submitted,
										).length;
										const pct =
											total > 0
												? Math.round(
														(submitted / total) * 100,
													)
												: 0;
										return (
											<Link
												href={`/my/waitlist/${item._id}`}
												className="mt-3 block rounded-xl bg-dotori-50 p-3.5 transition-all active:scale-[0.99] hover:bg-dotori-100/60"
											>
												<div className="flex items-center justify-between">
													<span className="text-[13px] font-medium text-dotori-700">
														서류 제출 현황
													</span>
													<span className="text-[12px] font-semibold text-dotori-500">
														{submitted}/{total}건 완료
													</span>
												</div>
												<div className="mt-2 h-1.5 overflow-hidden rounded-full bg-dotori-400/20">
													<div
														className={cn(
															"h-full rounded-full transition-all duration-300",
															pct === 100
																? "bg-forest-500"
																: "bg-dotori-400",
														)}
														style={{
															width: `${pct}%`,
														}}
													/>
												</div>
												<p className="mt-1.5 text-[12px] text-dotori-400">
													{pct === 100
														? "모든 서류가 준비되었어요"
														: "탭하여 서류를 확인하세요"}
												</p>
											</Link>
										);
									})()}

								{/* 액션 */}
								{item.status === "pending" && (
									<div className="mt-3 flex items-center justify-between">
										<Link
											href={`/my/waitlist/${item._id}`}
											className="text-[13px] font-medium text-dotori-500 transition-colors hover:text-dotori-700"
										>
											상세 보기 →
										</Link>
										<Button
											color="red"
											onClick={() =>
												cancelWaitlist(item._id)
											}
											disabled={cancellingIds.has(item._id)}
											className={cn(
												"min-h-[40px] px-4 text-[13px]",
												cancellingIds.has(item._id) && "opacity-60",
											)}
										>
											{cancellingIds.has(item._id) ? "취소 중..." : "대기 취소"}
										</Button>
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}

			{/* 스크린샷 가져오기 CTA */}
			{!isLoading && (
				<Link
					href="/my/import"
					className="mx-4 mt-6 flex items-center gap-3 rounded-2xl border border-dotori-200/60 bg-white p-4 shadow-sm transition-all active:scale-[0.99] hover:bg-dotori-50/50"
				>
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-dotori-100">
						<CameraIcon className="h-5 w-5 text-dotori-600" />
					</div>
					<div className="min-w-0 flex-1">
						<p className="text-[14px] font-semibold text-dotori-900">
							스크린샷으로 대기현황 가져오기
						</p>
						<p className="mt-0.5 text-[12px] text-dotori-400">
							아이사랑 앱 스크린샷을 찍으면 AI가 자동으로 분석해요
						</p>
					</div>
					<span className="text-[13px] text-dotori-400">→</span>
				</Link>
			)}

			{/* 아이사랑 앱 바로가기 */}
			{!isLoading && (
				<div className="mx-4 mt-6 rounded-2xl bg-gradient-to-br from-dotori-50 to-white p-4 shadow-sm">
					<p className="text-[13px] font-medium text-dotori-600">
						아이사랑 앱에서 공식 대기현황을 확인하세요
					</p>
					<button
						onClick={() => openIsalangApp(ISALANG_PORTAL.waitlistStatus)}
						className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-dotori-900 px-3 py-3 text-[14px] font-semibold text-white shadow-md transition-all active:scale-[0.97]"
					>
						<DevicePhoneMobileIcon className="h-4.5 w-4.5" />
						아이사랑 앱 열기
					</button>
					<div className="mt-2 flex gap-2">
						<button
							onClick={() => openIsalangLink(ISALANG_PORTAL.waitlistStatus)}
							className="flex-1 rounded-xl bg-white px-3 py-2.5 text-center text-[13px] font-medium text-dotori-700 shadow-sm transition-all active:scale-[0.97]"
						>
							대기현황
						</button>
						<button
							onClick={() => openIsalangLink(ISALANG_PORTAL.documentSubmit)}
							className="flex-1 rounded-xl bg-white px-3 py-2.5 text-center text-[13px] font-medium text-dotori-700 shadow-sm transition-all active:scale-[0.97]"
						>
							서류제출
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
