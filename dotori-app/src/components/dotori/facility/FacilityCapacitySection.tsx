import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

import { Badge } from "@/components/catalyst/badge";
import type { Facility } from "@/types/dotori";

const FEATURE_OPTIONS = [
	{ key: "CCTV", label: "CCTV", color: "forest" },
	{ key: "소규모", label: "소규모", color: "forest" },
	{ key: "통학버스", label: "통학버스", color: "forest" },
	{ key: "놀이터", label: "놀이터", color: "forest" },
	{ key: "대규모", label: "대규모", color: "forest" },
] as const;

type FacilityKeyStat = {
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

export function FacilityInsightSection({
	status,
	qualityScore,
	aiInsightSummary,
	totalCapacity,
	currentCapacity,
	waitingCapacity,
}: FacilityInsightSectionProps) {
	return (
		<section className="rounded-3xl border border-dotori-100 bg-gradient-to-b from-white via-dotori-50/70 to-white p-5 shadow-[0_10px_22px_rgba(200,149,106,0.08)]">
			<div className="flex items-center justify-between gap-2">
				<Badge color={status === "available" ? "forest" : "dotori"}>AI 이동 인사이트</Badge>
				<span className="text-xs font-semibold text-dotori-500">
					데이터 품질 {qualityScore ?? "-"}점
				</span>
			</div>
			<p className="mt-3 text-sm leading-relaxed text-dotori-700">{aiInsightSummary}</p>
			<div className="mt-3 grid grid-cols-3 gap-2">
				<div className="rounded-2xl border border-dotori-100 bg-white px-3 py-2.5">
					<p className="text-xs text-dotori-500">정원</p>
					<p className="mt-0.5 text-sm font-semibold text-dotori-800">{totalCapacity}명</p>
				</div>
				<div className="rounded-2xl border border-dotori-100 bg-white px-3 py-2.5">
					<p className="text-xs text-dotori-500">현원</p>
					<p className="mt-0.5 text-sm font-semibold text-dotori-800">{currentCapacity}명</p>
				</div>
				<div className="rounded-2xl border border-dotori-100 bg-white px-3 py-2.5">
					<p className="text-xs text-dotori-500">대기</p>
					<p className="mt-0.5 text-sm font-semibold text-dotori-800">{waitingCapacity}명</p>
				</div>
			</div>
		</section>
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
	return (
		<>
			<section className="rounded-3xl border border-dotori-100 bg-white p-5 shadow-[0_10px_22px_rgba(200,149,106,0.08)]">
				<div className="flex items-center justify-between gap-2">
					<h2 className="text-sm font-semibold text-dotori-900">정원 현황</h2>
					<span className="text-sm font-semibold text-dotori-700">{occupancyRate}%</span>
				</div>
				<p className="mt-2 text-sm text-dotori-700">
					현원 {currentCapacity}명 · 정원 {totalCapacity}명 · 대기 {waitingCapacity}명
				</p>
				<div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-dotori-100">
					<div
						className={`h-full rounded-full transition-all duration-700 ${occupancyProgressColor}`}
						style={{ width: `${occupancyRate}%` }}
					/>
				</div>
			</section>

			{keyStats.length > 0 ? (
				<section className="rounded-3xl border border-dotori-100 bg-white p-5 shadow-[0_10px_22px_rgba(200,149,106,0.08)]">
					<h2 className="text-sm font-semibold text-dotori-900">주요 지표</h2>
					<div className="mt-3 grid grid-cols-2 gap-3">
						{keyStats.map((stat) => (
							<div
								key={stat.label}
								className="rounded-2xl border border-dotori-100 bg-dotori-50/80 px-3 py-3"
							>
								<p className="text-xs text-dotori-500">{stat.label}</p>
								<p className="mt-1 text-base font-semibold text-dotori-800">{stat.value}</p>
							</div>
						))}
					</div>
				</section>
			) : null}
		</>
	);
}

export function FacilityFeatureSection({ features }: FacilityFeatureSectionProps) {
	const activeFeatures = FEATURE_OPTIONS.filter((feature) =>
		features.includes(feature.key),
	);

	return (
		<section className="rounded-3xl bg-white p-5 shadow-sm">
			<h2 className="text-sm font-semibold text-dotori-900">특징</h2>
			{activeFeatures.length > 0 ? (
				<div className="mt-3 flex flex-wrap gap-2">
					{activeFeatures.map((feature) => (
						<Badge key={feature.key} color={feature.color} className="text-sm">
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

export function FacilityAdmissionGuideSection() {
	return (
		<div className="rounded-3xl border border-dotori-100 bg-dotori-50 p-5">
			<h2 className="text-sm font-semibold text-dotori-900">입소 설명회 안내</h2>
			<p className="mt-2 text-sm leading-6 text-dotori-600">
				이 시설의 입소 설명회 일정은 아직 등록되지 않았어요.
				시설에 직접 문의하거나 아이사랑포털에서 확인해 보세요.
			</p>
			<a
				href="https://www.childcare.go.kr"
				target="_blank"
				rel="noopener noreferrer"
				className="mt-3 inline-flex items-center gap-1.5 rounded-2xl bg-dotori-100 px-4 py-2.5 text-sm font-semibold text-dotori-700 transition-all active:scale-[0.97] hover:bg-dotori-200"
			>
				아이사랑포털에서 확인
				<ArrowTopRightOnSquareIcon className="h-4 w-4" />
			</a>
		</div>
	);
}
