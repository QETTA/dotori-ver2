"use client";

import { Badge } from "@/components/catalyst/badge";
import { DsButton } from "@/components/ds/DsButton";
import { ErrorState } from "@/components/dotori/ErrorState";
import { Skeleton } from "@/components/dotori/Skeleton";
import { apiFetch } from "@/lib/api";
import { BRAND } from "@/lib/brand-assets";
import { ISALANG_PORTAL, openIsalangApp, openIsalangLink } from "@/lib/external/isalang-api";
import { fadeUp, stagger, tap } from "@/lib/motion";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
	ArrowDownIcon,
	ArrowLeftIcon,
	ArrowUpIcon,
	CameraIcon,
	DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

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
	cancelled: { label: "취소됨", color: "dotori" as const },
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

function getAdmissionGuide(position?: number, estimatedDate?: string) {
	if (!estimatedDate) {
		return typeof position === "number"
			? "입소 시기는 아직 확정되지 않았어요. 순번 기준으로 업데이트될 거예요."
			: "입소 시기 정보가 아직 없어요. 나중에 다시 확인해봐요.";
	}

	return "아이사랑 데이터 기준으로 입소 시기가 갱신됩니다.";
}

export default function WaitlistPage() {
	const [waitlists, setWaitlists] = useState<WaitlistItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set());
	const mountedRef = useRef(true);
	const { data: session } = useSession();
	const isPremiumUser = session?.user?.plan === "premium";

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
		return () => {
			mountedRef.current = false;
		};
	}, [loadWaitlists]);

	const cancelWaitlist = useCallback(async (id: string) => {
		if (!confirm("대기 신청을 취소할까요?")) {
			return;
		}

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
			<header className="glass-header sticky top-0 z-20 flex items-center gap-3 px-4 py-3 text-dotori-900 dark:text-dotori-50">
				<Link
					href="/my"
					aria-label="뒤로 가기"
					className="grid h-11 w-11 place-items-center rounded-full transition-all active:scale-[0.97] hover:bg-dotori-50 dark:hover:bg-dotori-900"
				>
					<ArrowLeftIcon className="h-6 w-6" />
				</Link>
				<h1 className="text-base font-bold">대기 신청 현황</h1>
				{waitlists.length > 0 ? (
					<span className="ml-auto text-body-sm font-medium text-dotori-500 dark:text-dotori-300">
						{waitlists.length}건
					</span>
				) : null}
			</header>

			{!isLoading && (
				<motion.div
					{...fadeUp}
					className="mx-4 mt-3 rounded-2xl border border-dotori-100 bg-white px-4 py-3 shadow-sm dark:border-dotori-800 dark:bg-dotori-950 dark:shadow-none"
				>
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<p className="text-body-sm font-semibold text-dotori-700 dark:text-dotori-100">
								빈자리 즉시 알림은 프리미엄 전용입니다
							</p>
							<p className="mt-1.5 text-caption leading-5 text-dotori-500 dark:text-dotori-300">
								{isPremiumUser
									? "프리미엄: 빈자리 즉시 푸시 알림"
									: "무료: 빈자리 생기면 앱 열었을 때 확인 가능"}
							</p>
						</div>
						<Badge color={isPremiumUser ? "forest" : "dotori"}>
							{isPremiumUser ? "프리미엄" : "무료"}
						</Badge>
					</div>
					{!isPremiumUser && (
						<DsButton
						
							href="/landing#pricing"
							className="mt-3 w-full min-h-11"
						>
							월 1,900원으로 즉시 알림 받기
						</DsButton>
					)}
				</motion.div>
			)}

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
				<div className="px-4 pt-6">
					<div className="rounded-3xl border border-dotori-100 bg-white p-5 text-center shadow-sm dark:border-dotori-800 dark:bg-dotori-950 dark:shadow-none">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={BRAND.emptyState}
							alt=""
							aria-hidden="true"
							className="mx-auto h-24 w-24 opacity-70"
						/>
						<p className="mt-5 text-center text-lg font-bold text-dotori-900 dark:text-dotori-50">
							아직 대기 신청이 없어요
						</p>
						<p className="mt-2 text-center text-body-sm leading-relaxed text-dotori-500 dark:text-dotori-300">
							마음에 드는 시설을 찾고 대기 신청을 하면, 여기서 순번과 서류 진행 상황까지 한 번에 확인할 수 있어요.
						</p>
						<DsButton href="/explore" className="mt-5 w-full min-h-11">
							탐색하러 가기
						</DsButton>
						<Link
							href="/my/import"
							className="mt-3 inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-full border border-dotori-200/60 bg-white px-5 text-body-sm font-semibold text-dotori-700 shadow-sm transition-all active:scale-[0.97] hover:bg-dotori-50 dark:border-dotori-700 dark:bg-dotori-950 dark:text-dotori-100 dark:shadow-none dark:hover:bg-dotori-900"
						>
							<CameraIcon className="h-5 w-5" />
							스크린샷으로 가져오기
						</Link>
					</div>
				</div>
			) : (
				/* 대기 목록 */
				<motion.ul {...stagger.container} className="mt-3 list-none space-y-3 px-4">
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
								<motion.li key={item._id} {...stagger.item} className="list-none">
									<motion.div
										{...tap.card}
										className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-dotori-100/70 dark:bg-dotori-950 dark:ring-dotori-800/70 dark:shadow-none"
									>
										{/* 시설 정보 */}
										<div className="flex items-start justify-between">
											<Link
												href={`/facility/${facilityId}`}
												className="min-w-0 flex-1 transition-colors hover:text-dotori-600 dark:hover:text-dotori-100"
											>
												<h3 className="text-lg font-bold leading-snug text-dotori-900 dark:text-dotori-50">
													{facility?.name || "시설 정보 없음"}
												</h3>
												{facility ? (
													<p className="mt-1 line-clamp-2 text-body-sm text-dotori-500 dark:text-dotori-300">
														{facility.type} · {facility.address}
													</p>
												) : null}
											</Link>
											<Badge color={config.color}>
												{config.label}
											</Badge>
										</div>

										{/* 상세 정보 */}
										<div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-caption text-dotori-500 dark:text-dotori-300">
											<span className="font-medium text-dotori-700 dark:text-dotori-100">
												아이 {item.childName}
											</span>
											{item.ageClass ? <span>{item.ageClass}</span> : null}
											{typeof item.position === "number" && (
												<span className="rounded-full bg-dotori-100 px-3 py-1 text-caption font-semibold text-dotori-700 dark:bg-dotori-800 dark:text-dotori-100">
													대기 {item.position}번째
												</span>
											)}
											<span
												className="ml-auto tabular-nums text-caption text-dotori-500 dark:text-dotori-300"
												suppressHydrationWarning
											>
												신청 {formatRelativeTime(item.appliedAt)}
											</span>
										</div>

										{/* 대기 상태 요약 */}
										<div className="mt-3 grid grid-cols-2 gap-2">
											<div className="rounded-xl bg-dotori-50 px-3 py-2.5 text-center dark:bg-dotori-900">
												<span className="block text-caption text-dotori-500 dark:text-dotori-300">
													현재 대기 순번
												</span>
												<div className="mt-1 flex items-end justify-center gap-1">
													<span className="text-2xl font-bold tabular-nums text-dotori-900 dark:text-dotori-50">
														{typeof item.position === "number" ? item.position : "—"}
													</span>
													<span className="pb-0.5 text-caption font-semibold text-dotori-500 dark:text-dotori-300">
														번째
													</span>
													{(() => {
														const trend = formatPositionTrend(
															item.position,
															item.previousPosition,
														);
														if (!trend) return null;

														const isImproved = trend.direction === "up";
														return (
															<span
																className={cn(
																	"ml-1 inline-flex items-center gap-0.5 text-caption font-semibold tabular-nums",
																	isImproved
																		? "text-forest-600 dark:text-forest-200"
																		: "text-dotori-500 dark:text-dotori-300",
																)}
															>
																{isImproved ? (
																	<ArrowUpIcon className="h-4 w-4" />
																) : (
																	<ArrowDownIcon className="h-4 w-4" />
																)}
																<span>
																	{isImproved
																		? `-${trend.diff}`
																		: `+${trend.diff}`}
																</span>
															</span>
														);
													})()}
												</div>
											</div>
											<div className="rounded-xl bg-dotori-50 px-3 py-2.5 text-center dark:bg-dotori-900">
												<span className="block text-caption text-dotori-500 dark:text-dotori-300">
													예상 입소 시기
												</span>
												<span className="mt-1 block text-base font-bold text-dotori-900 dark:text-dotori-50">
													{getEstimatedAdmissionLabel(item.estimatedDate)}
												</span>
											</div>
										</div>
										<p className="mt-2 text-caption text-dotori-500 dark:text-dotori-300">
											{getAdmissionGuide(item.position, item.estimatedDate)}
										</p>

										{/* 시설 현황 */}
										{facility ? (
											<div className="mt-3 flex gap-2">
												<div className="flex-1 rounded-xl bg-dotori-50 px-3 py-2.5 text-center dark:bg-dotori-900">
													<span className="block text-caption text-dotori-500 dark:text-dotori-300">
														정원
													</span>
													<span className="mt-0.5 block text-base font-bold tabular-nums text-dotori-900 dark:text-dotori-50">
														{facility.capacity.total}
													</span>
												</div>
												<div className="flex-1 rounded-xl bg-dotori-50 px-3 py-2.5 text-center dark:bg-dotori-900">
													<span className="block text-caption text-dotori-500 dark:text-dotori-300">
														현원
													</span>
													<span className="mt-0.5 block text-base font-bold tabular-nums text-dotori-900 dark:text-dotori-50">
														{facility.capacity.current}
													</span>
												</div>
												<div
													className={cn(
														"flex-1 rounded-xl px-3 py-2.5 text-center",
														facility.status === "available"
															? "bg-forest-50 dark:bg-forest-900/25"
															: "bg-dotori-50 dark:bg-dotori-900",
													)}
												>
													<span className="block text-caption text-dotori-500 dark:text-dotori-300">
														{facility.status === "available" ? "여석" : "대기"}
													</span>
													<span
														className={cn(
															"mt-0.5 block text-base font-bold tabular-nums",
															facility.status === "available"
																? "text-forest-600 dark:text-forest-200"
																: "text-dotori-900 dark:text-dotori-50",
														)}
													>
														{facility.status === "available"
															? facility.capacity.total - facility.capacity.current
															: facility.capacity.waiting}
													</span>
												</div>
											</div>
										) : null}

										{/* 서류 제출 현황 */}
										{item.requiredDocs &&
											item.requiredDocs.length > 0 && (() => {
												const total = item.requiredDocs?.length ?? 0;
										const submitted = (
											item.requiredDocs?.filter((d) => d.submitted) ?? []
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
														className="mt-3 block rounded-xl bg-dotori-50 p-4 transition-all hover:bg-dotori-100/60 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-dotori-400/70 active:scale-[0.99] dark:bg-dotori-900 dark:hover:bg-dotori-800"
													>
														<div className="flex items-center justify-between">
															<span className="text-body-sm font-semibold text-dotori-700 dark:text-dotori-100">
																서류 제출 현황
															</span>
															<span className="text-caption font-semibold tabular-nums text-dotori-500 dark:text-dotori-300">
																{submitted}/{total}건 완료
															</span>
														</div>
														<div className="mt-2 h-1.5 overflow-hidden rounded-full bg-dotori-400/20 dark:bg-dotori-700/40">
															<div
																className={cn(
																	"h-full rounded-full transition-all duration-300",
																	pct === 100 ? "bg-forest-500" : "bg-dotori-400",
																)}
																style={{ width: `${pct}%` }}
															/>
														</div>
														<p className="mt-1.5 text-caption text-dotori-500 dark:text-dotori-300">
															{pct === 100
																? "모든 서류가 준비되었어요"
																: "탭하여 서류를 확인하세요"}
														</p>
													</Link>
												);
											})()}

										{/* 액션 */}
										{item.status === "pending" && (
											<div className="mt-3 flex items-center justify-between gap-3">
												<Link
													href={`/my/waitlist/${item._id}`}
													className="inline-flex min-h-11 items-center rounded-full border border-dotori-200/60 bg-white px-4 text-body-sm font-semibold text-dotori-700 shadow-sm transition-all active:scale-[0.97] hover:bg-dotori-50 dark:border-dotori-700 dark:bg-dotori-950 dark:text-dotori-100 dark:shadow-none dark:hover:bg-dotori-900"
												>
													상세 보기
												</Link>
												<DsButton
												
													onClick={() => cancelWaitlist(item._id)}
													disabled={cancellingIds.has(item._id)}
													className={cn(
														"min-h-11 px-5 text-body-sm",
														cancellingIds.has(item._id) && "opacity-60",
													)}
												>
													{cancellingIds.has(item._id) ? "취소 중..." : "대기 취소"}
												</DsButton>
											</div>
								)}
								</motion.div>
							</motion.li>
						);
					})}
				</motion.ul>
			)}

			{/* 스크린샷 가져오기 CTA */}
			{!isLoading && (
				<Link
					href="/my/import"
					className="mx-4 mt-6 flex min-h-11 items-center gap-3 rounded-2xl border border-dotori-200/60 bg-white p-4 shadow-sm transition-all hover:bg-dotori-50/50 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-dotori-400/70 active:scale-[0.99] dark:border-dotori-700 dark:bg-dotori-950 dark:shadow-none dark:hover:bg-dotori-900/60"
				>
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-dotori-100 dark:bg-dotori-800">
						<CameraIcon className="h-5 w-5 text-dotori-600 dark:text-dotori-200" />
					</div>
					<div className="min-w-0 flex-1">
						<p className="text-body-sm font-semibold text-dotori-900 dark:text-dotori-50">
							스크린샷으로 대기현황 가져오기
						</p>
						<p className="mt-0.5 text-caption text-dotori-500 dark:text-dotori-300">
							아이사랑 앱 스크린샷을 찍으면 AI가 자동으로 분석해요
						</p>
					</div>
					<span className="text-body-sm text-dotori-500 dark:text-dotori-300">→</span>
				</Link>
			)}

			{/* 아이사랑 앱 바로가기 */}
			{!isLoading && (
				<div className="mx-4 mt-6 rounded-2xl bg-gradient-to-br from-dotori-50 to-white p-4 shadow-sm dark:from-dotori-900 dark:to-dotori-950 dark:shadow-none">
					<p className="text-body-sm font-medium text-dotori-600 dark:text-dotori-200">
						아이사랑 앱에서 공식 대기현황을 확인하세요
					</p>
					<button
						onClick={() => openIsalangApp(ISALANG_PORTAL.waitlistStatus)}
						className="mt-2 flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-dotori-900 px-3 text-body-sm font-semibold text-white shadow-md transition-all active:scale-[0.97] dark:bg-dotori-500 dark:shadow-none"
					>
						<DevicePhoneMobileIcon className="h-5 w-5" />
						아이사랑 앱 열기
					</button>
					<div className="mt-2 flex gap-2">
						<button
							onClick={() => openIsalangLink(ISALANG_PORTAL.waitlistStatus)}
							className="flex-1 min-h-11 rounded-xl bg-white px-3 text-center text-body-sm font-semibold text-dotori-700 shadow-sm transition-all active:scale-[0.97] dark:bg-dotori-950 dark:text-dotori-100 dark:shadow-none"
						>
							대기현황
						</button>
						<button
							onClick={() => openIsalangLink(ISALANG_PORTAL.documentSubmit)}
							className="flex-1 min-h-11 rounded-xl bg-white px-3 text-center text-body-sm font-semibold text-dotori-700 shadow-sm transition-all active:scale-[0.97] dark:bg-dotori-950 dark:text-dotori-100 dark:shadow-none"
						>
							서류제출
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
