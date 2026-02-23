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
import { DS_SENTIMENT } from "@/lib/design-system/tokens";
import { cn } from "@/lib/utils";
import type { DataSource } from "@/types/dotori";
import { Skeleton } from "./Skeleton";
import { SourceChip } from "./SourceChip";
import { Surface } from "./Surface";

/** 감성 → 아이콘 컴포넌트 매핑 (CSS 스타일은 DS_SENTIMENT에서 관리) */
const SENTIMENT_ICONS = {
	positive: CheckCircleIcon,
	neutral:  MinusCircleIcon,
	caution:  ExclamationTriangleIcon,
} as const;

type Sentiment = keyof typeof DS_SENTIMENT;

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
		<Surface
			className={cn(
				"px-4 py-3 motion-safe:animate-in motion-safe:fade-in duration-300 sm:px-5 sm:py-4",
				"bg-dotori-50/80 ring-1 ring-dotori-200/60 dark:bg-dotori-950/40 dark:ring-dotori-700/30",
			)}
		>
			{/* 브랜드 워터마크 */}
			<div className="pointer-events-none absolute inset-0">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={BRAND.watermark}
					alt=""
					aria-hidden="true"
					className="absolute -right-8 -bottom-8 h-40 w-40 opacity-10"
				/>
				<div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent dark:from-dotori-950" />
			</div>

			<div className="relative">
				<div className="flex items-start justify-between gap-3">
					<div className="flex items-center gap-2">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src={BRAND.symbol} alt="" aria-hidden="true" className="h-7 w-7" />
						<div>
							<p className="text-sm font-semibold text-dotori-900 dark:text-dotori-50">오늘의 이동 브리핑</p>
							<p className="mt-0.5 text-xs text-dotori-600 dark:text-dotori-300">조건에 맞는 시설부터 빠르게 정리했어요</p>
						</div>
					</div>
					<SourceChip source={sourceLabel} updatedAt={updatedAt} freshness="realtime" selected={true} />
				</div>

				<div className="mt-4">
					{hasMessage ? (
						<p className="text-sm leading-relaxed text-dotori-800 dark:text-dotori-100">{message}</p>
					) : hasInsightItems ? (
						<ul aria-label="insight 항목 리스트" className="space-y-2 text-sm text-dotori-800 dark:text-dotori-100">
							{insightItems.map((insight, index) => {
								const style = DS_SENTIMENT[insight.sentiment];
								const Icon = SENTIMENT_ICONS[insight.sentiment];
								return (
									<li
										key={`${insight.label}-${index}`}
										className="flex items-start gap-2"
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
													<span className="ml-1 text-xs text-dotori-500 dark:text-dotori-300">({insight.source})</span>
												) : null}
											</p>
										</div>
									</li>
								);
							})}
						</ul>
					) : children ? (
						<div>{labeledChildren}</div>
					) : (
						<div className="space-y-2">
							<Skeleton variant="text" />
							<Skeleton variant="text" />
							<Skeleton variant="text" count={1} />
						</div>
					)}
				</div>
			</div>
		</Surface>
	);
}
