import {
	ArrowPathIcon,
	CheckCircleIcon,
	ClipboardDocumentIcon,
	GlobeAltIcon,
	HeartIcon,
	MapPinIcon,
	PhoneIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import Link from "next/link";

import { Button } from "@/components/catalyst/button";
import { MapEmbed } from "@/components/dotori/MapEmbed";
import type { ActionStatus, Facility } from "@/types/dotori";

type FacilityContactSectionProps = {
	phone?: string;
	address: string;
	kakaoMapUrl: string;
	websiteUrl: string | null;
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
	copyableAddress,
	copyingAddress,
	onCopyAddress,
}: FacilityContactSectionProps) {
	return (
		<section className="rounded-3xl bg-white p-5 shadow-sm">
			<h2 className="text-sm font-semibold text-dotori-900">연락처</h2>
			<div className="mt-3 space-y-2 text-sm text-dotori-700">
				{phone ? (
					<a
						href={`tel:${phone}`}
						className="flex items-center gap-2 rounded-xl border border-dotori-100 px-3 py-2 transition-colors hover:bg-dotori-50"
					>
						<PhoneIcon className="h-5 w-5 text-dotori-500" />
						<span>{phone}</span>
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
						<span className="line-clamp-2">{address}</span>
					</a>
					<Button
						plain={true}
						type="button"
						onClick={onCopyAddress}
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
		<section className="rounded-3xl bg-white p-5 shadow-sm">
			<h2 className="text-sm font-semibold text-dotori-900">지도</h2>
			<div className="mt-3 overflow-hidden rounded-2xl border border-dotori-100">
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
				className="mt-3 inline-flex items-center gap-1 text-sm text-dotori-600 transition-colors hover:text-dotori-700"
			>
				카카오맵에서 자세히 보기
			</a>
		</section>
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
		<div className="fixed bottom-20 left-4 right-4 z-30 mx-auto max-w-md rounded-2xl border border-dotori-100 bg-white/95 px-5 py-3.5 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_24px_rgba(200,149,106,0.10)] backdrop-blur-xl">
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

export function FacilityContactMapSections({
	phone,
	address,
	kakaoMapUrl,
	websiteUrl,
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
