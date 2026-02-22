"use client";

import { Badge } from "@/components/catalyst/badge";
import { Button } from "@/components/catalyst/button";
import { Skeleton } from "@/components/dotori/Skeleton";
import { apiFetch } from "@/lib/api";
import { BRAND } from "@/lib/brand-assets";
import { ISALANG_PORTAL, openIsalangApp, openIsalangLink } from "@/lib/external/isalang-api";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
	ArrowLeftIcon,
	CheckCircleIcon,
	DevicePhoneMobileIcon,
	DocumentTextIcon,
	ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolidIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface WaitlistDoc {
	docId: string;
	name: string;
	submitted: boolean;
	submittedAt?: string;
}

type WaitlistStatus = "pending" | "accepted" | "confirmed" | "cancelled";
type ProgressState = "done" | "active" | "upcoming" | "fail";

interface FacilityData {
	_id: string;
	name: string;
	type: string;
	status: string;
	address: string;
	phone?: string;
	capacity: { total: number; current: number; waiting: number };
}

interface WaitlistDetail {
	_id: string;
	facilityId: FacilityData | string;
	childName: string;
	childBirthDate: string;
	status: WaitlistStatus;
	estimatedDate?: string;
	position?: number;
	ageClass?: string;
	requiredDocs: WaitlistDoc[];
	appliedAt: string;
	createdAt: string;
}

const statusConfig = {
	pending: { label: "대기 중", color: "dotori" as const },
	accepted: { label: "입소 확정", color: "forest" as const },
	confirmed: { label: "입소 확정", color: "forest" as const },
	cancelled: { label: "취소됨", color: "dotori" as const },
};

const progressStates = {
	pending: {
		percent: 66,
		states: ["done", "active", "upcoming"] as ProgressState[],
		barColor: "bg-dotori-500",
		summary: "현재 신청이 접수되어 검토 단계에 있어요.",
		finalLabel: "합격/탈락",
	},
	accepted: {
		percent: 100,
		states: ["done", "done", "done"] as ProgressState[],
		barColor: "bg-forest-500",
		summary: "서류 검토가 끝나 입소 확정 단계입니다.",
		finalLabel: "합격",
	},
	confirmed: {
		percent: 100,
		states: ["done", "done", "done"] as ProgressState[],
		barColor: "bg-forest-500",
		summary: "서류 검토가 끝나 입소 확정 단계입니다.",
		finalLabel: "합격",
	},
	cancelled: {
		percent: 100,
		states: ["done", "done", "fail"] as ProgressState[],
		barColor: "bg-dotori-400",
		summary: "현재 탈락 상태입니다. 상태가 바뀌면 다시 알림이 와요.",
		finalLabel: "탈락",
	},
};

function getProgressStateClass(state: ProgressState) {
	return state === "done"
		? "bg-forest-500 text-white"
		: state === "active"
			? "bg-dotori-500 text-white"
			: state === "fail"
				? "bg-dotori-400 text-white"
				: "border border-dotori-200 bg-white text-dotori-500 dark:border-dotori-700 dark:bg-dotori-950 dark:text-dotori-300";
}

function getProgressTextClass(state: ProgressState) {
	return state === "done" || state === "active" || state === "fail"
		? "text-dotori-700 dark:text-dotori-200"
		: "text-dotori-500 dark:text-dotori-400";
}

function getProgressSymbol(state: ProgressState) {
	return state === "done" ? "✓" : state === "fail" ? "✕" : "•";
}

export default function WaitlistDetailPage() {
	const { id } = useParams<{ id: string }>();
	const router = useRouter();
	const [data, setData] = useState<WaitlistDetail | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [togglingDoc, setTogglingDoc] = useState<string | null>(null);

	const mountedRef = useRef(true);

	const loadDetail = useCallback(async () => {
		if (!id) return;
		setIsLoading(true);
		setError(null);
		try {
			const res = await apiFetch<{ data: WaitlistDetail }>(
				`/api/waitlist/${id}`,
			);
			if (!mountedRef.current) return;
			setData(res.data);
		} catch {
			if (mountedRef.current) setError("대기 신청 정보를 불러올 수 없습니다");
		} finally {
			if (mountedRef.current) setIsLoading(false);
		}
	}, [id]);

	useEffect(() => {
		mountedRef.current = true;
		loadDetail();
		return () => {
			mountedRef.current = false;
		};
	}, [loadDetail]);

	async function toggleDoc(docId: string, currentSubmitted: boolean) {
		if (!data) return;
		setTogglingDoc(docId);

		// Optimistic update
		setData((prev) => {
			if (!prev) return prev;
			return {
				...prev,
				requiredDocs: prev.requiredDocs.map((d) =>
					d.docId === docId
						? {
								...d,
								submitted: !currentSubmitted,
								submittedAt: !currentSubmitted
									? new Date().toISOString()
									: undefined,
							}
						: d,
				),
			};
		});

		try {
			const res = await apiFetch<{ data: WaitlistDetail }>(
				`/api/waitlist/${id}`,
				{
					method: "PATCH",
					body: JSON.stringify({
						docId,
						submitted: !currentSubmitted,
					}),
				},
			);
			setData(res.data);
		} catch {
			// Revert on error
			loadDetail();
		} finally {
			setTogglingDoc(null);
		}
	}

	const [isCancelling, setIsCancelling] = useState(false);

	async function cancelWaitlist() {
		if (!confirm("대기 신청을 취소하시겠어요?")) return;
		setIsCancelling(true);
		try {
			await apiFetch(`/api/waitlist/${id}`, {
				method: "PATCH",
				body: JSON.stringify({ status: "cancelled" }),
			});
			router.push("/my/waitlist");
		} catch {
			setIsCancelling(false);
			setError("취소에 실패했어요. 다시 시도해주세요.");
		}
	}

	if (isLoading) {
		return (
			<div className="pb-8">
				<header className="glass-header sticky top-0 z-20 flex items-center gap-3 px-4 py-3 text-dotori-900 dark:text-dotori-50">
					<Link
						href="/my/waitlist"
						aria-label="뒤로 가기"
						className="grid h-11 w-11 place-items-center rounded-full transition-all active:scale-[0.97] hover:bg-dotori-50 dark:hover:bg-dotori-900"
					>
						<ArrowLeftIcon className="h-6 w-6" />
					</Link>
					<h1 className="text-base font-bold">서류 제출 현황</h1>
				</header>
				<div className="mt-4 px-4">
					<Skeleton variant="card" count={2} />
				</div>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="pb-8">
				<header className="glass-header sticky top-0 z-20 flex items-center gap-3 px-4 py-3 text-dotori-900 dark:text-dotori-50">
					<Link
						href="/my/waitlist"
						aria-label="뒤로 가기"
						className="grid h-11 w-11 place-items-center rounded-full transition-all active:scale-[0.97] hover:bg-dotori-50 dark:hover:bg-dotori-900"
					>
						<ArrowLeftIcon className="h-6 w-6" />
					</Link>
					<h1 className="text-base font-bold">서류 제출 현황</h1>
				</header>
				<div className="px-4 pt-6">
					<div className="rounded-3xl border border-dotori-100 bg-white p-5 text-center shadow-sm dark:border-dotori-800 dark:bg-dotori-950 dark:shadow-none">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={BRAND.errorState}
							alt=""
							aria-hidden="true"
							className="mx-auto h-24 w-24 opacity-70"
						/>
						<p className="mt-5 text-center text-base font-semibold text-dotori-900 dark:text-dotori-50">
							{error || "대기 신청 정보를 찾을 수 없습니다"}
						</p>
						<Link
							href="/my/waitlist"
							className="mt-5 inline-flex w-full min-h-11 items-center justify-center rounded-full border border-dotori-200/60 bg-white px-5 text-sm font-semibold text-dotori-700 shadow-sm transition-all active:scale-[0.97] hover:bg-dotori-50 dark:border-dotori-700 dark:bg-dotori-950 dark:text-dotori-100 dark:shadow-none dark:hover:bg-dotori-900"
						>
							목록으로 돌아가기
						</Link>
					</div>
				</div>
			</div>
		);
	}

	const facility =
		typeof data.facilityId === "object" ? data.facilityId : null;
	const config = statusConfig[data.status];
	const totalDocs = data.requiredDocs.length;
	const submittedDocs = data.requiredDocs.filter((d) => d.submitted).length;
	const progress = progressStates[data.status];
	const docProgress =
		totalDocs > 0 ? Math.round((submittedDocs / totalDocs) * 100) : 0;

	return (
		<div className="pb-8">
			{/* 헤더 */}
			<header className="glass-header sticky top-0 z-20 flex items-center gap-3 px-4 py-3 text-dotori-900 dark:text-dotori-50">
				<Link
					href="/my/waitlist"
					aria-label="뒤로 가기"
					className="grid h-11 w-11 place-items-center rounded-full transition-all active:scale-[0.97] hover:bg-dotori-50 dark:hover:bg-dotori-900"
				>
					<ArrowLeftIcon className="h-6 w-6" />
				</Link>
				<h1 className="text-base font-bold">서류 제출 현황</h1>
				<Badge color={config.color} className="ml-auto">
					{config.label}
				</Badge>
			</header>

			{/* 시설 정보 카드 */}
			{facility && (
				<section className="mx-4 mt-4 rounded-2xl border border-dotori-100 bg-white p-5 shadow-sm dark:border-dotori-800 dark:bg-dotori-950 dark:shadow-none">
					<Link
						href={`/facility/${facility._id}`}
						className="block transition-colors hover:text-dotori-600 dark:hover:text-dotori-100"
					>
						<h2 className="text-lg font-bold leading-snug text-dotori-900 dark:text-dotori-50">
							{facility.name}
						</h2>
						<p className="mt-1 line-clamp-2 text-sm text-dotori-500 dark:text-dotori-300">
							{facility.type} · {facility.address}
						</p>
					</Link>

					{/* 현황 */}
					<div className="mt-3 flex gap-2">
						<div className="flex-1 rounded-xl bg-dotori-50 px-3 py-2.5 text-center dark:bg-dotori-900">
							<span className="block text-xs text-dotori-500 dark:text-dotori-300">
								정원
							</span>
							<span className="mt-0.5 block text-base font-bold tabular-nums text-dotori-900 dark:text-dotori-50">
								{facility.capacity.total}
							</span>
						</div>
						<div className="flex-1 rounded-xl bg-dotori-50 px-3 py-2.5 text-center dark:bg-dotori-900">
							<span className="block text-xs text-dotori-500 dark:text-dotori-300">
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
							<span className="block text-xs text-dotori-500 dark:text-dotori-300">
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
				</section>
			)}

			{/* 순번 카드 */}
			<section className="mx-4 mt-3 rounded-2xl border border-dotori-100 bg-white p-5 shadow-sm dark:border-dotori-800 dark:bg-dotori-950 dark:shadow-none">
				<div className="flex items-start justify-between gap-4">
					<div className="min-w-0">
						<h3 className="text-sm font-semibold text-dotori-700 dark:text-dotori-100">
							현재 대기 순번
						</h3>
						<p className="mt-1 text-xs leading-5 text-dotori-500 dark:text-dotori-300">
							아이사랑 기준으로 갱신됩니다. 시설 사정에 따라 변동될 수 있어요.
						</p>
					</div>
						<div className="shrink-0 text-right">
							{typeof data.position === "number" ? (
								<p className="text-4xl font-bold tabular-nums text-dotori-900 dark:text-dotori-50">
									{data.position}
								</p>
							) : (
								<p className="text-2xl font-bold text-dotori-900 dark:text-dotori-50">
									미정
								</p>
							)}
							{typeof data.position === "number" ? (
								<p className="mt-1 text-xs font-semibold text-dotori-400 dark:text-dotori-300">
									번째
								</p>
							) : null}
						</div>
					</div>
				</section>

			{/* 상태 진행 바 */}
			<section className="mx-4 mt-3 rounded-2xl border border-dotori-100 bg-white p-5 shadow-sm dark:border-dotori-800 dark:bg-dotori-950 dark:shadow-none">
				<div className="flex items-center justify-between gap-3">
					<h3 className="text-sm font-semibold text-dotori-700 dark:text-dotori-100">
						대기 진행 현황
					</h3>
					<span className="text-xs font-semibold tabular-nums text-dotori-500 dark:text-dotori-300">
						진행률 {progress.percent}%
					</span>
				</div>
				<div className="mt-3 grid grid-cols-3 gap-2 text-center">
					{["신청", "검토", progress.finalLabel].map((label, index) => {
						const state = progress.states[index]!;
						return (
							<div key={label}>
								<div
									className={cn(
										"mx-auto inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
										getProgressStateClass(state),
									)}
								>
									{getProgressSymbol(state)}
								</div>
								<p className={cn("mt-1 text-xs", getProgressTextClass(state))}>
									{label}
								</p>
							</div>
						);
					})}
				</div>
				<div
					className="mt-3 h-2.5 overflow-hidden rounded-full bg-dotori-100 ring-1 ring-dotori-200/60 dark:bg-dotori-800 dark:ring-dotori-700/60"
					aria-label="대기 진행률"
				>
					<div
						className={cn("h-full rounded-full transition-all duration-500", progress.barColor)}
						style={{ width: `${progress.percent}%` }}
					/>
				</div>
				<p className="mt-2 text-xs text-dotori-500 dark:text-dotori-300">
					{progress.summary}
				</p>
			</section>

			{/* 신청 정보 */}
			<section className="mx-4 mt-3 rounded-2xl border border-dotori-100 bg-white p-5 shadow-sm dark:border-dotori-800 dark:bg-dotori-950 dark:shadow-none">
				<h3 className="text-sm font-semibold text-dotori-700 dark:text-dotori-100">
					신청 정보
				</h3>
				<div className="mt-3 space-y-2 text-sm">
					<div className="flex justify-between gap-4">
						<span className="text-dotori-500 dark:text-dotori-300">아이 이름</span>
						<span className="font-medium text-dotori-900 dark:text-dotori-50">
							{data.childName}
						</span>
					</div>
					<div className="flex justify-between gap-4">
						<span className="text-dotori-500 dark:text-dotori-300">생년월일</span>
						<span className="font-medium text-dotori-900 dark:text-dotori-50">
							{data.childBirthDate}
						</span>
					</div>
					{data.ageClass ? (
						<div className="flex justify-between gap-4">
							<span className="text-dotori-500 dark:text-dotori-300">
								배정 연령반
							</span>
							<span className="font-medium text-dotori-900 dark:text-dotori-50">
								{data.ageClass}
							</span>
						</div>
					) : null}
					<div className="flex justify-between gap-4">
						<span className="text-dotori-500 dark:text-dotori-300">신청일</span>
						<span
							className="font-medium tabular-nums text-dotori-900 dark:text-dotori-50"
							suppressHydrationWarning
						>
							{formatRelativeTime(data.appliedAt)}
						</span>
					</div>
				</div>
			</section>

			{/* 서류 제출 체크리스트 */}
			{totalDocs > 0 && (
				<section className="mx-4 mt-3">
					{/* 진행률 */}
					<div className="rounded-t-2xl border border-b-0 border-dotori-100 bg-white px-5 pt-5 pb-4 shadow-sm dark:border-dotori-800 dark:bg-dotori-950 dark:shadow-none">
							<div className="flex items-center gap-3">
								<DocumentTextIcon className="h-6 w-6 text-dotori-500 dark:text-dotori-300" />
								<div className="flex-1">
									<div className="flex items-center justify-between">
										<h3 className="text-base font-bold text-dotori-900 dark:text-dotori-50">
											서류 제출 체크리스트
										</h3>
										<span
											className={cn(
												"text-sm font-semibold tabular-nums",
												docProgress === 100
													? "text-forest-600 dark:text-forest-200"
													: "text-dotori-500 dark:text-dotori-300",
											)}
										>
											{submittedDocs}/{totalDocs}
										</span>
									</div>
									<div className="mt-2 h-2 overflow-hidden rounded-full bg-dotori-100 dark:bg-dotori-800">
										<div
											className={cn(
											"h-full rounded-full transition-all duration-500",
											docProgress === 100
												? "bg-forest-500"
												: docProgress >= 50
													? "bg-dotori-500"
													: "bg-dotori-400",
										)}
										style={{
											width: `${docProgress}%`,
										}}
									/>
								</div>
							</div>
						</div>

								{docProgress === 100 ? (
									<div className="mt-3 flex items-center gap-2 rounded-xl bg-forest-50 p-3 dark:bg-forest-900/25">
										<CheckCircleIcon className="h-5 w-5 text-forest-600 dark:text-forest-200" />
										<span className="text-sm font-medium text-forest-700 dark:text-forest-100">
										모든 서류가 준비되었어요!
									</span>
								</div>
							) : (
								<p className="mt-3 text-sm text-dotori-500 dark:text-dotori-300">
									준비된 서류를 체크하세요. 실시간으로 저장됩니다.
								</p>
							)}
						</div>

					{/* 서류 목록 */}
					<div className="rounded-b-2xl border border-t-0 border-dotori-100 bg-white px-5 pb-5 shadow-sm dark:border-dotori-800 dark:bg-dotori-950 dark:shadow-none">
						<ul className="divide-y divide-dotori-100 dark:divide-dotori-800">
							{data.requiredDocs.map((doc) => {
								const isToggling =
									togglingDoc === doc.docId;
										return (
											<li key={doc.docId}>
												<button
													type="button"
											disabled={
												isToggling ||
												data.status === "cancelled"
											}
											onClick={() =>
												toggleDoc(
													doc.docId,
													doc.submitted,
												)
											}
													className={cn(
														"flex min-h-[52px] w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition-all",
														"hover:bg-dotori-50 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-dotori-400/70 active:scale-[0.99] dark:hover:bg-dotori-900",
														isToggling && "opacity-50",
														data.status === "cancelled" &&
															"opacity-40 pointer-events-none",
													)}
												>
											{doc.submitted ? (
												<CheckCircleSolidIcon className="h-6 w-6 shrink-0 text-forest-500" />
											) : (
												<div className="h-6 w-6 shrink-0 rounded-full border-2 border-dotori-200 dark:border-dotori-700" />
											)}
											<div className="min-w-0 flex-1">
													<span
														className={cn(
															"text-sm leading-snug",
															doc.submitted
																? "text-dotori-500 line-through dark:text-dotori-300"
																: "text-dotori-900 dark:text-dotori-50",
														)}
													>
														{doc.name}
													</span>
												{doc.submitted &&
													doc.submittedAt && (
														<p
															className="text-xs text-dotori-400 dark:text-dotori-300"
															suppressHydrationWarning
														>
															{formatRelativeTime(doc.submittedAt)} 제출 완료
														</p>
													)}
											</div>
										</button>
									</li>
								);
							})}
						</ul>
					</div>
				</section>
			)}

			{/* 서류 없는 경우 안내 */}
			{totalDocs === 0 && (
				<section className="mx-4 mt-3 rounded-2xl bg-dotori-50 p-5 text-center dark:bg-dotori-900">
					<ExclamationTriangleIcon className="mx-auto h-8 w-8 text-dotori-500 dark:text-dotori-300" />
					<p className="mt-2 text-sm font-medium text-dotori-700 dark:text-dotori-100">
						서류 체크리스트가 아직 생성되지 않았어요
					</p>
					<p className="mt-1 text-xs text-dotori-500 dark:text-dotori-300">
						이전에 신청한 건이라면 시설에 직접 문의해 주세요.
					</p>
				</section>
			)}

			{/* 아이사랑 앱 연동 */}
			<section className="mx-4 mt-3 rounded-2xl bg-gradient-to-br from-dotori-50 to-white p-5 shadow-sm dark:from-dotori-900 dark:to-dotori-950 dark:shadow-none">
				<h3 className="text-sm font-semibold text-dotori-700 dark:text-dotori-100">
					아이사랑 앱으로 바로가기
				</h3>
				<p className="mt-1 text-xs text-dotori-500 dark:text-dotori-300">
					공식 대기현황 조회 및 서류 제출은 아이사랑 앱에서 진행해요
				</p>
				<button
					onClick={() => openIsalangApp(ISALANG_PORTAL.waitlistStatus)}
					className="mt-3 flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-dotori-900 px-3 text-sm font-semibold text-white shadow-md transition-all active:scale-[0.97] dark:bg-dotori-500 dark:shadow-none"
				>
					<DevicePhoneMobileIcon className="h-5 w-5" />
					아이사랑 앱 열기
				</button>
				<div className="mt-2 grid grid-cols-2 gap-2">
					<button
						onClick={() => openIsalangLink(ISALANG_PORTAL.waitlistStatus)}
						className="min-h-11 rounded-xl bg-white px-3 text-center text-sm font-semibold text-dotori-700 shadow-sm transition-all active:scale-[0.97] dark:bg-dotori-950 dark:text-dotori-100 dark:shadow-none"
					>
						대기현황 확인
					</button>
					<button
						onClick={() => openIsalangLink(ISALANG_PORTAL.documentSubmit)}
						className="min-h-11 rounded-xl bg-white px-3 text-center text-sm font-semibold text-dotori-700 shadow-sm transition-all active:scale-[0.97] dark:bg-dotori-950 dark:text-dotori-100 dark:shadow-none"
					>
						서류제출
					</button>
				</div>
				<p className="mt-2 text-center text-xs text-dotori-500 dark:text-dotori-300">
					모바일: 앱 실행 · 데스크톱: 웹 포털 (공동인증서 필요)
				</p>
			</section>

			{/* 하단 액션 */}
			{data.status === "pending" && (
				<div className="mx-4 mt-6">
					{facility?.phone ? (
						<a
							href={`tel:${facility.phone}`}
							className="mb-3 flex w-full min-h-11 items-center justify-center rounded-2xl bg-dotori-900 px-4 text-base font-semibold text-white transition-all active:scale-[0.97] dark:bg-dotori-500"
						>
							어린이집 전화하기
						</a>
					) : null}
					<Button
						onClick={cancelWaitlist}
						disabled={isCancelling}
						plain={true}
						className={cn(
							"w-full min-h-11 justify-center px-4 text-sm text-dotori-700 ring-1 ring-dotori-200/60 data-hover:bg-dotori-50 data-active:bg-dotori-50 dark:text-dotori-100 dark:ring-dotori-700/60 dark:data-hover:bg-dotori-900 dark:data-active:bg-dotori-900",
							isCancelling && "opacity-70",
						)}
					>
						{isCancelling ? "취소 중..." : "대기 취소"}
					</Button>
				</div>
			)}
		</div>
	);
}
