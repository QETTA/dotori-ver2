import {
	ArrowPathIcon,
	CheckCircleIcon,
	ClipboardDocumentIcon,
	ChevronDownIcon,
	GlobeAltIcon,
	HeartIcon,
	MapPinIcon,
	PhoneIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";

import { Button } from "@/components/catalyst/button";
import { MapEmbed } from "@/components/dotori/MapEmbed";
import { BRAND } from "@/lib/brand-assets";
import { DS_GLASS, DS_TYPOGRAPHY } from "@/lib/design-system/tokens";
import { fadeUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { ActionStatus, Facility } from "@/types/dotori";

type FacilityContactSectionProps = {
	phone?: string;
	address: string;
	kakaoMapUrl: string;
	websiteUrl: string | null;
	copyablePhone?: string;
	copyingPhone: boolean;
	onCopyPhone: () => void;
	copyableAddress?: string;
	copyingAddress: boolean;
	onCopyAddress: () => void;
};

type FacilityLocationMapSectionProps = {
	hasMapLocation: boolean;
	facilityId: string;
	facilityName: string;
	lat: number | null | undefined;
	lng: number | null | undefined;
	status: Facility["status"];
	kakaoMapUrl: string;
};

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

type FacilityContactMapSectionsProps = FacilityContactSectionProps &
	FacilityLocationMapSectionProps;

export function FacilityContactSection({
	phone,
	address,
	kakaoMapUrl,
	websiteUrl,
	copyablePhone,
	copyingPhone,
	onCopyPhone,
	copyableAddress,
	copyingAddress,
	onCopyAddress,
}: FacilityContactSectionProps) {
	const [isExpanded, setIsExpanded] = useState(true);

	return (
		<motion.section
			{...fadeUp}
			className={cn(
				DS_GLASS.CARD,
				"relative mb-5 overflow-hidden rounded-2xl border-b border-dotori-100 bg-white px-4 py-4 shadow-sm dark:border-dotori-800 dark:bg-dotori-950 dark:shadow-none",
			)}
		>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={BRAND.watermark}
				alt=""
				aria-hidden="true"
				className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 opacity-[0.07]"
			/>
			<button
				type="button"
				onClick={() => setIsExpanded((prev) => !prev)}
				aria-expanded={isExpanded}
				aria-controls="facility-contact-details"
				className="flex w-full min-h-10 items-center justify-between gap-3 rounded-xl py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dotori-200"
			>
				<h2 className={cn(DS_TYPOGRAPHY.bodySm, "font-semibold text-dotori-900 dark:text-dotori-50")}>
					연락처
				</h2>
				<ChevronDownIcon
					className={`h-5 w-5 flex-shrink-0 text-dotori-500 transition-transform duration-200 ${
						isExpanded ? "rotate-180" : ""
					}`}
				/>
			</button>
			{isExpanded ? (
				<div
					id="facility-contact-details"
					className={cn(DS_TYPOGRAPHY.bodySm, "mt-3 space-y-2 text-dotori-700 dark:text-dotori-200")}
				>
					{phone ? (
						<div className="flex flex-col gap-2 sm:flex-row">
							<a
								href={`tel:${phone}`}
								className={cn(
									DS_GLASS.CARD,
									"flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-dotori-100 px-3 py-2 transition-all active:scale-[0.97] hover:bg-dotori-50 dark:border-dotori-800 dark:hover:bg-dotori-900",
								)}
							>
								<PhoneIcon className="h-5 w-5 text-dotori-500" />
								<span>{phone}</span>
							</a>
							<Button
								plain={true}
								type="button"
								onClick={onCopyPhone}
								disabled={!copyablePhone || copyingPhone}
								className={cn(DS_TYPOGRAPHY.bodySm, "min-h-10 min-w-28 px-3 active:scale-[0.97]")}
							>
								<ClipboardDocumentIcon className="h-5 w-5" />
								전화 복사
							</Button>
						</div>
					) : (
						<div className={cn(DS_TYPOGRAPHY.bodySm, "flex items-center gap-2 rounded-xl border border-dotori-100 px-3 py-2 text-dotori-500 dark:border-dotori-800 dark:text-dotori-300")}>
							<PhoneIcon className="h-5 w-5" />
							<span>전화번호 미제공</span>
						</div>
					)}
					<div className="flex flex-col gap-2 sm:flex-row">
						<a
							href={kakaoMapUrl}
							target="_blank"
							rel="noopener noreferrer"
							className={cn(
								DS_GLASS.CARD,
								"flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-dotori-100 px-3 py-2 transition-all active:scale-[0.97] hover:bg-dotori-50 dark:border-dotori-800 dark:hover:bg-dotori-900",
							)}
						>
							<MapPinIcon className="h-5 w-5 text-dotori-500" />
							<span className="line-clamp-2">{address}</span>
						</a>
						<Button
							plain={true}
							type="button"
							onClick={onCopyAddress}
							disabled={!copyableAddress || copyingAddress}
							className={cn(DS_TYPOGRAPHY.bodySm, "min-h-10 min-w-28 px-3 active:scale-[0.97]")}
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
							className={cn(
								DS_GLASS.CARD,
								"flex min-h-10 items-center gap-2 rounded-xl border border-dotori-100 px-3 py-2 transition-all active:scale-[0.97] hover:bg-dotori-50 dark:border-dotori-800 dark:hover:bg-dotori-900",
							)}
						>
							<GlobeAltIcon className="h-5 w-5 text-dotori-500" />
							<span>홈페이지 열기</span>
						</a>
					)}
				</div>
			) : null}
		</motion.section>
	);
}

export function FacilityLocationMapSection({
	hasMapLocation,
	facilityId,
	facilityName,
	lat,
	lng,
	status,
	kakaoMapUrl,
}: FacilityLocationMapSectionProps) {
	if (!hasMapLocation) {
		return null;
	}
	const safeLat = Number(lat);
	const safeLng = Number(lng);

	return (
		<motion.section
			{...fadeUp}
			className={cn(
				DS_GLASS.CARD,
				"relative mb-5 overflow-hidden rounded-2xl border-b border-dotori-100 bg-white p-4 pb-5 shadow-sm dark:border-dotori-800 dark:bg-dotori-950 dark:shadow-none",
			)}
		>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={BRAND.socialCream}
				alt=""
				aria-hidden="true"
				className="pointer-events-none absolute right-2 top-2 h-10 w-10 opacity-[0.16]"
			/>
			<h2 className={cn(DS_TYPOGRAPHY.bodySm, "font-semibold text-dotori-900 dark:text-dotori-50")}>지도</h2>
			<div className="mt-3 overflow-hidden rounded-2xl border border-dotori-100 dark:border-dotori-800">
				<MapEmbed
					facilities={[
						{
							id: facilityId,
							name: facilityName,
							lat: safeLat,
							lng: safeLng,
							status,
						},
					]}
					center={{ lat: safeLat, lng: safeLng }}
					height="h-56"
				/>
			</div>
			<a
				href={kakaoMapUrl}
				target="_blank"
				rel="noopener noreferrer"
				className={cn(
					DS_TYPOGRAPHY.bodySm,
					"mt-3 inline-flex min-h-10 items-center gap-1 rounded-xl px-3 py-2.5 font-semibold text-dotori-700 transition-all active:scale-[0.97] hover:bg-dotori-50 hover:text-dotori-900 dark:text-dotori-200 dark:hover:bg-dotori-900 dark:hover:text-dotori-50",
				)}
			>
				카카오맵에서 자세히 보기
			</a>
		</motion.section>
	);
}

export function FacilityActionBar({
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
		<div className={cn(DS_GLASS.FLOAT, "sticky bottom-0 left-0 right-0 z-30 border-t border-dotori-100 bg-white/80 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur dark:border-dotori-800 dark:bg-dotori-950/90")}>
			<div className="mx-auto max-w-md space-y-2">
				<div className="flex gap-3">
					<Button
						plain={true}
						disabled={isTogglingLike}
						onClick={onToggleLike}
						aria-label="관심 시설 추가/제거"
						className={cn(
							DS_TYPOGRAPHY.bodySm,
							"flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-dotori-200 bg-white px-3 font-semibold text-dotori-700 transition-all active:scale-[0.97] dark:border-dotori-700 dark:bg-dotori-950 dark:text-dotori-100",
						)}
					>
						{liked ? (
							<HeartSolid className="h-5 w-5 text-dotori-500" />
						) : (
							<HeartIcon className="h-5 w-5" />
						)}
						{liked ? "관심 추가됨" : "관심 추가"}
					</Button>
					<div className="flex-1">
						{actionStatus === "executing" ? (
							<div className="min-h-10 rounded-xl border border-dotori-100 bg-dotori-50 px-4 py-2.5 dark:border-dotori-800 dark:bg-dotori-900">
								<div className="flex h-full items-center justify-center gap-2">
									<ArrowPathIcon className="h-5 w-5 animate-spin text-dotori-700 dark:text-dotori-100" />
									<span className={cn(DS_TYPOGRAPHY.bodySm, "font-semibold text-dotori-700 dark:text-dotori-100")}>
										신청 처리 중...
									</span>
								</div>
							</div>
						) : actionStatus === "success" ? (
							<div className="rounded-xl border border-forest-200 bg-forest-50 px-4 py-2.5 text-center dark:border-forest-800 dark:bg-forest-950/30">
								<CheckCircleIcon className="mx-auto h-6 w-6 animate-in zoom-in text-forest-600 duration-300 dark:text-forest-200" />
								<p className={cn(DS_TYPOGRAPHY.bodySm, "mt-2 font-semibold text-dotori-900 dark:text-dotori-50")}>
									대기 신청 완료!
								</p>
								<Link
									href="/my/waitlist"
									className={cn(DS_TYPOGRAPHY.bodySm, "mt-1 inline-flex font-semibold text-dotori-700 underline underline-offset-4 transition-colors hover:text-dotori-900 dark:text-dotori-200 dark:hover:text-dotori-50")}
								>
									MY &gt; 대기 현황에서 확인하세요
								</Link>
								<Button
									plain={true}
									onClick={onResetActionStatus}
									className={cn(DS_TYPOGRAPHY.bodySm, "mt-2 min-h-10 w-full rounded-xl")}
								>
									확인
								</Button>
							</div>
						) : actionStatus === "error" ? (
							<div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-2.5 text-left dark:bg-danger/10">
								<p className={cn(DS_TYPOGRAPHY.bodySm, "font-semibold text-danger")}>
									{error ?? "대기 신청 중 오류가 발생했어요."}
								</p>
								<div className="mt-2 flex gap-2">
									<Button
										plain={true}
										onClick={onResetActionStatus}
										className={cn(DS_TYPOGRAPHY.bodySm, "min-h-10 flex-1 rounded-xl")}
									>
										닫기
									</Button>
									<Button
										color="dotori"
										onClick={onApplyClick}
										className={cn(DS_TYPOGRAPHY.bodySm, "min-h-10 flex-1 rounded-xl")}
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
									className={cn(DS_TYPOGRAPHY.bodySm, "min-h-10 w-full rounded-xl py-2.5 font-semibold shadow-sm shadow-dotori-900/5 active:scale-[0.97]")}
								>
									{applyActionLabel}
								</Button>
								<p className={cn(DS_TYPOGRAPHY.caption, "mt-1 text-dotori-500 dark:text-dotori-300")}>
									{waitingHintText}
								</p>
							</>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export function FacilityContactMapSections({
	phone,
	address,
	kakaoMapUrl,
	websiteUrl,
	copyablePhone,
	copyingPhone,
	onCopyPhone,
	copyableAddress,
	copyingAddress,
	onCopyAddress,
	hasMapLocation,
	facilityId,
	facilityName,
	lat,
	lng,
	status,
}: FacilityContactMapSectionsProps) {
	return (
		<>
			<FacilityContactSection
				phone={phone}
				address={address}
				kakaoMapUrl={kakaoMapUrl}
				websiteUrl={websiteUrl}
				copyablePhone={copyablePhone}
				copyingPhone={copyingPhone}
				onCopyPhone={onCopyPhone}
				copyableAddress={copyableAddress}
				copyingAddress={copyingAddress}
				onCopyAddress={onCopyAddress}
			/>
			<FacilityLocationMapSection
				hasMapLocation={hasMapLocation}
				facilityId={facilityId}
				facilityName={facilityName}
				lat={lat}
				lng={lng}
				status={status}
				kakaoMapUrl={kakaoMapUrl}
			/>
		</>
	);
}
