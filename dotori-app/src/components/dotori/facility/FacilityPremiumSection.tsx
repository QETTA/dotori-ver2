import { motion } from "motion/react";

import { Badge } from "@/components/catalyst/badge";
import { BRAND } from "@/lib/brand-assets";
import { fadeUp } from "@/lib/motion";
import { sanitizeImageUrls } from "@/lib/safe-image";
import {
	VERIFIED_FACILITY_DATE_LABEL,
	VERIFIED_FACILITY_INFO_LABEL,
	VERIFIED_FACILITY_LABEL,
} from "./facility-detail-helpers";

interface FacilityPremiumSectionProps {
	showPremiumSection: boolean;
	premiumVerifiedAt: string | null;
	premiumDirectorMessage?: string;
	premiumPrograms?: string[];
	premiumHighlights?: string[];
	premiumPhotos?: string[];
	facilityName: string;
}

export function FacilityPremiumSection({
	showPremiumSection,
	premiumVerifiedAt,
	premiumDirectorMessage,
	premiumPrograms,
	premiumHighlights,
	premiumPhotos,
	facilityName,
}: FacilityPremiumSectionProps) {
	if (!showPremiumSection) return null;
	const safePremiumPhotos = sanitizeImageUrls(premiumPhotos);

	return (
		<motion.section
			{...fadeUp}
			className={'glass-card rounded-2xl p-5 shadow-sm dark:bg-dotori-950 dark:shadow-none'}
		>
			<div className={'flex items-center justify-between gap-2'}>
				<h2 className={'text-body font-semibold text-dotori-900 dark:text-dotori-50'}>
					{VERIFIED_FACILITY_INFO_LABEL}
				</h2>
				{premiumVerifiedAt ? (
					<p className={'text-body font-medium text-forest-700 dark:text-forest-200'}>
						{VERIFIED_FACILITY_DATE_LABEL}: {premiumVerifiedAt}
					</p>
				) : null}
			</div>
			{premiumDirectorMessage ? (
				<div className={'mt-3 rounded-2xl bg-dotori-50 p-4 dark:bg-dotori-900'}>
					<h3 className={'mb-1 text-body font-medium text-dotori-700 dark:text-dotori-200'}>
						원장 한마디
					</h3>
					<p className={'text-body leading-6 text-dotori-800 dark:text-dotori-100'}>
						{premiumDirectorMessage}
					</p>
				</div>
			) : null}

			{premiumPrograms && premiumPrograms.length > 0 ? (
				<div className={'mt-3'}>
					<h3 className={'mb-2 text-body font-medium text-dotori-700 dark:text-dotori-200'}>
						프로그램
					</h3>
					<div className={'mt-2 flex flex-wrap gap-2'}>
						{premiumPrograms.map((program) => (
							<Badge key={program} color="forest">
								{program}
							</Badge>
						))}
					</div>
				</div>
			) : null}

			{premiumHighlights && premiumHighlights.length > 0 ? (
				<div className={'mt-3'}>
					<h3 className={'mb-2 text-body font-medium text-dotori-700 dark:text-dotori-200'}>
						하이라이트
					</h3>
					<ul className={'space-y-1.5'}>
						{premiumHighlights.map((highlight) => (
							<li
								key={highlight}
								className={'text-body text-dotori-700 dark:text-dotori-200'}
							>
								<span className={'mr-2 inline-block text-forest-500'}>✓</span>
								{highlight}
							</li>
						))}
					</ul>
				</div>
			) : null}

			{safePremiumPhotos.length > 0 ? (
				<div className={'mt-3'}>
					<h3 className={'mb-2 text-body font-medium text-dotori-700 dark:text-dotori-200'}>
						추가 사진
					</h3>
					<div className={'grid grid-cols-2 gap-2'}>
						{safePremiumPhotos.map((photo, index) => (
							<div key={`${photo}-${index}`} className={'overflow-hidden rounded-xl'}>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={photo}
									alt={`${facilityName} ${VERIFIED_FACILITY_LABEL} 사진 ${index + 1}`}
									loading="lazy"
									className={'h-28 w-full rounded-xl object-cover'}
									onError={(event) => {
										const target = event.currentTarget;
										target.onerror = null;
										target.src = BRAND.emptyState;
										target.alt = `${facilityName} 사진 준비 중`;
										target.className = 'h-28 w-full rounded-xl bg-dotori-50 p-3 object-contain dark:bg-dotori-900';
									}}
								/>
							</div>
						))}
					</div>
				</div>
			) : null}
		</motion.section>
	);
}
