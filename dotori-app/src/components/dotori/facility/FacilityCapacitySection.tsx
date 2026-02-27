import { ArrowTopRightOnSquareIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { motion } from "motion/react";
import { useState } from "react";

import { Badge } from "@/components/catalyst/badge";
import { BRAND } from "@/lib/brand-assets";
import { DsProgressBar } from "@/components/ds/DsProgressBar";
import { DS_STATUS, DS_TYPOGRAPHY, DS_GLASS, DS_TEXT, DS_SHADOW } from '@/lib/design-system/tokens'
import { spring, tap } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Facility } from "@/types/dotori";

const FEATURE_OPTIONS = [
	{ key: "CCTV", label: "CCTV", color: "forest" },
	{ key: "소규모", label: "소규모", color: "forest" },
	{ key: "통학버스", label: "통학버스", color: "forest" },
	{ key: "놀이터", label: "놀이터", color: "forest" },
	{ key: "대규모", label: "대규모", color: "forest" },
] as const;

const capacityReveal = {
	hidden: { opacity: 0, y: 10 },
	show: {
		opacity: 1,
		y: 0,
		transition: { ...spring.card, staggerChildren: 0.05 },
	},
} as const;

const capacityRevealItem = {
	hidden: { opacity: 0, y: 6 },
	show: { opacity: 1, y: 0, transition: spring.card },
} as const;

const getCapacityTone = (
	occupancyRate: number,
	waitingCapacity: number,
): keyof typeof DS_STATUS => {
	if (occupancyRate >= 100) return "full";
	if (waitingCapacity > 0) return "waiting";
	return "available";
};

const getMetricValueClass = (tone: keyof typeof DS_STATUS) =>
	tone === "full"
		? 'text-danger'
		: tone === "waiting"
			? 'text-warning'
			: 'text-dotori-900 dark:text-dotori-50';

const getRateValueToneClass = (occupancyTone: keyof typeof DS_STATUS) =>
	occupancyTone === "available"
		? 'text-forest-700'
		: 'font-bold leading-none text-dotori-700 dark:text-dotori-200';

const CLS = {
	sectionInsight: cn(
		'relative mb-4 overflow-hidden rounded-2xl border-b border-dotori-100 p-3 ring-1 ring-dotori-100/70',
		DS_GLASS.card, DS_GLASS.dark.card, DS_SHADOW.sm, DS_SHADOW.dark.sm,
		'dark:border-dotori-800 dark:ring-dotori-800/70',
	),
	section: cn(
		'mb-4 rounded-2xl border-b border-dotori-100 px-3 py-3 ring-1 ring-dotori-100/70',
		DS_GLASS.card, DS_GLASS.dark.card, DS_SHADOW.sm, DS_SHADOW.dark.sm,
		'dark:border-dotori-800 dark:ring-dotori-800/70',
	),
	sectionLg: cn(
		'mb-5 rounded-2xl border-b border-dotori-100 p-4 pb-5 ring-1 ring-dotori-100/70',
		DS_GLASS.card, DS_GLASS.dark.card, DS_SHADOW.sm, DS_SHADOW.dark.sm,
		'dark:border-dotori-800 dark:ring-dotori-800/70',
	),
	metricCell: 'rounded-xl border border-dotori-100 bg-white/80 px-2 py-2 text-center dark:border-dotori-800 dark:bg-dotori-950',
	sectionTitle: cn(DS_TYPOGRAPHY.bodySm, 'font-semibold', DS_TEXT.primary),
} as const;

export type FacilityKeyStat = {
	label: string;
	value: string;
};

type FacilityCapacitySectionProps = {
	occupancyRate: number;
	currentCapacity: number;
	totalCapacity: number;
	waitingCapacity: number;
	occupancyProgressColor: string;
	keyStats: FacilityKeyStat[];
};

type FacilityInsightSectionProps = {
	status: Facility["status"];
	qualityScore?: number;
	aiInsightSummary: string;
	occupancyRate: number;
	totalCapacity: number;
	currentCapacity: number;
	waitingCapacity: number;
};

type FacilityFeatureSectionProps = {
	features: string[];
};

type FacilityCoreInfoSectionsProps = {
	status: Facility["status"];
	qualityScore?: number;
	aiInsightSummary: string;
	occupancyRate: number;
	currentCapacity: number;
	totalCapacity: number;
	waitingCapacity: number;
	occupancyProgressColor: string;
	keyStats: FacilityKeyStat[];
	features: string[];
};

export function FacilityInsightSection({
	status,
	qualityScore,
	aiInsightSummary,
	occupancyRate,
	totalCapacity,
	currentCapacity,
	waitingCapacity,
}: FacilityInsightSectionProps) {
	const statusMeta = DS_STATUS[status];
	const occupancyTone = getCapacityTone(occupancyRate, waitingCapacity);
	const occupancyMeta = DS_STATUS[occupancyTone];

	const summaryMetrics: Array<{
		label: string;
		value: number;
		tone: keyof typeof DS_STATUS;
	}> = [
		{ label: "정원", value: totalCapacity, tone: "available" as const },
		{
			label: "현원",
			value: currentCapacity,
			tone: occupancyRate >= 100 ? "full" : "available",
		},
		{ label: "대기", value: waitingCapacity, tone: waitingCapacity > 0 ? "waiting" : "available" },
	];

	return (
			<motion.section
				variants={capacityReveal}
				initial="hidden"
				animate="show"
				className={CLS.sectionInsight}
			>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={BRAND.watermark}
					alt=""
					aria-hidden="true"
					className={'pointer-events-none absolute -right-8 -top-8 h-24 w-24 opacity-[0.07]'}
				/>
				<div className={'flex items-center justify-between gap-2'}>
					<div className={'flex min-w-0 items-center gap-2'}>
						<Badge
							color={status === "available" ? "forest" : "dotori"}
							className={'text-label font-semibold'}
						>
						AI 이동 인사이트
						</Badge>
						<span
							className={cn(
								'inline-flex min-h-6 items-center rounded-full px-2.5 py-1 text-label font-semibold',
								statusMeta.pill,
							)}
						>
							{statusMeta.label}
						</span>
					</div>
					<span className={'text-label font-semibold text-dotori-500'}>
						데이터 품질 {qualityScore ?? "-"}점
					</span>
				</div>
				<p className={'mt-2.5 text-body-sm leading-relaxed text-dotori-700 dark:text-dotori-200'}>
					{aiInsightSummary}
				</p>
				<div className={'mt-3 rounded-xl border border-dotori-100/80 bg-white/80 p-2'}>
					<div className={'flex items-center justify-between rounded-lg bg-dotori-50/70 px-2.5 py-2 dark:bg-dotori-900/60'}>
						<p
							className={cn(DS_TYPOGRAPHY.label, 'text-dotori-600 dark:text-dotori-300')}
						>
							정원 현황
						</p>
						<p className={cn(DS_TYPOGRAPHY.bodySm, 'text-dotori-700 dark:text-dotori-200')}>
							점유 {occupancyRate}% · {occupancyMeta.label}
						</p>
					</div>
					<motion.div
						variants={capacityReveal}
						initial="hidden"
						animate="show"
						className={'mt-1.5 grid grid-cols-3 gap-1.5'}
					>
						{summaryMetrics.map((metric) => (
							<motion.div
								key={metric.label}
								variants={capacityRevealItem}
								className={'rounded-xl border border-dotori-100/80 bg-white px-2 py-2 text-center dark:border-dotori-800 dark:bg-dotori-950'}
							>
								<p className={cn(DS_TYPOGRAPHY.caption, 'font-medium text-dotori-500')}>
									{metric.label}
								</p>
								<p className={cn('mt-0.5 leading-none', DS_TYPOGRAPHY.h3, getMetricValueClass(metric.tone))}>
									{metric.value}
									<span className={cn(DS_TYPOGRAPHY.caption, 'ml-0.5 font-medium text-dotori-500')}>명</span>
								</p>
							</motion.div>
						))}
					</motion.div>
				</div>
		</motion.section>
	);
}

export function FacilityCapacitySection({
	occupancyRate,
	currentCapacity,
	totalCapacity,
	waitingCapacity,
	occupancyProgressColor,
	keyStats,
}: FacilityCapacitySectionProps) {
	const [isExpanded, setIsExpanded] = useState(true);
	const occupancyTone = getCapacityTone(occupancyRate, waitingCapacity);
	const occupancyMeta = DS_STATUS[occupancyTone];
	const currentRateTone = getMetricValueClass(occupancyTone);
	const waitingTone = getMetricValueClass(waitingCapacity > 0 ? "waiting" : "available");
	const availableTone = getMetricValueClass(
		occupancyRate >= 100 || currentCapacity >= totalCapacity ? "full" : "available",
	);
	const occupancyToneLabel = occupancyMeta.label;

	return (
		<>
				<motion.section
					variants={capacityReveal}
					initial="hidden"
					animate="show"
					className={CLS.section}
			>
						<motion.button
							type="button"
							onClick={() => setIsExpanded((prev) => !prev)}
						aria-expanded={isExpanded}
							aria-controls="facility-capacity-details"
							whileTap={tap.button.whileTap}
							transition={tap.button.transition}
						className={'flex w-full min-h-10 items-center justify-between gap-2 rounded-xl px-1 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dotori-200'}
					>
						<div className={'flex min-w-0 items-baseline gap-2'}>
							<h2
								className={CLS.sectionTitle}
							>
								정원 현황
							</h2>
							<span
								className={cn(
									DS_TYPOGRAPHY.h2,
									getRateValueToneClass(occupancyTone),
									'font-bold leading-none text-dotori-700 dark:text-dotori-200',
								)}
							>
								{occupancyRate}%
							</span>
						</div>
							<ChevronDownIcon
								className={cn(
									'h-5 w-5 flex-shrink-0 text-dotori-500 transition-transform duration-200',
									isExpanded
										? 'rotate-180'
										: undefined,
								)}
							/>
						<span
							className={cn(
								'text-caption min-h-6 items-center rounded-full px-2.5 py-1',
								occupancyMeta.pill,
							)}
						>
							{occupancyToneLabel}
						</span>
					</motion.button>
					{isExpanded ? (
						<motion.div
							id="facility-capacity-details"
							className={'mt-3'}
							variants={capacityRevealItem}
						>
							<p className={cn(DS_TYPOGRAPHY.bodySm, 'text-dotori-700 dark:text-dotori-200')}>
								현원 {currentCapacity}명 · 정원 {totalCapacity}명 · 대기 {waitingCapacity}명
							</p>
							<DsProgressBar
								trackClassName={'mt-2.5 h-2 w-full overflow-hidden rounded-full bg-dotori-100 dark:bg-dotori-800'}
								fillClassName={cn('h-full rounded-full', occupancyProgressColor)}
								value={occupancyRate}
								animated
							/>
							<div className={'mt-3 grid grid-cols-3 gap-2'}>
								<div className={CLS.metricCell}>
									<p className={cn(DS_TYPOGRAPHY.caption, 'text-caption font-medium text-dotori-500')}>정원</p>
									<p
										className={cn(
											'font-semibold text-dotori-900 dark:text-dotori-50',
											availableTone,
										)}
									>
										{totalCapacity}
									</p>
								</div>
								<div className={CLS.metricCell}>
									<p className={cn(DS_TYPOGRAPHY.caption, 'text-caption font-medium text-dotori-500')}>현원</p>
									<p
										className={cn(
											'font-semibold text-dotori-900 dark:text-dotori-50',
											currentRateTone,
										)}
									>
										{currentCapacity}
									</p>
								</div>
								<div className={CLS.metricCell}>
									<p className={cn(DS_TYPOGRAPHY.caption, 'text-caption font-medium text-dotori-500')}>대기</p>
									<p
										className={cn(
											'font-semibold text-dotori-900 dark:text-dotori-50',
											waitingTone,
										)}
									>
										{waitingCapacity}
									</p>
								</div>
							</div>
						</motion.div>
					) : null}
				</motion.section>

			{isExpanded && keyStats.length > 0 ? (
				<motion.section
						variants={capacityReveal}
						initial="hidden"
						animate="show"
						className={CLS.section}
					>
						<h2 className={CLS.sectionTitle}>
							주요 지표
						</h2>
						<motion.div
							variants={capacityReveal}
							initial="hidden"
							animate="show"
							className={'mt-3 grid grid-cols-2 gap-3'}
						>
							{keyStats.map((stat) => (
								<motion.div
									key={stat.label}
									variants={capacityRevealItem}
									whileTap={tap.button.whileTap}
									transition={tap.button.transition}
										className={'rounded-2xl border border-dotori-100 bg-dotori-50/80 px-3 py-3 dark:border-dotori-800 dark:bg-dotori-900/60'}
								>
									<p className={'text-caption text-dotori-500'}>
										{stat.label}
									</p>
									<p className={'mt-1 text-body font-semibold text-dotori-800 dark:text-dotori-100'}>
										{stat.value}
									</p>
								</motion.div>
							))}
						</motion.div>
				</motion.section>
			) : null}
		</>
	);
}

export function FacilityFeatureSection({ features }: FacilityFeatureSectionProps) {
	const activeFeatures = FEATURE_OPTIONS.filter((feature) =>
		features.includes(feature.key),
	);

	return (
		<motion.section
			variants={capacityReveal}
			initial="hidden"
			animate="show"
			className={CLS.sectionLg}
		>
			<h2 className={'text-body-sm font-semibold text-dotori-900 dark:text-dotori-50'}>특징</h2>
			{activeFeatures.length > 0 ? (
				<div className={'mt-3 flex flex-wrap gap-2'}>
					{activeFeatures.map((feature) => (
						<Badge
							key={feature.key}
							color={feature.color}
							className={'text-body-sm font-semibold'}
						>
							{feature.label} ✓
						</Badge>
					))}
				</div>
			) : (
				<p className={'mt-3 text-body-sm leading-relaxed text-dotori-500 dark:text-dotori-300'}>
					아직 등록된 특징이 없어요. 시설에 직접 문의하거나 아이사랑포털 정보를 함께 확인해
					보세요.
				</p>
			)}
		</motion.section>
	);
}

export function FacilityAdmissionGuideSection() {
	return (
		<motion.div
			variants={capacityReveal}
			initial="hidden"
			animate="show"
			className={CLS.sectionLg}
		>
			<h2 className={'text-body-sm font-semibold text-dotori-900 dark:text-dotori-50'}>
				입소 설명회 안내
			</h2>
			<p className={'mt-3 text-body-sm leading-relaxed text-dotori-500 dark:text-dotori-300'}>
				이 시설의 입소 설명회 일정은 아직 등록되지 않았어요.
				시설에 직접 문의하거나 아이사랑포털에서 확인해 보세요.
			</p>
				<motion.a
					href="https://www.childcare.go.kr"
					target="_blank"
					rel="noopener noreferrer"
					whileTap={tap.button.whileTap}
					transition={tap.button.transition}
					className={'mt-3 inline-flex w-full min-h-11 items-center justify-center gap-1.5 rounded-xl bg-dotori-100 px-4 py-2.5 text-body-sm font-semibold text-dotori-700 transition-all hover:bg-dotori-200 active:scale-[0.97] dark:bg-dotori-800 dark:text-dotori-100 dark:hover:bg-dotori-700'}
				>
					아이사랑포털에서 확인
					<ArrowTopRightOnSquareIcon className={'h-4 w-4'} />
				</motion.a>
		</motion.div>
	);
}

export function FacilityCoreInfoSections({
	status,
	qualityScore,
	aiInsightSummary,
	occupancyRate,
	currentCapacity,
	totalCapacity,
	waitingCapacity,
	occupancyProgressColor,
	keyStats,
	features,
}: FacilityCoreInfoSectionsProps) {
	return (
		<>
			<FacilityInsightSection
				status={status}
				qualityScore={qualityScore}
				aiInsightSummary={aiInsightSummary}
				occupancyRate={occupancyRate}
				totalCapacity={totalCapacity}
				currentCapacity={currentCapacity}
				waitingCapacity={waitingCapacity}
			/>
			<FacilityCapacitySection
				occupancyRate={occupancyRate}
				currentCapacity={currentCapacity}
				totalCapacity={totalCapacity}
				waitingCapacity={waitingCapacity}
				occupancyProgressColor={occupancyProgressColor}
				keyStats={keyStats}
			/>
			<FacilityFeatureSection features={features} />
		</>
	);
}
