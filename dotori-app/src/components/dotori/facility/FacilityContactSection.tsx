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
import { fadeUp } from "@/lib/motion";
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
			className="mb-6 rounded-3xl border-b border-dotori-100 bg-white px-5 py-5 shadow-sm dark:border-dotori-800 dark:bg-dotori-950 dark:shadow-none"
		>
			<button
				type="button"
				onClick={() => setIsExpanded((prev) => !prev)}
				aria-expanded={isExpanded}
				aria-controls="facility-contact-details"
				className="flex w-full min-h-11 items-center justify-between gap-3 rounded-xl py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dotori-200"
			>
				<h2 className="text-body-sm font-semibold text-dotori-900 dark:text-dotori-50">연락처</h2>
				<ChevronDownIcon
					className={`h-5 w-5 flex-shrink-0 text-dotori-500 transition-transform duration-200 ${
						isExpanded ? "rotate-180" : ""
					}`}
				/>
			</button>
			{isExpanded ? (
				<div
					id="facility-contact-details"
					className="mt-3 space-y-2 text-body-sm text-dotori-700 dark:text-dotori-200"
				>
					{phone ? (
						<div className="flex flex-col gap-2 sm:flex-row">
							<a
								href={`tel:${phone}`}
								className="flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-xl border border-dotori-100 px-3 py-2 transition-all active:scale-[0.97] hover:bg-dotori-50 dark:border-dotori-800 dark:hover:bg-dotori-900"
							>
								<PhoneIcon className="h-5 w-5 text-dotori-500" />
								<span>{phone}</span>
							</a>
							<Button
								plain={true}
								type="button"
								onClick={onCopyPhone}
								disabled={!copyablePhone || copyingPhone}
								className="min-h-11 min-w-28 px-3 active:scale-[0.97]"
							>
								<ClipboardDocumentIcon className="h-5 w-5" />
								전화 복사
							</Button>
						</div>
					) : (
						<div className="flex items-center gap-2 rounded-xl border border-dotori-100 px-3 py-2 text-dotori-500 dark:border-dotori-800 dark:text-dotori-300">
							<PhoneIcon className="h-5 w-5" />
							<span>전화번호 미제공</span>
						</div>
					)}
					<div className="flex flex-col gap-2 sm:flex-row">
						<a
							href={kakaoMapUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-xl border border-dotori-100 px-3 py-2 transition-all active:scale-[0.97] hover:bg-dotori-50 dark:border-dotori-800 dark:hover:bg-dotori-900"
						>
							<MapPinIcon className="h-5 w-5 text-dotori-500" />
							<span className="line-clamp-2">{address}</span>
						</a>
						<Button
							plain={true}
							type="button"
							onClick={onCopyAddress}
							disabled={!copyableAddress || copyingAddress}
							className="min-h-11 min-w-28 px-3 active:scale-[0.97]"
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
							className="flex min-h-12 items-center gap-2 rounded-xl border border-dotori-100 px-3 py-2 transition-all active:scale-[0.97] hover:bg-dotori-50 dark:border-dotori-800 dark:hover:bg-dotori-900"
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
			className="mb-6 rounded-3xl border-b border-dotori-100 bg-white p-5 pb-6 shadow-sm dark:border-dotori-800 dark:bg-dotori-950 dark:shadow-none"
		>
			<h2 className="text-body-sm font-semibold text-dotori-900 dark:text-dotori-50">지도</h2>
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
				className="mt-3 inline-flex min-h-11 items-center gap-1 rounded-xl px-3 py-2.5 text-body-sm font-semibold text-dotori-700 transition-all active:scale-[0.97] hover:bg-dotori-50 hover:text-dotori-900 dark:text-dotori-200 dark:hover:bg-dotori-900 dark:hover:text-dotori-50"
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
		<div className="sticky bottom-0 left-0 right-0 z-30 border-t border-dotori-100 bg-white/80 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur dark:border-dotori-800 dark:bg-dotori-950/90">
			<div className="mx-auto max-w-md space-y-2">
				<div className="flex gap-3">
					<Button
						plain={true}
						disabled={isTogglingLike}
						onClick={onToggleLike}
						aria-label="관심 시설 추가/제거"
						className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-dotori-200 bg-white px-3 text-base font-semibold text-dotori-700 transition-all active:scale-[0.97] dark:border-dotori-700 dark:bg-dotori-950 dark:text-dotori-100"
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
							<div className="min-h-12 rounded-2xl border border-dotori-100 bg-dotori-50 px-4 py-2.5 dark:border-dotori-800 dark:bg-dotori-900">
								<div className="flex h-full items-center justify-center gap-2">
									<ArrowPathIcon className="h-5 w-5 animate-spin text-dotori-700 dark:text-dotori-100" />
									<span className="text-body-sm font-semibold text-dotori-700 dark:text-dotori-100">
										신청 처리 중...
									</span>
								</div>
							</div>
						) : actionStatus === "success" ? (
							<div className="rounded-2xl border border-forest-200 bg-forest-50 px-4 py-2.5 text-center dark:border-forest-800 dark:bg-forest-950/30">
								<CheckCircleIcon className="mx-auto h-6 w-6 animate-in zoom-in text-forest-600 duration-300 dark:text-forest-200" />
								<p className="mt-2 text-body-sm font-semibold text-dotori-900 dark:text-dotori-50">
									대기 신청 완료!
								</p>
								<Link
									href="/my/waitlist"
									className="mt-1 inline-flex text-body-sm font-semibold text-dotori-700 underline underline-offset-4 transition-colors hover:text-dotori-900 dark:text-dotori-200 dark:hover:text-dotori-50"
								>
									MY &gt; 대기 현황에서 확인하세요
								</Link>
								<Button
									plain={true}
									onClick={onResetActionStatus}
									className="mt-2 min-h-11 w-full rounded-2xl"
								>
									확인
								</Button>
							</div>
						) : actionStatus === "error" ? (
							<div className="rounded-2xl border border-danger/30 bg-danger/5 px-4 py-2.5 text-left dark:bg-danger/10">
								<p className="text-body-sm font-semibold text-danger">
									{error ?? "대기 신청 중 오류가 발생했어요."}
								</p>
								<div className="mt-2 flex gap-2">
									<Button
										plain={true}
										onClick={onResetActionStatus}
										className="min-h-11 flex-1 rounded-2xl"
									>
										닫기
									</Button>
									<Button
										color="dotori"
										onClick={onApplyClick}
										className="min-h-11 flex-1 rounded-2xl"
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
									className="min-h-12 w-full rounded-2xl py-3 text-base font-semibold shadow-sm shadow-dotori-900/5 active:scale-[0.97]"
								>
									{applyActionLabel}
								</Button>
								<p className="mt-1 text-caption text-dotori-500 dark:text-dotori-300">
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
