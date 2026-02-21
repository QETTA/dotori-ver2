import { cn } from "@/lib/utils";
import type { ActionStatus, Facility } from "@/types/dotori";

interface FacilityCapacityCardProps {
	facility: Facility;
	actionStatus: ActionStatus;
	onApplyClick: () => void;
}

export function FacilityCapacityCard({
	facility,
	actionStatus,
	onApplyClick,
}: FacilityCapacityCardProps) {
	const hasWaiting = facility.capacity.waiting != null && facility.capacity.waiting > 0;
	const occupancyRate = facility.capacity.total > 0
		? Math.round((facility.capacity.current / facility.capacity.total) * 100)
		: 0;
	const boundedOccupancyRate = Math.min(100, Math.max(0, occupancyRate));

	const statusConfig = {
		available: { label: "여석 있음", color: "bg-forest-500", barColor: "bg-forest-400", textColor: "text-forest-600", bgColor: "bg-forest-50" },
		waiting: { label: "대기 접수중", color: "bg-warning", barColor: "bg-amber-400", textColor: "text-amber-700", bgColor: "bg-amber-50" },
		full: { label: "마감", color: "bg-danger", barColor: "bg-danger", textColor: "text-danger", bgColor: "bg-danger/10" },
	};
	const config = statusConfig[facility.status] || statusConfig.full;
	const occupancyBarColor =
		boundedOccupancyRate > 90
			? "bg-danger"
			: boundedOccupancyRate > 60
				? "bg-warning"
				: "bg-forest-500";

	return (
		<section>
			{/* 정원·상태 카드 */}
			<div className="rounded-3xl bg-gradient-to-b from-white to-dotori-50/50 p-5 shadow-sm ring-1 ring-dotori-100/40">
				<div className="flex items-center justify-between">
					<div className="flex items-baseline gap-1.5">
						<span className="text-3xl font-bold text-dotori-900">
							{facility.capacity.total}
						</span>
						<span className="text-[14px] text-dotori-500">명 정원</span>
					</div>
					<span className={cn("rounded-full px-3 py-1.5 text-[13px] font-semibold", config.bgColor, config.textColor)}>
						{config.label}
					</span>
				</div>

				{/* 상태 바 */}
				<div className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-dotori-100">
					<div
						className={cn(
							"h-full rounded-full transition-all duration-700",
							occupancyBarColor,
						)}
						style={{
							width: `${boundedOccupancyRate}%`,
						}}
					/>
				</div>

				{/* 부가 정보 */}
				<div className="mt-3 flex items-center gap-4 text-[13px] text-dotori-500">
					{hasWaiting && (
						<span>대기 <strong className="font-semibold text-dotori-700">{facility.capacity.waiting}명</strong></span>
					)}
					{facility.capacity.current > 0 && (
						<span>현원 <strong className="font-semibold text-dotori-700">{facility.capacity.current}명</strong></span>
					)}
					{!hasWaiting && facility.capacity.current === 0 && (
						<span className="text-dotori-300">현원·대기 정보 미공개</span>
					)}
				</div>
			</div>

			{/* 인라인 CTA */}
			{facility.status !== "full" && (
				<button
					onClick={onApplyClick}
					disabled={actionStatus === "executing"}
					className={cn(
						"mt-3 w-full rounded-3xl py-4.5 text-[16px] font-semibold transition-all active:scale-[0.98]",
						actionStatus === "executing"
							? "bg-dotori-200 text-dotori-500"
							: facility.status === "available"
								? "bg-gradient-to-r from-forest-600 to-forest-500 text-white shadow-sm hover:from-forest-700 hover:to-forest-600"
								: "bg-gradient-to-r from-dotori-900 to-dotori-700 text-white shadow-sm hover:from-dotori-800 hover:to-dotori-700",
					)}
				>
					{actionStatus === "executing"
						? "처리 중..."
						: facility.status === "available"
							? "입소 신청하기"
							: hasWaiting
							? `대기 신청하기 (${facility.capacity.waiting}명 대기중)`
							: "대기 신청하기"}
				</button>
			)}
			{facility.status === "full" && (
				<button
					onClick={onApplyClick}
					disabled={actionStatus === "executing"}
					className={cn(
						"mt-3 w-full rounded-3xl py-4.5 text-[16px] font-semibold transition-all active:scale-[0.98]",
						"bg-dotori-100 text-dotori-500 hover:bg-dotori-200",
					)}
				>
					대기 신청하기
				</button>
			)}
		</section>
	);
}
