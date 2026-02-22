import { Text } from "@/components/catalyst/text";

export function UsageCounter({
	count,
	limit,
	isLoading,
}: {
	count: number;
	limit: number;
	isLoading: boolean;
}) {
	const safeLimit = Math.max(1, Math.floor(limit));
	const safeCount = Math.max(0, Math.floor(count));
	const displayCount = isLoading ? 0 : Math.min(safeCount, safeLimit);
	const percent = isLoading
		? 0
		: Math.min(100, Math.round((displayCount / safeLimit) * 100));

	return (
		<div className="flex items-center gap-2">
			<Text className="text-sm font-semibold text-dotori-700">
				{`${displayCount}/${safeLimit}`}
			</Text>
			<div className="h-1.5 w-20 rounded-full bg-dotori-100">
				<div
					className="h-full rounded-full bg-dotori-400"
					style={{ width: `${percent}%` }}
				/>
			</div>
		</div>
	);
}
