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
			<section className="rounded-3xl bg-white p-5 shadow-sm">
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
		</>
	);
}
