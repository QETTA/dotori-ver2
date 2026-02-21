import type { DataSource } from "@/types/dotori";
import { BRAND } from "@/lib/brand-assets";
import { cn } from "@/lib/utils";
import { SourceChip } from "./SourceChip";

export function AiBriefingCard({
	message,
	source,
	updatedAt,
	children,
}: {
	message?: string;
	source?: DataSource;
	updatedAt?: string;
	children?: React.ReactNode;
}) {
		return (
			<div
				className={cn(
				"relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-amber-50/40 p-5 shadow-sm ring-1 ring-dotori-200/20",
					"motion-safe:animate-in motion-safe:fade-in duration-300"
				)}
			>
			{/* AI surface decorative gradient blob */}
			<div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-dotori-200/30 to-amber-200/20 blur-2xl" />
			<div className="mb-2 flex items-center gap-2">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src={BRAND.symbol} alt="" className="h-7 w-7" />
				<span className="text-[15px] font-semibold text-dotori-800">
					오늘의 AI 브리핑
				</span>
			</div>
			<div className="prose prose-sm max-w-none">
				{message && (
					<p className="text-[15px] leading-relaxed text-dotori-700">{message}</p>
				)}
				{children}
			</div>
			{source && updatedAt && (
				<div className="mt-3">
					<SourceChip source={source} updatedAt={updatedAt} freshness="realtime" />
				</div>
			)}
		</div>
	);
}
