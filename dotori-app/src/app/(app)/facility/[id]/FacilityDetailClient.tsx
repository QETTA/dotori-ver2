"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, ShareIcon } from "@heroicons/react/24/outline";
import { motion } from "motion/react";

import { ErrorState } from "@/components/dotori/ErrorState";
import {
	FacilityAdmissionGuideSection,
	FacilityCoreInfoSections,
} from "@/components/dotori/facility/FacilityCapacitySection";
import { FacilityChecklistCard } from "@/components/dotori/facility/FacilityChecklistCard";
import {
	FacilityActionBar,
	FacilityContactMapSections,
} from "@/components/dotori/facility/FacilityContactSection";
import { FacilityInsights } from "@/components/dotori/facility/FacilityInsights";
import { FacilityPremiumSection } from "@/components/dotori/facility/FacilityPremiumSection";
import { FacilityReviewsCard } from "@/components/dotori/facility/FacilityReviewsCard";
import { FacilityStatusBadges } from "@/components/dotori/facility/FacilityStatusBadges";
import { IsalangCard } from "@/components/dotori/facility/IsalangCard";
import {
	getCapacityProgressColor,
	getFormattedVerifiedAt,
	getSafeNumber,
	getWaitingHintText,
} from "@/components/dotori/facility/facility-detail-helpers";
import { useFacilityDetailActions } from "@/components/dotori/facility/useFacilityDetailActions";
import { useToast } from "@/components/dotori/ToastProvider";
import { apiFetch } from "@/lib/api";
import { BRAND } from "@/lib/brand-assets";
import { getFacilityImage } from "@/lib/facility-images";
import { fadeUp } from "@/lib/motion";
import type { CommunityPost, Facility } from "@/types/dotori";

const ActionConfirmSheet = dynamic(
	() =>
		import("@/components/dotori/ActionConfirmSheet").then((m) => ({
			default: m.ActionConfirmSheet,
		})),
	{ loading: () => null },
);

type FacilityDetailClientFacility = Facility & {
	roomCount?: number;
	teacherCount?: number;
	establishmentYear?: number;
	homepage?: string;
	website?: string;
};

type FacilityPremiumProfile = {
	directorMessage?: string | null;
	highlights?: Array<string | null | undefined>;
	photos?: Array<string | null | undefined>;
	programs?: Array<string | null | undefined>;
};

type FacilityPremiumMeta = {
	isActive?: boolean;
	verifiedAt?: string | number | Date | null;
};

type FacilityPremiumFacility = FacilityDetailClientFacility & {
	isPremium?: boolean;
	premium?: FacilityPremiumMeta;
	premiumProfile?: FacilityPremiumProfile | null;
};

type FacilityDetailClientProps = {
	facility?: FacilityDetailClientFacility;
	loadError?: string;
};

function FacilityDetailErrorState({ message }: { message: string }) {
	const router = useRouter();

	const handleBack = useCallback(() => {
		if (typeof window !== "undefined" && window.history.length > 1) {
			router.back();
			return;
		}

		router.push("/explore");
	}, [router]);

	const handleRetry = useCallback(() => {
		router.refresh();
	}, [router]);

	return (
		<div className="pb-4">
			<header className="glass-header sticky top-0 z-20 flex items-center gap-3 px-5 py-3.5 text-dotori-800 dark:text-dotori-100">
				<button
					type="button"
					onClick={handleBack}
					aria-label="뒤로 가기"
					className="rounded-full p-2.5 transition-all active:scale-[0.97] hover:bg-dotori-50 dark:hover:bg-dotori-900"
				>
					<ArrowLeftIcon className="h-6 w-6" />
				</button>
				<h1 className="min-w-0 flex-1 truncate text-base font-semibold text-dotori-900 dark:text-dotori-50">
					시설 상세정보
				</h1>
				<span className="w-11" aria-hidden="true" />
			</header>
			<div className="px-5">
				<ErrorState
					message={message}
					detail="네트워크 상태를 확인하고 다시 시도해 주세요"
					variant="notfound"
					action={{ label: "다시 시도", onClick: handleRetry }}
				/>
			</div>
		</div>
	);
}

export default function FacilityDetailClient({
	facility,
	loadError,
}: FacilityDetailClientProps) {
	if (!facility || loadError) {
		return (
			<FacilityDetailErrorState message={loadError ?? "시설 정보를 불러오지 못했어요"} />
		);
	}

	return <FacilityDetailClientContent facility={facility} />;
}

function FacilityDetailClientContent({ facility }: { facility: FacilityDetailClientFacility }) {
	const [copyingAddress, setCopyingAddress] = useState(false);
	const [relatedPosts, setRelatedPosts] = useState<CommunityPost[]>([]);
	const { addToast } = useToast();
	const router = useRouter();
	const {
		sheetOpen,
		actionStatus,
		sheetPreviewForConfirm,
		liked,
		isTogglingLike,
		checklist,
		showChecklist,
		applyActionLabel,
		error,
		loadChecklist,
		handleApplyClick,
		handleConfirm,
		toggleLike,
		resetActionStatus,
		closeSheet,
	} = useFacilityDetailActions({
		facilityId: facility.id,
		facilityName: facility.name,
		facilityStatus: facility.status,
	});

	const copyableAddress = facility.address?.trim();

	const keyStats = useMemo(() => {
		const roomCount = getSafeNumber(facility.roomCount);
		const teacherCount = getSafeNumber(facility.teacherCount);
		const establishmentYear = getSafeNumber(facility.establishmentYear);

		return [
			...(roomCount != null ? [{ label: "보육실", value: `${roomCount}개` }] : []),
			...(teacherCount != null ? [{ label: "교직원", value: `${teacherCount}명` }] : []),
			...(establishmentYear != null
				? [{ label: "설립연도", value: `${establishmentYear}년` }]
				: []),
		];
	}, [
		facility.roomCount,
		facility.teacherCount,
		facility.establishmentYear,
	]);

	const qualityScore = useMemo(() => {
		const score = facility.dataQuality?.score as number | string | undefined;
		if (typeof score === "number" && Number.isFinite(score)) {
			return score;
		}

		if (typeof score === "string" && score.trim()) {
			const parsed = Number(score);
			return Number.isFinite(parsed) ? parsed : undefined;
		}

		return undefined;
	}, [facility.dataQuality?.score]);

	const hasMapLocation =
		Number.isFinite(facility.lat) &&
		Number.isFinite(facility.lng) &&
		!(facility.lat === 0 && facility.lng === 0);
	const waitingHintText = useMemo(() => getWaitingHintText(facility), [facility]);
	const totalCapacity = Math.max(0, facility.capacity.total);
	const currentCapacity = Math.max(0, facility.capacity.current);
	const waitingCapacity = Math.max(0, facility.capacity.waiting);
	const occupancyRate = useMemo(() => {
		if (totalCapacity <= 0) return 0;
		const boundedCurrent = Math.min(currentCapacity, totalCapacity);
		return Math.max(
			0,
			Math.min(100, Math.round((boundedCurrent / totalCapacity) * 100)),
		);
	}, [currentCapacity, totalCapacity]);
	const occupancyProgressColor = useMemo(
		() => getCapacityProgressColor(occupancyRate),
		[occupancyRate],
	);
	const aiInsightSummary = useMemo(() => {
		if (facility.status === "available") {
			return `현재 입소 가능 상태예요. 정원 대비 충원율 ${occupancyRate}%로, 바로 신청을 검토할 수 있어요.`;
		}
		if (waitingCapacity > 0) {
			return `현재 대기 ${waitingCapacity}명이에요. 서류 준비와 우선순위 체크를 먼저 진행하면 좋아요.`;
		}
		return `현재 충원율 ${occupancyRate}% 상태예요. 관심 등록 후 공석 알림으로 변화를 빠르게 확인해보세요.`;
	}, [facility.status, occupancyRate, waitingCapacity]);

	const websiteUrl = useMemo(() => {
		const raw = facility.website || facility.homepage;
		if (!raw) return null;
		return raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
	}, [facility.homepage, facility.website]);

	const kakaoMapUrl = useMemo(
		() =>
			facility.kakaoPlaceUrl ||
			`https://map.kakao.com/link/search/${encodeURIComponent(`${facility.name} ${facility.address}`)}`,
		[facility.kakaoPlaceUrl, facility.name, facility.address],
	);

	const premiumFacility = facility as FacilityPremiumFacility;
	const isPremiumFacility =
		premiumFacility.isPremium === true || premiumFacility.premium?.isActive === true;
	const premiumMeta = premiumFacility.premium;
	const premiumDirectorMessage = premiumFacility.premiumProfile?.directorMessage?.trim();
	const premiumHighlights = premiumFacility.premiumProfile?.highlights
		?.map((item) => item.trim())
		.filter((item): item is string => item.length > 0);
	const premiumPrograms = premiumFacility.premiumProfile?.programs
		?.map((item) => item?.trim())
		.filter((item): item is string => item.length > 0);
	const premiumPhotos = premiumFacility.premiumProfile?.photos
		?.map((photo) => photo.trim())
		.filter((photo): photo is string => photo.length > 0);
	const premiumVerifiedAt = premiumMeta?.verifiedAt
		? getFormattedVerifiedAt(premiumMeta.verifiedAt)
		: null;
	const showPremiumSection =
		isPremiumFacility || Boolean(premiumFacility.premiumProfile);

	const handleCopyAddress = useCallback(async () => {
		if (!copyableAddress) return;

		try {
			setCopyingAddress(true);
			await navigator.clipboard.writeText(copyableAddress);
			addToast({ type: "success", message: "주소가 복사되었어요" });
		} catch {
			addToast({ type: "error", message: "주소 복사에 실패했어요" });
		} finally {
			setCopyingAddress(false);
		}
	}, [addToast, copyableAddress]);

	const handleBack = useCallback(() => {
		if (window.history.length > 1) {
			router.back();
			return;
		}

		router.push("/explore");
	}, [router]);

	const handleShare = useCallback(async () => {
		const shareData = {
			title: facility.name,
			text: `${facility.name} - ${facility.type} | 도토리`,
			url: `${window.location.origin}/facility/${facility.id}`,
		};

		try {
			if (navigator.share) {
				await navigator.share(shareData);
				return;
			}

			await navigator.clipboard.writeText(shareData.url);
			addToast({ type: "success", message: "링크가 복사되었어요" });
		} catch {
			// User cancelled share or clipboard failed — ignore
		}
	}, [addToast, facility.id, facility.name, facility.type]);

	useEffect(() => {
		apiFetch<{ data: CommunityPost[] }>(
			`/api/community/posts?facilityId=${facility.id}&limit=3`,
		)
			.then((res) => setRelatedPosts(res.data))
			.catch(() => {});
	}, [facility.id]);

	return (
		<div className="pb-32">
			<header className="glass-header sticky top-0 z-20 flex items-center gap-3 px-5 py-3.5 text-dotori-800 dark:text-dotori-100">
				<button
					type="button"
					onClick={handleBack}
					aria-label="뒤로 가기"
					className="rounded-full p-2.5 transition-all active:scale-[0.97] hover:bg-dotori-50 dark:hover:bg-dotori-900"
				>
					<ArrowLeftIcon className="h-6 w-6" />
				</button>
				<div className="min-w-0 max-w-[21rem]">
					<h1 className="truncate text-lg font-bold leading-6 text-dotori-900 dark:text-dotori-50">
						{facility.name}
					</h1>
				</div>
				<button
					type="button"
					onClick={handleShare}
					aria-label="공유"
					className="ml-auto rounded-full p-2.5 transition-all active:scale-[0.97] hover:bg-dotori-50 dark:hover:bg-dotori-900"
				>
					<ShareIcon className="h-6 w-6" />
				</button>
			</header>
			<FacilityStatusBadges
				facilityType={facility.type}
				status={facility.status}
				qualityScore={qualityScore}
				isPremiumFacility={isPremiumFacility}
			/>

			<motion.div {...fadeUp} className="relative mx-5 mt-4 h-52 overflow-hidden rounded-3xl">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={getFacilityImage(facility)}
					alt={`${facility.name} 사진`}
					className="h-full w-full object-cover"
				/>
				<div className="absolute left-4 top-4 rounded-xl bg-white/90 p-1.5 shadow-sm dark:bg-dotori-950/90 dark:shadow-none">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={BRAND.symbol} alt="도토리" className="h-5 w-5" />
				</div>
			</motion.div>

			<div className="mt-4 space-y-4 px-5">
				<FacilityCoreInfoSections
					status={facility.status}
					qualityScore={qualityScore}
					aiInsightSummary={aiInsightSummary}
					occupancyRate={occupancyRate}
					totalCapacity={totalCapacity}
					currentCapacity={currentCapacity}
					waitingCapacity={waitingCapacity}
					occupancyProgressColor={occupancyProgressColor}
					keyStats={keyStats}
					features={facility.features}
				/>

				<FacilityPremiumSection
					showPremiumSection={showPremiumSection}
					premiumVerifiedAt={premiumVerifiedAt}
					premiumDirectorMessage={premiumDirectorMessage}
					premiumPrograms={premiumPrograms}
					premiumHighlights={premiumHighlights}
					premiumPhotos={premiumPhotos}
					facilityName={facility.name}
				/>

				<FacilityContactMapSections
					phone={facility.phone}
					address={facility.address}
					kakaoMapUrl={kakaoMapUrl}
					websiteUrl={websiteUrl}
					copyableAddress={copyableAddress}
					copyingAddress={copyingAddress}
					onCopyAddress={handleCopyAddress}
					hasMapLocation={hasMapLocation}
					facilityId={facility.id}
					facilityName={facility.name}
					lat={facility.lat}
					lng={facility.lng}
					status={facility.status}
				/>

				<motion.div {...fadeUp}>
					<IsalangCard />
				</motion.div>
				<motion.div {...fadeUp}>
					<FacilityChecklistCard
						facilityType={facility.type}
						checklist={checklist}
						showChecklist={showChecklist}
						onToggle={loadChecklist}
					/>
				</motion.div>
				<motion.div {...fadeUp}>
					<FacilityReviewsCard
						posts={relatedPosts}
						facilityId={facility.id}
						facilityName={facility.name}
					/>
				</motion.div>
				<motion.div {...fadeUp}>
					<FacilityInsights facility={facility} />
				</motion.div>
				<FacilityAdmissionGuideSection />
			</div>

			<FacilityActionBar
				liked={liked}
				isTogglingLike={isTogglingLike}
				actionStatus={actionStatus}
				error={error}
				waitingHintText={waitingHintText}
				applyActionLabel={applyActionLabel}
				onToggleLike={toggleLike}
				onApplyClick={handleApplyClick}
				onResetActionStatus={resetActionStatus}
			/>

			<ActionConfirmSheet
				open={sheetOpen}
				onClose={closeSheet}
				title="신청 확인"
				description="아래 내용을 확인해주세요"
				preview={sheetPreviewForConfirm}
				onConfirm={handleConfirm}
				status={actionStatus}
				{...(actionStatus === "error" && error ? { error } : {})}
			/>
		</div>
	);
}
