import Link from "next/link";
import { cn } from "@/lib/utils";
import { Text } from "@/components/catalyst/text";

interface UsageCounterProps {
	current: number;
	limit: number;
	label: string;
}

export function UsageCounter({ current, limit, label }: UsageCounterProps) {
	const isUnlimited = limit === -1;
	const isOverLimit = !isUnlimited && current > limit;
	const ratio = isUnlimited || limit <= 0 ? 0 : current / limit;
	const percent = Math.max(0, Math.min(1, ratio)) * 100;
	const isNearLimit = !isUnlimited && !isOverLimit && ratio >= 0.8;

	const trackColor = isOverLimit
		? "bg-dotori-100 text-dotori-700"
		: isNearLimit
			? "bg-amber-100 text-amber-700"
			: isUnlimited
				? "bg-dotori-100 text-dotori-700"
				: "bg-forest-100 text-forest-700";

	const barColor = isOverLimit
		? "bg-dotori-500"
		: isNearLimit
			? "bg-amber-500"
			: isUnlimited
				? "bg-dotori-400"
				: "bg-forest-500";

	return (
			<div className="space-y-2 rounded-2xl border border-dotori-100 bg-white p-4">
			<div className="flex items-end justify-between gap-3">
				<Text className="text-sm font-medium text-dotori-700">{label}</Text>
				<div className={cn("rounded-full px-3 py-1 text-xs font-semibold", trackColor)}>
					{isUnlimited ? "무제한" : `${current}/${limit}`}
				</div>
			</div>
			<div className="h-2 overflow-hidden rounded-full bg-dotori-100">
				<div
					className={cn("h-full rounded-full transition-all duration-300", barColor)}
					style={{ width: isUnlimited ? "100%" : `${percent}%` }}
				/>
			</div>
			{isOverLimit ? (
				<Text className="text-sm text-dotori-700">
					현재 사용량을 초과했습니다.{" "}
					<Link href="/my/settings" className="font-semibold text-dotori-700">
						업그레이드
					</Link>
				</Text>
			) : null}
		</div>
	);
}
