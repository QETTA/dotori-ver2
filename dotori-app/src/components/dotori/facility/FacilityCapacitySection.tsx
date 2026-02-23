import { ArrowTopRightOnSquareIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { motion } from "motion/react";
import { useState } from "react";

import { Badge } from "@/components/catalyst/badge";
import { fadeUp } from "@/lib/motion";
import type { Facility } from "@/types/dotori";

const FEATURE_OPTIONS = [
	{ key: "CCTV", label: "CCTV", color: "forest" },
	{ key: "소규모", label: "소규모", color: "forest" },
	{ key: "통학버스", label: "통학버스", color: "forest" },
	{ key: "놀이터", label: "놀이터", color: "forest" },
	{ key: "대규모", label: "대규모", color: "forest" },
] as const;

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
	totalCapacity,
	currentCapacity,
	waitingCapacity,
}: FacilityInsightSectionProps) {
	return (
		<motion.section
			{...fadeUp}
			className="mb-6 rounded-3xl border border-b border-dotori-100 bg-gradient-to-b from-white via-dotori-50/70 to-white p-5 pb-6 shadow-[0_10px_22px_rgba(200,149,106,0.08)] dark:border-dotori-800 dark:from-dotori-950 dark:via-dotori-900/60 dark:to-dotori-950 dark:shadow-none"
		>
			<div className="flex items-center justify-between gap-2">
				<Badge color={status === "available" ? "forest" : "dotori"}>AI 이동 인사이트</Badge>
				<span className="text-caption font-semibold text-dotori-500">
					데이터 품질 {qualityScore ?? "-"}점
				</span>
			</div>
			<p className="mt-3 text-body-sm leading-relaxed text-dotori-700 dark:text-dotori-200">
				{aiInsightSummary}
			</p>
			<div className="mt-3 grid grid-cols-3 gap-1.5 rounded-2xl bg-dotori-50/60 p-1.5 dark:bg-dotori-900/50">
				<div className="rounded-xl border border-dotori-100/80 bg-white px-2.5 py-2.5 text-center dark:border-dotori-800 dark:bg-dotori-950">
					<p className="text-caption font-medium text-dotori-500">정원</p>
					<p className="mt-1 text-h2 font-bold leading-none tracking-tight text-dotori-900 dark:text-dotori-50">
						{totalCapacity}
						<span className="ml-0.5 text-caption font-semibold text-dotori-500 dark:text-dotori-300">
							명
						</span>
					</p>
				</div>
				<div className="rounded-xl border border-dotori-100/80 bg-white px-2.5 py-2.5 text-center dark:border-dotori-800 dark:bg-dotori-950">
					<p className="text-caption font-medium text-dotori-500">현원</p>
					<p className="mt-1 text-h2 font-bold leading-none tracking-tight text-dotori-900 dark:text-dotori-50">
						{currentCapacity}
						<span className="ml-0.5 text-caption font-semibold text-dotori-500 dark:text-dotori-300">
							명
						</span>
					</p>
				</div>
				<div className="rounded-xl border border-dotori-100/80 bg-white px-2.5 py-2.5 text-center dark:border-dotori-800 dark:bg-dotori-950">
					<p className="text-caption font-medium text-dotori-500">대기</p>
					<p className="mt-1 text-h2 font-bold leading-none tracking-tight text-dotori-900 dark:text-dotori-50">
						{waitingCapacity}
						<span className="ml-0.5 text-caption font-semibold text-dotori-500 dark:text-dotori-300">
							명
						</span>
					</p>
				</div>
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

	return (
		<>
			<motion.section
				{...fadeUp}
				className="mb-6 rounded-3xl border-b border-dotori-100 bg-white px-5 py-5 shadow-[0_10px_22px_rgba(200,149,106,0.08)] dark:border-dotori-800 dark:bg-dotori-950 dark:shadow-none"
			>
				<button
					type="button"
					onClick={() => setIsExpanded((prev) => !prev)}
					aria-expanded={isExpanded}
					aria-controls="facility-capacity-details"
					className="flex w-full min-h-11 items-center justify-between gap-3 rounded-xl py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dotori-200"
				>
					<div className="flex min-w-0 items-baseline gap-2">
						<h2 className="text-body-sm font-semibold text-dotori-900 dark:text-dotori-50">
							정원 현황
						</h2>
						<span className="text-h1 font-bold leading-none text-dotori-700 dark:text-dotori-200">
							{occupancyRate}%
						</span>
					</div>
					<ChevronDownIcon
						className={`h-5 w-5 flex-shrink-0 text-dotori-500 transition-transform duration-200 ${
							isExpanded ? "rotate-180" : ""
						}`}
					/>
				</button>
				{isExpanded ? (
					<div id="facility-capacity-details" className="mt-3">
						<p className="text-body-sm text-dotori-700 dark:text-dotori-200">
							현원 {currentCapacity}명 · 정원 {totalCapacity}명 · 대기 {waitingCapacity}명
						</p>
						<div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-dotori-100 dark:bg-dotori-800">
							<div
								className={`h-full rounded-full transition-all duration-700 ${occupancyProgressColor}`}
								style={{ width: `${occupancyRate}%` }}
							/>
						</div>
					</div>
				) : null}
			</motion.section>

			{isExpanded && keyStats.length > 0 ? (
				<motion.section
					{...fadeUp}
					className="mb-6 rounded-3xl border-b border-dotori-100 bg-white px-5 py-5 shadow-[0_10px_22px_rgba(200,149,106,0.08)] dark:border-dotori-800 dark:bg-dotori-950 dark:shadow-none"
				>
					<h2 className="text-body-sm font-semibold text-dotori-900 dark:text-dotori-50">
						주요 지표
					</h2>
					<div className="mt-3 grid grid-cols-2 gap-3">
						{keyStats.map((stat) => (
							<div
								key={stat.label}
								className="rounded-2xl border border-dotori-100 bg-dotori-50/80 px-3 py-3 dark:border-dotori-800 dark:bg-dotori-900/60"
							>
								<p className="text-caption text-dotori-500">{stat.label}</p>
								<p className="mt-1 text-base font-semibold text-dotori-800 dark:text-dotori-100">
									{stat.value}
								</p>
							</div>
						))}
					</div>
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
			{...fadeUp}
			className="mb-6 rounded-3xl border border-b border-dotori-100 bg-white p-5 pb-6 shadow-[0_10px_22px_rgba(200,149,106,0.08)] dark:border-dotori-800 dark:bg-dotori-950 dark:shadow-none"
		>
			<h2 className="text-body-sm font-semibold text-dotori-900 dark:text-dotori-50">특징</h2>
			{activeFeatures.length > 0 ? (
				<div className="mt-3 flex flex-wrap gap-2">
					{activeFeatures.map((feature) => (
						<Badge key={feature.key} color={feature.color} className="text-body-sm">
							{feature.label} ✓
						</Badge>
					))}
				</div>
			) : (
				<p className="mt-3 text-body-sm leading-relaxed text-dotori-500 dark:text-dotori-300">
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
			{...fadeUp}
			className="mb-6 rounded-3xl border border-b border-dotori-100 bg-dotori-50 p-5 pb-6 dark:border-dotori-800 dark:bg-dotori-900"
		>
			<h2 className="text-body-sm font-semibold text-dotori-900 dark:text-dotori-50">
				입소 설명회 안내
			</h2>
			<p className="mt-2 text-body-sm leading-6 text-dotori-600 dark:text-dotori-300">
				이 시설의 입소 설명회 일정은 아직 등록되지 않았어요.
				시설에 직접 문의하거나 아이사랑포털에서 확인해 보세요.
			</p>
			<a
				href="https://www.childcare.go.kr"
				target="_blank"
				rel="noopener noreferrer"
				className="mt-3 inline-flex w-full min-h-12 items-center justify-center gap-1.5 rounded-2xl bg-dotori-100 px-4 py-3 text-body-sm font-semibold text-dotori-700 transition-all active:scale-[0.97] hover:bg-dotori-200 dark:bg-dotori-800 dark:text-dotori-100 dark:hover:bg-dotori-700"
			>
				아이사랑포털에서 확인
				<ArrowTopRightOnSquareIcon className="h-4 w-4" />
			</a>
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
