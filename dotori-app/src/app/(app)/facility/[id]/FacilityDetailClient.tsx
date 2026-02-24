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
import { DS_GLASS, DS_STATUS } from "@/lib/design-system/tokens";
import { stagger, tap } from "@/lib/motion";
import { getFirstSafeImageUrl } from "@/lib/safe-image";
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
			<header
				className={`${DS_GLASS.HEADER} sticky top-0 z-20 flex items-center gap-2.5 px-4 py-3 text-dotori-800 dark:text-dotori-100`}
			>
				<motion.button
					type="button"
					onClick={handleBack}
					aria-label="뒤로 가기"
					whileTap={tap.button.whileTap}
					transition={tap.button.transition}
					className="min-h-11 min-w-11 rounded-full p-2 transition-all hover:bg-dotori-50 dark:hover:bg-dotori-900"
				>
					<ArrowLeftIcon className="h-6 w-6" />
				</motion.button>
				<h1 className="min-w-0 flex-1 truncate text-h2 font-semibold text-dotori-900 dark:text-dotori-50">
					시설 상세정보
				</h1>
				<span className="w-10" aria-hidden="true" />
			</header>
			<div className="mt-4 px-4">
				<ErrorState
					message={message}
					detail="네트워크 상태를 확인하고 다시 시도해 주세요"
					variant="notfound"
					action={{
						label: "다시 시도",
						onClick: handleRetry,
					}}
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
	const [copyingPhone, setCopyingPhone] = useState(false);
	const [copyingAddress, setCopyingAddress] = useState(false);
	const [isFacilityImageBroken, setIsFacilityImageBroken] = useState(false);
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

	const copyablePhone = facility.phone?.trim();
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
	const facilityImageUrl = useMemo(
		() => getFirstSafeImageUrl(facility.images),
		[facility.images],
	);
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
	const statusTone = DS_STATUS[facility.status];
	const aiInsightSummary = useMemo(() => {
		if (facility.status === "available") {
			return `현재 입소 가능 상태예요. 정원 대비 충원율 ${occupancyRate}%로, 바로 신청을 검토할 수 있어요.`;
		}
		if (waitingCapacity > 0) {
			return `현재 대기 ${waitingCapacity}명이에요. 서류 준비와 우선순위 체크를 먼저 진행하면 좋아요.`;
		}
		return `현재 충원율 ${occupancyRate}% 상태예요. 관심 등록 후 공석 알림으로 변화를 빠르게 확인해보세요.`;
	}, [facility.status, occupancyRate, waitingCapacity]);
	const interactionMessage = useMemo(() => {
		switch (facility.status) {
			case "available":
				return "입소 신청은 현재 바로 진행 가능해요. 신청 버튼을 눌러 다음 단계로 이동해보세요.";
			case "waiting":
				return "현재 대기 중이에요. 연락처와 대기 안내 메시지를 먼저 확인하고 신청을 진행해보세요.";
			default:
				return "현재 마감 상태예요. 최신 대기/빈자리 알림이 오면 즉시 확인할 수 있어요.";
		}
	}, [facility.status]);
	const sectionCardClass = `${DS_GLASS.CARD} overflow-hidden rounded-2xl border-none shadow-sm ring-1 ring-dotori-100/70 dark:ring-dotori-800`;

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
		?.map((photo) => photo?.trim())
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

	const handleCopyPhone = useCallback(async () => {
		if (!copyablePhone) return;

		try {
			setCopyingPhone(true);
			await navigator.clipboard.writeText(copyablePhone);
			addToast({ type: "success", message: "전화번호가 복사되었어요" });
		} catch {
			addToast({ type: "error", message: "전화번호 복사에 실패했어요" });
		} finally {
			setCopyingPhone(false);
		}
	}, [addToast, copyablePhone]);

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
		setIsFacilityImageBroken(false);
	}, [facility.id, facilityImageUrl]);

	useEffect(() => {
		apiFetch<{ data: CommunityPost[] }>(
			`/api/community/posts?facilityId=${facility.id}&limit=3`,
		)
			.then((res) => setRelatedPosts(res.data))
			.catch(() => {});
	}, [facility.id]);

	return (
		<motion.main {...stagger.container} className="pb-32 bg-dotori-50">
			<motion.header
				{...stagger.item}
				className={`${DS_GLASS.HEADER} sticky top-0 z-20 flex items-center gap-3 px-4 py-3 text-dotori-800 dark:text-dotori-100`}
			>
				<motion.button
					type="button"
					onClick={handleBack}
					aria-label="뒤로 가기"
					whileTap={tap.button.whileTap}
					transition={tap.button.transition}
					className="min-h-11 min-w-11 rounded-full p-2 transition-all hover:bg-dotori-50 dark:hover:bg-dotori-900"
				>
					<ArrowLeftIcon className="h-6 w-6" />
				</motion.button>
				<div className="min-w-0">
					<h1 className="truncate text-h1 font-bold leading-7 text-dotori-900 dark:text-dotori-50">
						{facility.name}
					</h1>
					<p className="mt-1 text-body-sm text-dotori-600 dark:text-dotori-200">
						{facility.address}
					</p>
				</div>
				<motion.button
					type="button"
					onClick={handleShare}
					aria-label="공유"
					whileTap={tap.button.whileTap}
					transition={tap.button.transition}
					className="ml-auto min-h-11 min-w-11 rounded-full p-2 transition-all hover:bg-dotori-50 dark:hover:bg-dotori-900"
				>
					<ShareIcon className="h-6 w-6" />
				</motion.button>
			</motion.header>

			<motion.section {...stagger.item} className="mx-4 mt-3">
				<FacilityStatusBadges
					facilityType={facility.type}
					status={facility.status}
					qualityScore={qualityScore}
					isPremiumFacility={isPremiumFacility}
				/>
			</motion.section>

			<motion.div
				{...stagger.item}
				className={`${DS_GLASS.CARD} relative mx-4 mt-3 h-52 overflow-hidden rounded-3xl shadow-sm ring-1 ring-dotori-100/70 dark:ring-dotori-800`}
			>
				{facilityImageUrl && !isFacilityImageBroken ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img
						src={facilityImageUrl}
						alt={`${facility.name} 사진`}
						className="h-full w-full object-cover"
						onError={() => setIsFacilityImageBroken(true)}
					/>
				) : (
					<div className="absolute inset-0 bg-dotori-100 dark:bg-dotori-900">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={BRAND.watermark}
							alt=""
							className="pointer-events-none absolute left-1/2 top-1/2 w-80 -translate-x-1/2 -translate-y-1/2 opacity-25 dark:opacity-20 sm:w-96"
						/>
						<div className="absolute inset-0 flex flex-col justify-end gap-1 p-4">
							<p className="text-body-sm font-semibold text-dotori-900 dark:text-dotori-50">
								사진 준비 중이에요
							</p>
							<p className="text-caption text-dotori-600 dark:text-dotori-200">
								대신 정원/연락처 등 핵심 정보를 먼저 확인해보세요.
							</p>
						</div>
					</div>
				)}
				<div className="absolute left-4 top-4 rounded-xl bg-white/90 p-1.5 shadow-sm dark:bg-dotori-950/90 dark:shadow-none">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={BRAND.symbol} alt="도토리" className="h-5 w-5" />
				</div>
			</motion.div>

			<motion.section
				{...stagger.item}
				className={`${DS_GLASS.CARD} mx-4 mt-3 rounded-2xl border border-dotori-100/70 bg-dotori-50/80 px-4 py-3 shadow-sm ring-1 ring-dotori-100/70 dark:border-dotori-800 ${statusTone.border}`}
			>
				<div className="flex items-center gap-2.5">
					<span className={`mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${statusTone.dot}`} />
					<div className="min-w-0">
						<p className="text-label font-semibold text-dotori-900 dark:text-dotori-100">
							{statusTone.label}
						</p>
						<p className="text-body-sm mt-1 text-dotori-700 dark:text-dotori-200">
							{interactionMessage}
						</p>
					</div>
				</div>
			</motion.section>

			<div className="mt-3 px-4">
				<motion.section {...stagger.item} className={sectionCardClass}>
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
				</motion.section>

				<motion.section {...stagger.item} className={`${sectionCardClass} mt-4`}>
					<FacilityPremiumSection
						showPremiumSection={showPremiumSection}
						premiumVerifiedAt={premiumVerifiedAt}
						premiumDirectorMessage={premiumDirectorMessage}
						premiumPrograms={premiumPrograms}
						premiumHighlights={premiumHighlights}
						premiumPhotos={premiumPhotos}
						facilityName={facility.name}
					/>
				</motion.section>

				<motion.section {...stagger.item} className={`${sectionCardClass} mt-4`}>
					<FacilityContactMapSections
						phone={facility.phone}
						address={facility.address}
						kakaoMapUrl={kakaoMapUrl}
						websiteUrl={websiteUrl}
						copyablePhone={copyablePhone}
						copyingPhone={copyingPhone}
						onCopyPhone={handleCopyPhone}
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
				</motion.section>

				<motion.section {...stagger.item} className={`${sectionCardClass} mt-4`}>
					<IsalangCard />
				</motion.section>
				<motion.section {...stagger.item} className={`${sectionCardClass} mt-4`}>
					<FacilityChecklistCard
						facilityType={facility.type}
						checklist={checklist}
						showChecklist={showChecklist}
						onToggle={loadChecklist}
					/>
				</motion.section>
				<motion.section {...stagger.item} className={`${sectionCardClass} mt-4`}>
					<FacilityReviewsCard
						posts={relatedPosts}
						facilityId={facility.id}
						facilityName={facility.name}
					/>
				</motion.section>
				<motion.section {...stagger.item} className={`${sectionCardClass} mt-4`}>
					<FacilityInsights facility={facility} />
				</motion.section>
				<motion.section {...stagger.item} className={`${sectionCardClass} mt-4`}>
					<FacilityAdmissionGuideSection />
				</motion.section>
			</div>

			<motion.section
				{...stagger.item}
				className="mt-5 [&_button]:min-h-11 [&_button]:rounded-xl [&_a]:min-h-11 [&_.glass-float]:rounded-3xl [&_.glass-float]:ring-1 [&_.glass-float]:ring-dotori-100/70 [&_.glass-float]:shadow-sm [&_.glass-float]:shadow-dotori-900/15"
			>
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
			</motion.section>

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
		</motion.main>
	);
}
