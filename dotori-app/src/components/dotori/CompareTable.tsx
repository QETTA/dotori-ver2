"use client";

import { Badge } from "@/components/catalyst/badge";
import { DS_TYPOGRAPHY, DS_STATUS } from "@/lib/design-system/tokens";
import { DS_CARD } from "@/lib/design-system/card-tokens";
import { cn, facilityTypeBadgeColor } from "@/lib/utils";
import type { Facility } from "@/types/dotori";

interface CompareTableProps {
	facilities: Facility[];
	highlightBest?: boolean;
}

export function CompareTable({ facilities, highlightBest }: CompareTableProps) {
	if (facilities.length === 0) return null;

	const best = highlightBest
		? facilities.reduce((a, b) => (a.rating > b.rating ? a : b))
		: null;

	const bestFacilityId = best?.id ?? "";

	return (
		<div className={cn('overflow-x-auto -mx-2', DS_CARD.flat.base, DS_CARD.flat.dark, 'p-2')}>
			<table className={cn('w-full text-dotori-700 dark:text-dotori-100', DS_TYPOGRAPHY.bodySm)}>
				<thead>
					<tr className={'border-b border-dotori-200/60 dark:border-dotori-700/60'}>
						<th className={'py-2 px-2 text-left font-medium text-dotori-600 dark:text-dotori-300'}>항목</th>
						{facilities.map((f) => (
							<th
								key={f.id}
								className={cn(
									'py-2 px-2 text-center font-medium text-dotori-700 dark:text-dotori-100',
									bestFacilityId === f.id && 'text-forest-600 dark:text-forest-300',
								)}
							>
								{f.name.length > 8 ? `${f.name.slice(0, 8)}…` : f.name}
							</th>
						))}
					</tr>
				</thead>
				<tbody className={'divide-y divide-dotori-100/50 dark:divide-dotori-800/60'}>
					<tr>
						<td className={'py-1.5 px-2 text-dotori-500 dark:text-dotori-300'}>유형</td>
						{facilities.map((f) => (
							<td key={f.id} className={'py-1.5 px-2 text-center'}>
								<Badge color={facilityTypeBadgeColor(f.type)}>{f.type}</Badge>
							</td>
						))}
					</tr>
					<tr>
						<td className={'py-1.5 px-2 text-dotori-500 dark:text-dotori-300'}>상태</td>
						{facilities.map((f) => {
							const statusToken = DS_STATUS[f.status as keyof typeof DS_STATUS];
							return (
								<td key={f.id} className={'py-1.5 px-2 text-center'}>
									<span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium', statusToken?.pill)}>
										<span className={cn('h-1.5 w-1.5 rounded-full', statusToken?.dot)} />
										{statusToken?.label ?? f.status}
									</span>
								</td>
							);
						})}
					</tr>
					<tr>
						<td className={'py-1.5 px-2 text-dotori-500 dark:text-dotori-300'}>정원</td>
						{facilities.map((f) => (
							<td key={f.id} className={'py-1.5 px-2 text-center'}>
								{f.capacity.current}/{f.capacity.total}
							</td>
						))}
					</tr>
					<tr>
						<td className={'py-1.5 px-2 text-dotori-500 dark:text-dotori-300'}>평점</td>
						{facilities.map((f) => (
							<td key={f.id} className={cn('py-1.5 px-2 text-center', f.id === bestFacilityId && 'py-1.5 px-2 text-center font-medium text-forest-600 dark:text-forest-300')}>
								{f.rating > 0 ? f.rating.toFixed(1) : "—"}
							</td>
						))}
					</tr>
					<tr>
						<td className={'py-1.5 px-2 text-dotori-500 dark:text-dotori-300'}>대기</td>
						{facilities.map((f) => (
							<td key={f.id} className={'py-1.5 px-2 text-center'}>
								{f.capacity.waiting > 0 ? `${f.capacity.waiting}명` : "없음"}
							</td>
						))}
					</tr>
				</tbody>
			</table>
		</div>
	);
}
