import { useMemo } from "react";
import Link from "next/link";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { generateWhyInsights, type WhyInsight } from "@/lib/engine/why-engine";
import type { Facility } from "@/types/dotori";

const sentimentDot: Record<WhyInsight["sentiment"], string> = {
	positive: "bg-forest-500",
	neutral: "bg-dotori-400",
	caution: "bg-warning",
};

interface FacilityInsightsProps {
	facility: Facility;
}

export function FacilityInsights({ facility }: FacilityInsightsProps) {
	const insights = useMemo(() => generateWhyInsights(facility), [facility]);

	if (insights.length === 0) return null;

	return (
		<section className="rounded-2xl bg-dotori-50 p-5 motion-safe:animate-in motion-safe:fade-in duration-300">
			<div className="flex items-center gap-1.5">
				<SparklesIcon className="h-5 w-5 text-dotori-500" />
				<h3 className="font-semibold">AI 인사이트</h3>
			</div>
			<ul className="mt-2 space-y-2 text-sm text-dotori-700">
				{insights.map((insight, i) => (
					<li key={i} className="flex items-start gap-1.5">
						<span
							className={cn(
								"mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
								sentimentDot[insight.sentiment],
							)}
						/>
						<div className="min-w-0 flex-1">
							<span>{insight.text}</span>
							<span className="ml-1 text-xs text-dotori-500">
								({insight.source})
							</span>
						</div>
					</li>
				))}
			</ul>
			<Link
				href={`/chat?prompt=${encodeURIComponent(`${facility.name}에 대해 더 알려줘`)}`}
				className="mt-3 inline-flex items-center gap-1.5 py-1 text-sm font-semibold text-dotori-600 transition-colors hover:text-dotori-700"
			>
				<SparklesIcon className="h-4 w-4" />
				토리에게 자세히 물어보기
			</Link>
		</section>
	);
}
