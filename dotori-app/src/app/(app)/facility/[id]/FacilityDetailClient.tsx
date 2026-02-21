"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
	ArrowLeftIcon,
	GlobeAltIcon,
	ClipboardDocumentIcon,
	ShareIcon,
	HeartIcon,
	MapPinIcon,
	PhoneIcon,
	ArrowTopRightOnSquareIcon,
	ArrowPathIcon,
	CheckCircleIcon,
	ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";

import { Button } from "@/components/catalyst/button";
import { Badge } from "@/components/catalyst/badge";
import { ErrorState } from "@/components/dotori/ErrorState";
import { IsalangCard } from "@/components/dotori/facility/IsalangCard";
import { FacilityChecklistCard } from "@/components/dotori/facility/FacilityChecklistCard";
import { FacilityInsights } from "@/components/dotori/facility/FacilityInsights";
import { FacilityReviewsCard } from "@/components/dotori/facility/FacilityReviewsCard";
import { MapEmbed } from "@/components/dotori/MapEmbed";
import { useToast } from "@/components/dotori/ToastProvider";
import { apiFetch } from "@/lib/api";
import { BRAND } from "@/lib/brand-assets";
import { getFacilityImage } from "@/lib/facility-images";
import type {
	ActionStatus,
	ChecklistBlock as ChecklistBlockType,
	ChildProfile,
	CommunityPost,
	Facility,
} from "@/types/dotori";

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

function getTypeBadgeColor(type: string): "dotori" | "blue" | "amber" | "forest" | "pink" | "emerald" {
	switch (type) {
		case "국공립":
			return "blue";
		case "민간":
			return "amber";
		case "가정":
			return "forest";
		case "직장":
			return "pink";
		case "협동":
			return "emerald";
		case "사회복지":
			return "dotori";
		default:
			return "dotori";
	}
}

function getQualityColor(score?: number): "forest" | "amber" | "dotori" {
	if (score == null) return "dotori";
	if (score >= 85) return "forest";
	if (score >= 70) return "amber";
	return "dotori";
}

function getSafeNumber(value?: number | null): number | null {
	if (typeof value !== "number" || Number.isNaN(value)) return null;
	return value;
}

function getFormattedVerifiedAt(
	verifiedAt: string | number | Date | null | undefined,
): string | null {
	if (!verifiedAt) return null;

	const date = verifiedAt instanceof Date ? verifiedAt : new Date(verifiedAt);
	if (Number.isNaN(date.getTime())) return null;

	const year = date.getFullYear();
	const month = `${date.getMonth() + 1}`.padStart(2, "0");
	return `${year}.${month}`;
}

function getErrorMessage(error: unknown, fallback: string): string {
	if (typeof error === "string") return error.trim() || fallback;
	if (error instanceof Error) return error.message.trim() || fallback;
	return fallback;
}

function getWaitingHintText(facility: FacilityDetailClientFacility): string {
	if (facility.status === "available") {
		return "현재 입소 가능 상태로, 신청 후 곧바로 처리될 수 있어요.";
	}

	if (facility.capacity.waiting <= 0) {
		return "현재 대기 인원이 없어 입소까지 빠르게 마감될 수 있어요.";
	}

	if (facility.capacity.waiting <= 5) {
		return `현재 대기 ${facility.capacity.waiting}명이며 보통 1~3주 내로 처리될 수 있어요.`;
	}

	return `현재 대기 ${facility.capacity.waiting}명, 입소까지 3~8주가량 소요될 수 있어요.`;
}

function FacilityDetailClientContent({ facility }: { facility: FacilityDetailClientFacility }) {
	const [sheetOpen, setSheetOpen] = useState(false);
	const [actionStatus, setActionStatus] = useState<ActionStatus>("idle");
	const [intentId, setIntentId] = useState<string | null>(null);
	const [sheetPreview, setSheetPreview] = useState<Record<string, string>>({});
	const [liked, setLiked] = useState(false);
	const [isTogglingLike, setIsTogglingLike] = useState(false);
	const [copyingAddress, setCopyingAddress] = useState(false);
	const [relatedPosts, setRelatedPosts] = useState<CommunityPost[]>([]);
	const [userChildren, setUserChildren] = useState<ChildProfile[]>([]);
	const [checklist, setChecklist] = useState<ChecklistBlockType | null>(null);
	const [showChecklist, setShowChecklist] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { addToast } = useToast();
	const router = useRouter();

	const activeFeatures = useMemo(() => {
		return FEATURE_OPTIONS.filter((feature) => facility.features.includes(feature.key));
	}, [facility.features]);

	const copyableAddress = facility.address?.trim();

	const keyStats = useMemo(() => {
		const totalCapacity = getSafeNumber(facility.capacity.total);
		const roomCount = getSafeNumber(facility.roomCount);
		const teacherCount = getSafeNumber(facility.teacherCount);
		const establishmentYear = getSafeNumber(facility.establishmentYear);

		return [
			...(totalCapacity != null ? [{ label: "총 정원", value: `${totalCapacity}명` }] : []),
			...(roomCount != null ? [{ label: "보육실", value: `${roomCount}개` }] : []),
			...(teacherCount != null ? [{ label: "교직원", value: `${teacherCount}명` }] : []),
			...(establishmentYear != null
				? [{ label: "설립연도", value: `${establishmentYear}년` }]
				: []),
		];
	}, [
		facility.capacity.total,
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

	const premiumProfile = facility.premiumProfile;
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
		apiFetch<{ data: { children?: ChildProfile[]; interests?: string[] } }>("/api/users/me")
			.then((res) => {
				setUserChildren(res.data.children ?? []);
				setLiked(Boolean(res.data.interests?.includes(facility.id)));
			})
			.catch(() => {});
	}, [facility.id]);

	useEffect(() => {
		apiFetch<{ data: CommunityPost[] }>(
			`/api/community/posts?facilityId=${facility.id}&limit=3`,
		)
			.then((res) => setRelatedPosts(res.data))
			.catch(() => {});
	}, [facility.id]);

	const loadChecklist = useCallback(async () => {
		if (checklist) {
			setShowChecklist(!showChecklist);
			return;
		}

		setShowChecklist(true);
		try {
			const res = await apiFetch<{
				data: { checklist: ChecklistBlockType };
			}>(`/api/waitlist/checklist?facilityId=${facility.id}`);
			setChecklist(res.data.checklist);
		} catch {
			addToast({ type: "error", message: "체크리스트를 불러올 수 없습니다" });
			setShowChecklist(false);
		}
	}, [facility.id, checklist, showChecklist, addToast]);

	const handleApplyClick = useCallback(async () => {
		setActionStatus("executing");
		setSheetOpen(true);
		setError(null);
		setIntentId(null);

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
		} catch (error) {
			setActionStatus("error");
			setError(
				getErrorMessage(
					error,
					"대기 신청 시작에 실패했어요. 잠시 후 다시 시도해주세요",
				),
			);
			setSheetOpen(false);
		}
	}, [facility.id, userChildren]);

	const handleConfirm = useCallback(async () => {
		if (!intentId) return;
		setActionStatus("executing");
		setError(null);

		try {
			const res = await apiFetch<{
				data: {
					success: boolean;
					data?: {
						waitlistId?: string;
						position?: number;
					};
					error?: string;
				};
			}>("/api/actions/execute", {
				method: "POST",
				body: JSON.stringify({ intentId }),
			});

			if (res.data.success) {
				const position = res.data.data?.position;
				const positionLabel =
					typeof position === "number"
						? `현재 대기 ${position}번째로 신청되었어요`
						: "현재 대기 현황에서 순번을 확인할 수 있어요";

				setActionStatus("success");
				addToast({
					type: "success",
					message: facility.status === "available"
						? "입소 신청이 완료되었어요"
						: `대기 신청이 완료되었어요. ${positionLabel}`,
					action: {
						label: "MY > 대기현황 보기",
						onClick: () => router.push("/my/waitlist"),
					},
					duration: 7000,
				});
				setSheetOpen(false);
			} else {
				setActionStatus("error");
				setError(
					getErrorMessage(
						res.data.error,
						"대기 신청 처리에 실패했어요. 다시 시도해주세요",
					),
				);
				setSheetOpen(false);
			}
		} catch (error) {
			setActionStatus("error");
			setError(getErrorMessage(error, "대기 신청 처리에 실패했어요. 다시 시도해주세요"));
			setSheetOpen(false);
		}
	}, [addToast, intentId]);

	const toggleLike = useCallback(async () => {
		if (isTogglingLike) return;

		setIsTogglingLike(true);
		const nextLiked = !liked;
		setLiked(nextLiked);

		try {
			await apiFetch("/api/users/me/interests", {
				method: nextLiked ? "POST" : "DELETE",
				body: JSON.stringify({ facilityId: facility.id }),
			});
			addToast({
				type: "success",
				message: nextLiked
					? "관심 목록에 추가했어요"
					: "관심 목록에서 삭제했어요",
			});
		} catch {
			setLiked(!nextLiked);
		} finally {
			setIsTogglingLike(false);
		}
	}, [addToast, facility.id, isTogglingLike, liked]);

	const resetActionStatus = useCallback(() => {
		setError(null);
		setActionStatus("idle");
		setIntentId(null);
	}, []);

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
			<div className="mx-5 mt-3 flex flex-wrap gap-1.5">
				<Badge color={getTypeBadgeColor(facility.type)}>{facility.type}</Badge>
				{isPremiumFacility ? (
					<Badge color="forest" className="inline-flex items-center gap-1.5">
						<ShieldCheckIcon className="h-4 w-4" />
						인증 파트너
					</Badge>
				) : null}
				<Badge color={getQualityColor(qualityScore)}>
					{qualityScore == null
						? "데이터 품질 미공개"
						: `데이터 품질 점수 ${qualityScore}점`}
				</Badge>
				{!isPremiumFacility ? (
					<span className="text-sm text-dotori-500">이 시설은 아직 파트너 미가입</span>
				) : null}
			</div>

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
				{keyStats.length > 0 ? (
					<section className="rounded-3xl bg-white p-5 shadow-sm">
						<h2 className="text-sm font-semibold text-dotori-900">주요 지표</h2>
						<div className="mt-3 grid grid-cols-2 gap-3">
							{keyStats.map((stat) => (
								<div
									key={stat.label}
									className="rounded-2xl border border-dotori-100 bg-dotori-50/60 px-3 py-3"
								>
									<p className="text-[12px] text-dotori-500">{stat.label}</p>
									<p className="mt-1 text-base font-semibold text-dotori-800">{stat.value}</p>
								</div>
							))}
						</div>
					</section>
				) : null}

				<section className="rounded-3xl bg-white p-5 shadow-sm">
					<h2 className="text-sm font-semibold text-dotori-900">특징</h2>
					{activeFeatures.length > 0 ? (
						<div className="mt-3 flex flex-wrap gap-2">
							{activeFeatures.map((feature: FeatureOption) => (
								<Badge
									key={feature.key}
									color={feature.color}
									className="text-[14px]"
								>
									{feature.label} ✓
								</Badge>
							))}
						</div>
					) : (
						<p className="mt-3 text-sm text-dotori-500">표시 가능한 특징이 없어요.</p>
					)}
				</section>

				{showPremiumSection ? (
					<section className="rounded-3xl bg-white p-5 shadow-sm">
						<div className="flex items-center justify-between gap-2">
							<h2 className="text-sm font-semibold text-dotori-900">인증 파트너</h2>
							{premiumVerifiedAt ? (
								<p className="text-sm font-medium text-forest-700">
									검증일: {premiumVerifiedAt}
								</p>
							) : null}
						</div>
						{premiumDirectorMessage ? (
							<div className="mt-3 rounded-2xl bg-dotori-50 p-4">
								<h3 className="mb-1 text-[13px] font-medium text-dotori-700">
									원장 한마디
								</h3>
								<p className="text-sm leading-6 text-dotori-800">
									{premiumDirectorMessage}
								</p>
							</div>
						) : null}

						{premiumPrograms && premiumPrograms.length > 0 ? (
							<div className="mt-3">
								<h3 className="mb-2 text-[13px] font-medium text-dotori-700">
									프로그램
								</h3>
								<div className="mt-2 flex flex-wrap gap-2">
									{premiumPrograms.map((program) => (
										<Badge key={program} color="forest">
											{program}
										</Badge>
									))}
								</div>
							</div>
						) : null}

						{premiumHighlights && premiumHighlights.length > 0 ? (
							<div className="mt-3">
								<h3 className="mb-2 text-[13px] font-medium text-dotori-700">
									하이라이트
								</h3>
								<ul className="space-y-1.5">
									{premiumHighlights.map((highlight) => (
										<li key={highlight} className="text-sm text-dotori-700">
											<span className="mr-2 inline-block text-forest-500">✓</span>
											{highlight}
										</li>
									))}
								</ul>
							</div>
						) : null}

						{premiumPhotos && premiumPhotos.length > 0 ? (
							<div className="mt-3">
								<h3 className="mb-2 text-[13px] font-medium text-dotori-700">
									추가 사진
								</h3>
								<div className="grid grid-cols-2 gap-2">
									{premiumPhotos.map((photo, index) => (
										<div
											key={`${photo}-${index}`}
											className="overflow-hidden rounded-xl"
										>
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img
												src={photo}
												alt={`${facility.name} 파트너 시설 사진 ${index + 1}`}
												loading="lazy"
												className="h-28 w-full rounded-xl object-cover"
											/>
										</div>
									))}
								</div>
							</div>
						) : null}
					</section>
				) : null}

				<section className="rounded-3xl bg-white p-5 shadow-sm">
					<h2 className="text-sm font-semibold text-dotori-900">연락처</h2>
					<div className="mt-3 space-y-2 text-[14px] text-dotori-700">
					{facility.phone ? (
						<a
							href={`tel:${facility.phone}`}
							className="flex items-center gap-2 rounded-xl border border-dotori-100 px-3 py-2 transition-colors hover:bg-dotori-50"
						>
							<PhoneIcon className="h-5 w-5 text-dotori-500" />
							<span>{facility.phone}</span>
						</a>
					) : (
						<div className="flex items-center gap-2 rounded-xl border border-dotori-100 px-3 py-2 text-dotori-500">
							<PhoneIcon className="h-5 w-5" />
							<span>전화번호 미제공</span>
						</div>
					)}
					<div className="flex flex-col gap-2 sm:flex-row">
						<a
							href={kakaoMapUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="min-h-12 flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-dotori-100 px-3 py-2 transition-colors hover:bg-dotori-50"
						>
							<MapPinIcon className="h-5 w-5 text-dotori-500" />
							<span className="line-clamp-2">{facility.address}</span>
						</a>
						<Button
							plain
							type="button"
							onClick={handleCopyAddress}
							disabled={!copyableAddress || copyingAddress}
							className="min-h-12 min-w-28 px-3"
						>
							<ClipboardDocumentIcon className="h-5 w-5" />
							주소 복사
						</Button>
					</div>
					{websiteUrl && (
						<a
							href={websiteUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center gap-2 rounded-xl border border-dotori-100 px-3 py-2 transition-colors hover:bg-dotori-50"
							>
								<GlobeAltIcon className="h-5 w-5 text-dotori-500" />
								<span>홈페이지 열기</span>
							</a>
						)}
					</div>
				</section>

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
			</div>

			<div className="fixed bottom-20 left-4 right-4 z-30 mx-auto max-w-md rounded-2xl border border-dotori-100 bg-white/95 px-5 py-3.5 shadow-[0_-2px_24px_rgba(200,149,106,0.10)] backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
				<div className="space-y-2">
					<div className="flex gap-3">
						<Button
							plain
							disabled={isTogglingLike}
							onClick={toggleLike}
							aria-label="관심 시설 추가/제거"
							className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-dotori-200 bg-white px-2 text-[15px] font-semibold text-dotori-700 transition-all active:scale-[0.97]"
						>
							{liked ? (
								<HeartSolid className="h-5 w-5 text-red-500" />
							) : (
								<HeartIcon className="h-5 w-5" />
							)}
							{liked ? "관심 시설 제거" : "관심 시설 추가"}
						</Button>
						<div className="flex-1">
							{actionStatus === "executing" ? (
								<div className="min-h-12 rounded-3xl border border-dotori-100 bg-dotori-50 px-4">
									<div className="flex h-full items-center justify-center gap-2">
										<ArrowPathIcon className="h-5 w-5 animate-spin text-dotori-700" />
										<span className="text-[14px] font-semibold text-dotori-700">
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
										plain
										onClick={resetActionStatus}
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
											plain
											onClick={resetActionStatus}
											className="min-h-10 flex-1 rounded-2xl"
										>
											닫기
										</Button>
										<Button
											color="dotori"
											onClick={handleApplyClick}
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
										onClick={handleApplyClick}
										className="min-h-12 w-full text-[15px] font-semibold"
									>
										대기 신청하기
									</Button>
									<p className="mt-1 text-[12px] text-dotori-500">{waitingHintText}</p>
								</>
							)}
						</div>
					</div>
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
							신청유형: facility.status === "available" ? "입소 신청" : "대기 신청",
						}
				}
				onConfirm={handleConfirm}
				status={actionStatus}
				{...(actionStatus === "error" && error ? { error } : {})}
			/>
		</div>
	);
}
