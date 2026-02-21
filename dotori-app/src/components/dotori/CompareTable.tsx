"use client";

import type { Facility } from "@/types/dotori";
import { facilityStatusLabel, facilityTypeBadgeColor } from "@/lib/utils";

interface CompareTableProps {
	facilities: Facility[];
	highlightBest?: boolean;
}

export function CompareTable({ facilities, highlightBest }: CompareTableProps) {
	if (facilities.length === 0) return null;

	const best = highlightBest
		? facilities.reduce((a, b) => (a.rating > b.rating ? a : b))
		: null;

	return (
		<div className="overflow-x-auto -mx-2">
			<table className="w-full text-xs">
				<thead>
					<tr className="border-b border-dotori-200/60">
						<th className="py-2 px-2 text-left font-medium text-dotori-600">항목</th>
						{facilities.map((f) => (
							<th
								key={f.id}
								className={`py-2 px-2 text-center font-medium ${
									best && f.id === best.id
										? "text-forest-600"
										: "text-dotori-700"
								}`}
							>
								{f.name.length > 8 ? `${f.name.slice(0, 8)}…` : f.name}
							</th>
						))}
					</tr>
				</thead>
				<tbody className="divide-y divide-dotori-100/50">
					<tr>
						<td className="py-1.5 px-2 text-dotori-500">유형</td>
						{facilities.map((f) => (
							<td key={f.id} className="py-1.5 px-2 text-center">
								<span className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${facilityTypeBadgeColor(f.type)}`}>
									{f.type}
								</span>
							</td>
						))}
					</tr>
					<tr>
						<td className="py-1.5 px-2 text-dotori-500">상태</td>
						{facilities.map((f) => (
							<td key={f.id} className="py-1.5 px-2 text-center">
								{facilityStatusLabel(f.status)}
							</td>
						))}
					</tr>
					<tr>
						<td className="py-1.5 px-2 text-dotori-500">정원</td>
						{facilities.map((f) => (
							<td key={f.id} className="py-1.5 px-2 text-center">
								{f.capacity.current}/{f.capacity.total}
							</td>
						))}
					</tr>
					<tr>
						<td className="py-1.5 px-2 text-dotori-500">평점</td>
						{facilities.map((f) => (
							<td
								key={f.id}
								className={`py-1.5 px-2 text-center font-medium ${
									best && f.id === best.id ? "text-forest-600" : ""
								}`}
							>
								{f.rating > 0 ? f.rating.toFixed(1) : "—"}
							</td>
						))}
					</tr>
					<tr>
						<td className="py-1.5 px-2 text-dotori-500">대기</td>
						{facilities.map((f) => (
							<td key={f.id} className="py-1.5 px-2 text-center">
								{f.capacity.waiting > 0 ? `${f.capacity.waiting}명` : "없음"}
							</td>
						))}
					</tr>
				</tbody>
			</table>
		</div>
	);
}
