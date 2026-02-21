"use client";

import {
	CheckCircleIcon,
	ExclamationTriangleIcon,
	MinusCircleIcon,
} from "@heroicons/react/24/outline";
import {
	Children,
	cloneElement,
	type ReactElement,
	type ReactNode,
	isValidElement,
	useMemo,
} from "react";
import { BRAND } from "@/lib/brand-assets";
import { cn } from "@/lib/utils";
import type { DataSource } from "@/types/dotori";
import { Skeleton } from "./Skeleton";
import { SourceChip } from "./SourceChip";

const SENTIMENT_STYLES = {
	positive: {
		label: "긍정",
		icon: CheckCircleIcon,
		wrap: "bg-emerald-50 ring-emerald-200",
		iconClass: "text-emerald-700",
	},
	neutral: {
		label: "중립",
		icon: MinusCircleIcon,
		wrap: "bg-slate-50 ring-slate-200",
		iconClass: "text-slate-700",
	},
	caution: {
		label: "주의",
		icon: ExclamationTriangleIcon,
		wrap: "bg-warning/15 ring-warning/35",
		iconClass: "text-warning",
	},
} as const;

type Sentiment = keyof typeof SENTIMENT_STYLES;

interface InsightItem {
	label: string;
	sentiment: Sentiment;
	source?: string;
}

function addA11yLabelToInsightList(children: ReactNode) {
	return Children.map(children, (child) => {
		if (!isValidElement(child)) return child;

		if (typeof child.type === "string" && child.type === "ul") {
			const element = child as ReactElement<React.ComponentPropsWithoutRef<"ul">>;
			const items = Children.map(element.props.children, (item, index) => {
				if (
					isValidElement(item) &&
					typeof item.type === "string" &&
					item.type === "li"
				) {
					const listItem = item as ReactElement<React.ComponentPropsWithoutRef<"li">>;
					return cloneElement(listItem, {
						"aria-label": `인사이트 항목 ${index + 1}`,
					} as React.ComponentProps<"li">);
				}

				return item;
			});

			return cloneElement(
				element,
				{ "aria-label": "insight 항목 리스트" } as React.ComponentProps<"ul">,
				items,
			);
		}

		return child;
	});
}

export function AiBriefingCard({
	message,
	source,
	updatedAt,
	insightItems,
	children,
}: {
	message?: string;
	source?: DataSource;
	updatedAt?: string;
	insightItems?: InsightItem[];
	children?: ReactNode;
}) {
	const hasMessage = typeof message === "string" && message.trim().length > 0;
	const hasInsightItems = Array.isArray(insightItems) && insightItems.length > 0;
	const sourceLabel = source ?? "AI분석";
	const labeledChildren = useMemo(() => addA11yLabelToInsightList(children), [children]);

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
					<span className="text-[15px] font-semibold text-dotori-800">오늘의 이동 브리핑</span>
				</div>
				<div className="prose prose-sm max-w-none">
					{hasMessage ? (
						<p className="text-[15px] leading-relaxed text-dotori-700">{message}</p>
					) : hasInsightItems ? (
						<ul
							aria-label="insight 항목 리스트"
							className="mt-2 space-y-2 text-[14px] text-dotori-700"
						>
							{insightItems.map((insight, index) => {
								const style = SENTIMENT_STYLES[insight.sentiment];
								const Icon = style.icon;
								return (
									<li
										key={`${insight.label}-${index}`}
										className="flex items-start gap-1.5"
										aria-label={`인사이트 항목 ${index + 1}: ${style.label}. ${insight.label}`}
									>
										<div
											className={cn(
												"mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1",
												style.wrap,
											)}
											aria-hidden="true"
										>
											<Icon className={cn("h-3.5 w-3.5", style.iconClass)} />
										</div>
										<div className="min-w-0 flex-1">
											<p className="leading-relaxed">
												{insight.label}
												{insight.source ? (
													<span className="ml-1 text-[12px] text-dotori-500">
														({insight.source})
													</span>
												) : null}
											</p>
										</div>
									</li>
								);
							})}
						</ul>
					) : children ? (
						<div className="prose prose-sm max-w-none">{labeledChildren}</div>
					) : (
						<div className="space-y-2">
							<Skeleton variant="text" />
							<Skeleton variant="text" />
							<Skeleton variant="text" count={1} />
						</div>
					)}
				</div>
				<div className="mt-3">
					<SourceChip
						source={sourceLabel}
						updatedAt={updatedAt}
						freshness="realtime"
					/>
				</div>
			</div>
		</div>
	);
}
