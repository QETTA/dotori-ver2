"use client";

import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const ActionConfirmSheet = dynamic(
	() =>
		import("@/components/dotori/ActionConfirmSheet").then((m) => ({
			default: m.ActionConfirmSheet,
		})),
	{ loading: () => null },
);
import { ErrorState } from "@/components/dotori/ErrorState";
import { Skeleton } from "@/components/dotori/Skeleton";
import { useToast } from "@/components/dotori/ToastProvider";
import { FacilityDetailHeader } from "@/components/dotori/facility/FacilityDetailHeader";
import { FacilityInfoCard } from "@/components/dotori/facility/FacilityInfoCard";
import { FacilityCapacityCard } from "@/components/dotori/facility/FacilityCapacityCard";
import { FacilityLocationCard } from "@/components/dotori/facility/FacilityLocationCard";
import { FacilityFeaturesCard } from "@/components/dotori/facility/FacilityFeaturesCard";
import { IsalangCard } from "@/components/dotori/facility/IsalangCard";
import { FacilityChecklistCard } from "@/components/dotori/facility/FacilityChecklistCard";
import { FacilityReviewsCard } from "@/components/dotori/facility/FacilityReviewsCard";
import { FacilityInsights } from "@/components/dotori/facility/FacilityInsights";
import { getFacilityImage } from "@/lib/facility-images";
import { apiFetch } from "@/lib/api";
import type { ActionStatus, ChecklistBlock as ChecklistBlockType, ChildProfile, CommunityPost, Facility } from "@/types/dotori";

export default function FacilityDetailPage() {
	const params = useParams();
	const facilityId = params.id as string;
	const [facility, setFacility] = useState<Facility | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [actionStatus, setActionStatus] = useState<ActionStatus>("idle");
	const [liked, setLiked] = useState(false);
	const [relatedPosts, setRelatedPosts] = useState<CommunityPost[]>([]);
	const [intentId, setIntentId] = useState<string | null>(null);
	const [sheetPreview, setSheetPreview] = useState<Record<string, string>>({});
	const [userChildren, setUserChildren] = useState<ChildProfile[]>([]);
	const [checklist, setChecklist] = useState<ChecklistBlockType | null>(null);
	const [showChecklist, setShowChecklist] = useState(false);
	const [isTogglingLike, setIsTogglingLike] = useState(false);
	const { addToast } = useToast();

	// ── Data fetching ──

	const fetchFacility = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const res = await apiFetch<{ data: Facility }>(
				`/api/facilities/${facilityId}`,
			);
			setFacility(res.data);
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "시설 정보를 불러올 수 없습니다",
			);
		} finally {
			setIsLoading(false);
		}
	}, [facilityId]);

	useEffect(() => {
		fetchFacility();
	}, [fetchFacility]);

	useEffect(() => {
		apiFetch<{ data: { children?: ChildProfile[]; interests?: string[] } }>("/api/users/me")
			.then((res) => {
				setUserChildren(res.data.children ?? []);
				if (res.data.interests?.includes(facilityId)) {
					setLiked(true);
				}
			})
			.catch(() => {});
	}, [facilityId]);

	useEffect(() => {
		if (!facilityId) return;
		apiFetch<{ data: CommunityPost[] }>(
			`/api/community/posts?facilityId=${facilityId}&limit=3`,
		)
			.then((res) => setRelatedPosts(res.data))
			.catch(() => {});
	}, [facilityId]);

	// ── Actions ──

	async function loadChecklist() {
		if (checklist) {
			setShowChecklist(!showChecklist);
			return;
		}
		setShowChecklist(true);
		try {
			const res = await apiFetch<{
				data: { checklist: ChecklistBlockType };
			}>(`/api/waitlist/checklist?facilityId=${facilityId}`);
			setChecklist(res.data.checklist);
		} catch {
			addToast({ type: "error", message: "체크리스트를 불러올 수 없습니다" });
			setShowChecklist(false);
		}
	}

	async function handleApplyClick() {
		if (!facility) return;
		setActionStatus("executing");
		setSheetOpen(true);
		try {
			const child = userChildren?.[0];
			const res = await apiFetch<{
				data: { intentId: string; preview: Record<string, string> };
			}>("/api/actions/intent", {
				method: "POST",
				body: JSON.stringify({
					actionType: "apply_waiting",
					params: {
						facilityId: facility.id,
						childName: child?.name,
						childBirthDate: child?.birthDate,
					},
				}),
			});
			setIntentId(res.data.intentId);
			setSheetPreview(res.data.preview);
			setActionStatus("idle");
		} catch {
			setActionStatus("error");
		}
	}

	async function handleConfirm() {
		if (!intentId) return;
		setActionStatus("executing");
		try {
			const res = await apiFetch<{
				data: { success: boolean; error?: string };
			}>("/api/actions/execute", {
				method: "POST",
				body: JSON.stringify({ intentId }),
			});
			if (res.data.success) {
				setActionStatus("success");
				addToast({
					type: "success",
					message:
						facility?.status === "available"
							? "입소 신청이 완료되었어요"
							: "대기 신청이 완료되었어요 · 대기 현황에서 확인할 수 있어요",
				});
				setTimeout(() => {
					setSheetOpen(false);
					setActionStatus("idle");
					setIntentId(null);
				}, 1500);
			} else {
				setActionStatus("error");
				addToast({
					type: "error",
					message: res.data.error || "신청에 실패했어요",
				});
			}
		} catch {
			setActionStatus("error");
			addToast({ type: "error", message: "신청에 실패했어요. 다시 시도해주세요" });
		}
	}

	async function toggleLike() {
		if (!facility || isTogglingLike) return;
		setIsTogglingLike(true);
		const newLiked = !liked;
		setLiked(newLiked);

		try {
			await apiFetch("/api/users/me/interests", {
				method: newLiked ? "POST" : "DELETE",
				body: JSON.stringify({ facilityId: facility.id }),
			});
			addToast({
				type: "success",
				message: newLiked
					? "관심 목록에 추가했어요"
					: "관심 목록에서 삭제했어요",
			});
		} catch {
			setLiked(!newLiked);
		} finally {
			setIsTogglingLike(false);
		}
	}

	// ── Loading state ──
	if (isLoading) {
		return (
			<div className="pb-4">
				<header className="sticky top-0 z-20 flex items-center justify-between bg-white/80 px-5 py-3.5 backdrop-blur-xl">
					<Link
						href="/explore"
						aria-label="뒤로 가기"
						className="rounded-full p-2.5 transition-all active:scale-[0.97] hover:bg-dotori-50"
					>
						<ArrowLeftIcon className="h-6 w-6" />
					</Link>
					<div className="h-5 w-32 animate-pulse rounded bg-dotori-100" />
					<div className="h-8 w-16" />
				</header>
				<div className="mt-4">
					<Skeleton variant="facility-detail" />
				</div>
			</div>
		);
	}

	// ── Error state ──
	if (error || !facility) {
		return (
			<div className="pb-4">
				<header className="sticky top-0 z-20 flex items-center gap-3 bg-white/80 px-5 py-3.5 backdrop-blur-xl">
					<Link
						href="/explore"
						aria-label="뒤로 가기"
						className="rounded-full p-2.5 transition-all active:scale-[0.97] hover:bg-dotori-50"
					>
						<ArrowLeftIcon className="h-6 w-6" />
					</Link>
					<h1 className="text-base font-semibold">시설 정보</h1>
				</header>
				<ErrorState
					message={error || "시설 정보를 찾을 수 없습니다"}
					action={{ label: "다시 시도", onClick: fetchFacility }}
				/>
			</div>
		);
	}

	// ── Main content ──
	return (
		<div className="pb-32">
			<FacilityDetailHeader
				name={facility.name}
				facilityId={facility.id}
				facilityType={facility.type}
				liked={liked}
				isTogglingLike={isTogglingLike}
				onToggleLike={toggleLike}
			/>

			{/* 시설 사진 */}
			<div className="relative mx-5 h-52 overflow-hidden rounded-3xl">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={getFacilityImage(facility)}
					alt={`${facility.name} 사진`}
					className="h-full w-full object-cover"
				/>
			</div>

			<div className="mt-4 space-y-3 px-5">
				<FacilityInfoCard facility={facility} />
				<FacilityCapacityCard
					facility={facility}
					actionStatus={actionStatus}
					onApplyClick={handleApplyClick}
				/>
				<FacilityLocationCard facility={facility} />
				<FacilityFeaturesCard features={facility.features} />
				<IsalangCard />
				<FacilityChecklistCard
					facilityType={facility.type}
					checklist={checklist}
					showChecklist={showChecklist}
					onToggle={loadChecklist}
				/>
				<FacilityReviewsCard posts={relatedPosts} facilityId={facility.id} facilityName={facility.name} />
				<FacilityInsights facility={facility} />
			</div>

			{/* ── 하단 고정 액션바 ── */}
			<div className="fixed bottom-20 left-4 right-4 z-30 mx-auto max-w-md rounded-2xl border border-dotori-100 bg-white/95 shadow-[0_-2px_24px_rgba(200,149,106,0.10)] backdrop-blur-xl">
				<div className="flex gap-3 px-5 py-3.5">
					<button
						onClick={toggleLike}
						disabled={isTogglingLike}
						className={cn(
							"flex items-center justify-center gap-2 rounded-2xl border-2 px-5 py-3.5 text-[15px] font-semibold transition-all active:scale-[0.97]",
							liked
								? "border-dotori-500 bg-dotori-50 text-dotori-600"
								: "border-dotori-200 text-dotori-500",
						)}
					>
						{liked ? "❤️" : "🤍"} 관심
					</button>
					<button
						onClick={handleApplyClick}
						disabled={actionStatus === "executing"}
						className={cn(
							"flex-1 rounded-2xl py-3.5 text-[15px] font-semibold text-white transition-all active:scale-[0.97]",
							facility.status === "available"
								? "bg-forest-600 hover:bg-forest-700"
								: "bg-dotori-900 hover:bg-dotori-800",
							actionStatus === "executing" && "opacity-60",
						)}
					>
						{actionStatus === "executing"
							? "처리 중..."
							: facility.status === "available"
								? "입소 신청하기"
								: "대기 신청하기"}
					</button>
				</div>
			</div>

			<ActionConfirmSheet
				open={sheetOpen}
				onClose={() => {
					setSheetOpen(false);
					setActionStatus("idle");
					setIntentId(null);
				}}
				title="신청 확인"
				description="아래 내용을 확인해주세요"
				preview={
					Object.keys(sheetPreview).length > 0
						? sheetPreview
						: {
								시설명: facility.name,
								신청유형:
									facility.status === "available"
										? "입소 신청"
										: "대기 신청",
							}
				}
				onConfirm={handleConfirm}
				status={actionStatus}
			/>
		</div>
	);
}
