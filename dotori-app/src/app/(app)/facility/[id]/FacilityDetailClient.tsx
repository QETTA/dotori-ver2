"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
	ArrowLeftIcon,
	ShareIcon,
	HeartIcon,
	ArrowTopRightOnSquareIcon,
	ArrowPathIcon,
	CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";

import { Button } from "@/components/catalyst/button";
import { Badge } from "@/components/catalyst/badge";
import { ErrorState } from "@/components/dotori/ErrorState";
import { IsalangCard } from "@/components/dotori/facility/IsalangCard";
import { FacilityChecklistCard } from "@/components/dotori/facility/FacilityChecklistCard";
import { FacilityInsights } from "@/components/dotori/facility/FacilityInsights";
import { FacilityReviewsCard } from "@/components/dotori/facility/FacilityReviewsCard";
import { FacilityPremiumSection } from "@/components/dotori/facility/FacilityPremiumSection";
import { FacilityCapacitySection } from "@/components/dotori/facility/FacilityCapacitySection";
import { FacilityContactSection } from "@/components/dotori/facility/FacilityContactSection";
import { FacilityStatusBadges } from "@/components/dotori/facility/FacilityStatusBadges";
import { useFacilityDetailActions } from "@/components/dotori/facility/useFacilityDetailActions";
import { MapEmbed } from "@/components/dotori/MapEmbed";
import { useToast } from "@/components/dotori/ToastProvider";
import { apiFetch } from "@/lib/api";
import { BRAND } from "@/lib/brand-assets";
import { getFacilityImage } from "@/lib/facility-images";
import {
	getCapacityProgressColor,
	getFormattedVerifiedAt,
	getSafeNumber,
	getWaitingHintText,
} from "@/components/dotori/facility/facility-detail-helpers";
import type { ActionStatus, CommunityPost, Facility } from "@/types/dotori";

const ActionConfirmSheet = dynamic(
	() =>
		import("@/components/dotori/ActionConfirmSheet").then((m) => ({
			default: m.ActionConfirmSheet,
		})),
	{ loading: () => null },
);

const FEATURE_OPTIONS = [
	{ key: "CCTV", label: "CCTV", color: "forest" },
	{ key: "소규모", label: "소규모", color: "forest" },
	{ key: "통학버스", label: "통학버스", color: "forest" },
	{ key: "놀이터", label: "놀이터", color: "forest" },
	{ key: "대규모", label: "대규모", color: "forest" },
] as const;

type FeatureOption = (typeof FEATURE_OPTIONS)[number];

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
			<header className="sticky top-0 z-20 flex items-center gap-3 bg-white/80 px-5 py-3.5 backdrop-blur-xl">
				<button
					type="button"
					onClick={handleBack}
					aria-label="뒤로 가기"
					className="rounded-full p-2.5 transition-all active:scale-[0.97] hover:bg-dotori-50"
				>
					<ArrowLeftIcon className="h-6 w-6" />
				</button>
				<h1 className="min-w-0 flex-1 truncate text-base font-semibold text-dotori-900">
					시설 상세정보
				</h1>
				<span className="w-11" aria-hidden="true" />
			</header>
			<div className="px-5">
				<ErrorState message={message} />
				<Button
					type="button"
					onClick={handleRetry}
					className="mt-5 min-h-12 w-full rounded-3xl bg-dotori-400 font-bold text-white transition-all active:scale-[0.98] hover:bg-dotori-600"
				>
					다시 시도
				</Button>
			</div>
		</div>
	);
}

function FacilityFeatureSection({ features }: { features: FeatureOption[] }) {
	return (
		<section className="rounded-3xl bg-white p-5 shadow-sm">
			<h2 className="text-sm font-semibold text-dotori-900">특징</h2>
			{features.length > 0 ? (
				<div className="mt-3 flex flex-wrap gap-2">
					{features.map((feature) => (
						<Badge key={feature.key} color={feature.color} className="text-[14px]">
							{feature.label} ✓
						</Badge>
					))}
				</div>
			) : (
				<p className="mt-3 text-sm text-dotori-500">표시 가능한 특징이 없어요.</p>
			)}
		</section>
	);
}

function FacilityAdmissionGuideSection() {
	return (
		<div className="rounded-3xl border border-dotori-100 bg-dotori-50 p-5">
			<h2 className="text-sm font-semibold text-dotori-900">입소 설명회 안내</h2>
			<p className="mt-2 text-[14px] leading-6 text-dotori-600">
				이 시설의 입소 설명회 일정은 아직 등록되지 않았어요.
				시설에 직접 문의하거나 아이사랑포털에서 확인해 보세요.
			</p>
			<a
				href="https://www.childcare.go.kr"
				target="_blank"
				rel="noopener noreferrer"
				className="mt-3 inline-flex items-center gap-1.5 rounded-2xl bg-dotori-100 px-4 py-2.5 text-[14px] font-semibold text-dotori-700 transition-all active:scale-[0.97] hover:bg-dotori-200"
			>
				아이사랑포털에서 확인
				<ArrowTopRightOnSquareIcon className="h-4 w-4" />
			</a>
		</div>
	);
}

type FacilityActionBarProps = {
	liked: boolean;
	isTogglingLike: boolean;
	actionStatus: ActionStatus;
	error: string | null;
	waitingHintText: string;
	applyActionLabel: string;
	onToggleLike: () => Promise<void>;
	onApplyClick: () => Promise<void>;
	onResetActionStatus: () => void;
};

function FacilityActionBar({
	liked,
	isTogglingLike,
	actionStatus,
	error,
	waitingHintText,
	applyActionLabel,
	onToggleLike,
	onApplyClick,
	onResetActionStatus,
}: FacilityActionBarProps) {
	return (
		<div className="fixed bottom-20 left-4 right-4 z-30 mx-auto max-w-md rounded-2xl border border-dotori-100 bg-white/95 px-5 py-3.5 shadow-[0_-2px_24px_rgba(200,149,106,0.10)] backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
			<div className="space-y-2">
				<div className="flex gap-3">
					<Button
						plain={true}
						disabled={isTogglingLike}
						onClick={onToggleLike}
						aria-label="관심 시설 추가/제거"
						className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-dotori-200 bg-white px-3 text-base font-semibold text-dotori-700 transition-all active:scale-[0.97]"
					>
						{liked ? (
							<HeartSolid className="h-5 w-5 text-red-500" />
						) : (
							<HeartIcon className="h-5 w-5" />
						)}
						{liked ? "관심 추가됨" : "관심 추가"}
					</Button>
					<div className="flex-1">
						{actionStatus === "executing" ? (
							<div className="min-h-12 rounded-3xl border border-dotori-100 bg-dotori-50 px-4">
								<div className="flex h-full items-center justify-center gap-2">
									<ArrowPathIcon className="h-5 w-5 animate-spin text-dotori-700" />
									<span className="text-sm font-semibold text-dotori-700">
										신청 처리 중...
									</span>
								</div>
							</div>
						) : actionStatus === "success" ? (
							<div className="rounded-3xl border border-forest-200 bg-forest-50 px-4 py-2.5 text-center">
								<CheckCircleIcon className="mx-auto h-6 w-6 animate-in zoom-in text-forest-600 duration-300" />
								<p className="mt-2 text-sm font-semibold text-dotori-900">
									대기 신청 완료!
								</p>
								<Link
									href="/my/waitlist"
									className="mt-1 inline-flex text-sm font-semibold text-dotori-700 underline underline-offset-4 transition-colors hover:text-dotori-900"
								>
									MY &gt; 대기 현황에서 확인하세요
								</Link>
								<Button
									plain={true}
									onClick={onResetActionStatus}
									className="mt-2 min-h-10 w-full rounded-2xl"
								>
									확인
								</Button>
							</div>
						) : actionStatus === "error" ? (
							<div className="rounded-3xl border border-danger/30 bg-danger/5 px-4 py-2.5 text-left">
								<p className="text-sm font-semibold text-danger">
									{error ?? "대기 신청 중 오류가 발생했어요."}
								</p>
								<div className="mt-2 flex gap-2">
									<Button
										plain={true}
										onClick={onResetActionStatus}
										className="min-h-10 flex-1 rounded-2xl"
									>
										닫기
									</Button>
									<Button
										color="dotori"
										onClick={onApplyClick}
										className="min-h-10 flex-1 rounded-2xl"
									>
										다시 신청
									</Button>
								</div>
							</div>
						) : (
							<>
								<Button
									color="dotori"
									onClick={onApplyClick}
									className="min-h-12 w-full py-3 text-base font-semibold"
								>
									{applyActionLabel}
								</Button>
								<p className="mt-1 text-xs text-dotori-500">{waitingHintText}</p>
							</>
						)}
					</div>
				</div>
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

	const activeFeatures = useMemo(() => {
		return FEATURE_OPTIONS.filter((feature) => facility.features.includes(feature.key));
	}, [facility.features]);

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
			<header className="sticky top-0 z-20 flex items-center gap-3 bg-white/80 px-5 py-3.5 backdrop-blur-xl">
				<button
					type="button"
					onClick={handleBack}
					aria-label="뒤로 가기"
					className="rounded-full p-2.5 transition-all active:scale-[0.97] hover:bg-dotori-50"
				>
					<ArrowLeftIcon className="h-6 w-6" />
				</button>
				<div className="min-w-0 max-w-[21rem]">
					<h1 className="truncate text-[18px] font-bold leading-6 text-dotori-900">
						{facility.name}
					</h1>
				</div>
				<button
					type="button"
					onClick={handleShare}
					aria-label="공유"
					className="ml-auto rounded-full p-2.5 transition-all active:scale-[0.97] hover:bg-dotori-50"
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

			<div className="relative mx-5 mt-4 h-52 overflow-hidden rounded-3xl">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={getFacilityImage(facility)}
					alt={`${facility.name} 사진`}
					className="h-full w-full object-cover"
				/>
				<div className="absolute left-4 top-4 rounded-xl bg-white/90 p-1.5 shadow-sm">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={BRAND.symbol} alt="도토리" className="h-5 w-5" />
				</div>
			</div>

			<div className="mt-4 space-y-3 px-5">
				<FacilityCapacitySection
					occupancyRate={occupancyRate}
					currentCapacity={currentCapacity}
					totalCapacity={totalCapacity}
					waitingCapacity={waitingCapacity}
					occupancyProgressColor={occupancyProgressColor}
					keyStats={keyStats}
				/>

				<FacilityFeatureSection features={activeFeatures} />

				<FacilityPremiumSection
					showPremiumSection={showPremiumSection}
					premiumVerifiedAt={premiumVerifiedAt}
					premiumDirectorMessage={premiumDirectorMessage}
					premiumPrograms={premiumPrograms}
					premiumHighlights={premiumHighlights}
					premiumPhotos={premiumPhotos}
					facilityName={facility.name}
				/>

				<FacilityContactSection
					phone={facility.phone}
					address={facility.address}
					kakaoMapUrl={kakaoMapUrl}
					websiteUrl={websiteUrl}
					copyableAddress={copyableAddress}
					copyingAddress={copyingAddress}
					onCopyAddress={handleCopyAddress}
				/>

				{hasMapLocation && (
					<section className="rounded-3xl bg-white p-5 shadow-sm">
						<h2 className="text-sm font-semibold text-dotori-900">지도</h2>
						<div className="mt-3 overflow-hidden rounded-2xl border border-dotori-100">
							<MapEmbed
								facilities={[
									{
										id: facility.id,
										name: facility.name,
										lat: facility.lat,
										lng: facility.lng,
										status: facility.status,
									},
								]}
								center={{ lat: facility.lat, lng: facility.lng }}
								height="h-56"
							/>
						</div>
						<a
							href={kakaoMapUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="mt-3 inline-flex items-center gap-1 text-sm text-dotori-600 transition-colors hover:text-dotori-700"
						>
							카카오맵에서 자세히 보기
						</a>
					</section>
				)}

				<IsalangCard />
				<FacilityChecklistCard
					facilityType={facility.type}
					checklist={checklist}
					showChecklist={showChecklist}
					onToggle={loadChecklist}
				/>
				<FacilityReviewsCard
					posts={relatedPosts}
					facilityId={facility.id}
					facilityName={facility.name}
				/>
				<FacilityInsights facility={facility} />
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
