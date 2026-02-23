import Link from "next/link";
import { Badge } from "@/components/catalyst/badge";
import { cn } from "@/lib/utils";
import { Text } from "@/components/catalyst/text";
import { BRAND } from "@/lib/brand-assets";
import { DS_GLASS, DS_TYPOGRAPHY } from "@/lib/design-system/tokens";

interface UsageCounterProps {
	current: number;
	limit: number;
	label: string;
}

export function UsageCounter({ current, limit, label }: UsageCounterProps) {
	const isUnlimited = limit === -1;
	const hasLimit = !isUnlimited && limit > 0;
	const isOverLimit = hasLimit && current > limit;
	const isLimitReached = hasLimit && current >= limit;
	const ratio = hasLimit ? current / limit : 0;
	const percent = Math.max(0, Math.min(1, ratio)) * 100;
	const isNearLimit = hasLimit && !isLimitReached && ratio >= 0.8;
	const statusTone = isLimitReached ? "dotori" : isNearLimit ? "amber" : "forest";
	const statusLabel = isLimitReached
		? "한도 도달"
		: isNearLimit
			? "주의 구간"
			: "안전 구간";

	const containerColor = isLimitReached
		? "border-dotori-200 dark:border-dotori-700"
		: isNearLimit
			? "border-dotori-200 dark:border-dotori-700"
			: "border-dotori-100 dark:border-dotori-800";

	const labelColor = "text-dotori-900 dark:text-dotori-50";

	const counterPillColor = isLimitReached
		? "bg-dotori-100 text-dotori-700 dark:bg-dotori-800 dark:text-dotori-100"
		: hasLimit
			? "bg-forest-100 text-forest-700 dark:bg-forest-900/20 dark:text-forest-200"
			: "bg-dotori-100 text-dotori-700 dark:bg-dotori-800 dark:text-dotori-100";

	const trackBgColor = isLimitReached
		? "bg-dotori-100 dark:bg-dotori-800"
		: hasLimit
			? "bg-forest-100 dark:bg-forest-900/20"
			: "bg-dotori-100 dark:bg-dotori-800";

	const barColor = isLimitReached
		? "bg-dotori-500"
		: isUnlimited
			? "bg-forest-500"
			: "bg-dotori-300 dark:bg-dotori-600";

	return (
		<div
			className={cn(
				DS_GLASS.CARD,
				"relative space-y-2 overflow-hidden rounded-2xl border bg-gradient-to-br from-white via-dotori-50/70 to-amber-50/40 p-4 transition-shadow hover:shadow-sm dark:from-dotori-950 dark:via-dotori-900/70 dark:to-dotori-950",
				containerColor,
			)}
		>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={BRAND.watermark}
				alt=""
				aria-hidden="true"
				className="pointer-events-none absolute -right-8 -top-7 h-20 w-20 opacity-[0.07]"
			/>
			<div className="flex items-end justify-between gap-3">
				<div>
					<Text className={cn(DS_TYPOGRAPHY.label, "font-semibold", labelColor)}>{label}</Text>
					<Badge color={statusTone} className={cn(DS_TYPOGRAPHY.caption, "mt-1 font-semibold")}>
						{statusLabel}
					</Badge>
				</div>
				<div className={cn("rounded-full px-3 py-1 font-semibold tabular-nums", DS_TYPOGRAPHY.bodySm, counterPillColor)}>
					{isUnlimited ? "무제한" : `${current}/${limit}`}
				</div>
			</div>
			<div className={cn("h-1.5 overflow-hidden rounded-full", trackBgColor)}>
				<div
					className={cn("h-full rounded-full transition-all duration-300", barColor)}
					style={{ width: isUnlimited ? "100%" : `${percent}%` }}
				/>
			</div>
			{isNearLimit ? (
				<Text className={cn(DS_TYPOGRAPHY.bodySm, "text-dotori-800 dark:text-dotori-100")}>
					이번 달 사용 한도의 80% 이상을 사용했어요.
				</Text>
			) : null}
			{isLimitReached ? (
				<Text className={cn(DS_TYPOGRAPHY.bodySm, "text-dotori-800 dark:text-dotori-100")}>
					{isOverLimit ? "현재 사용량을 초과했습니다." : "이번 달 사용 한도에 도달했습니다."}{" "}
					<Link
						href="/my/settings"
						className={cn(
							DS_TYPOGRAPHY.bodySm,
							"font-semibold text-dotori-700 underline decoration-dotori-200 underline-offset-4 transition-colors hover:text-dotori-900 dark:text-dotori-200 dark:decoration-dotori-700 dark:hover:text-dotori-50",
						)}
					>
						업그레이드
					</Link>
				</Text>
			) : null}
		</div>
	);
}
