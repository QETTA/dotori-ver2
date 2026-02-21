import type { DataSource } from "@/types/dotori";
import { BRAND } from "@/lib/brand-assets";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Skeleton } from "./Skeleton";
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
	children?: ReactNode;
}) {
	const hasMessage = typeof message === "string" && message.trim().length > 0;

	return (
		<div
			className={cn(
				"relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-white to-amber-50/40 p-5 shadow-sm ring-1 ring-dotori-200/20",
				"motion-safe:animate-in motion-safe:fade-in duration-300",
			)}
		>
			{/* 브랜드 워터마크 */}
			<div className="pointer-events-none absolute inset-0">
				<img
					src={BRAND.symbol}
					alt=""
					className="absolute -right-4 -bottom-4 h-36 w-36 opacity-[0.08]"
				/>
				<div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
			</div>
			<div className="relative z-10">
				<div className="mb-2 flex items-center gap-2">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={BRAND.symbol} alt="" className="h-7 w-7" />
					<span className="text-[15px] font-semibold text-dotori-800">오늘의 AI 브리핑</span>
				</div>
				<div className="prose prose-sm max-w-none">
					{hasMessage ? (
						<p className="text-[15px] leading-relaxed text-dotori-700">{message}</p>
					) : children ? (
						children
					) : (
						<div className="space-y-2">
							<Skeleton variant="text" />
							<Skeleton variant="text" />
							<Skeleton variant="text" count={1} />
						</div>
					)}
				</div>
				{source && updatedAt && (
					<div className="mt-3">
						<SourceChip source={source} updatedAt={updatedAt} freshness="realtime" />
					</div>
				)}
			</div>
		</div>
	);
}
