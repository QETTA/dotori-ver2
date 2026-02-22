"use client";

import { memo } from "react";
import Link from "next/link";
import { FacilityCard } from "@/components/dotori/FacilityCard";
import type { FacilityListBlock as FacilityListBlockType } from "@/types/dotori";

export const FacilityListBlock = memo(function FacilityListBlock({
	block,
}: {
	block: FacilityListBlockType;
}) {
	if (block.facilities.length === 0) {
		return (
			<div className="mt-2 rounded-2xl bg-dotori-50/80 p-4 ring-1 ring-dotori-100/70 dark:bg-dotori-900/60 dark:ring-dotori-800/60">
				<p className="text-sm font-medium text-dotori-800 dark:text-dotori-100">
					지금은 보여드릴 시설이 없어요.
				</p>
				<p className="mt-1 text-xs text-dotori-500 dark:text-dotori-300">
					조건을 조금만 바꾸면 결과가 나올 수 있어요.
				</p>
			</div>
		);
	}

	return (
		<div className="mt-2 space-y-3">
			{block.facilities.map((f) => (
				<Link
					key={f.id}
					href={`/facility/${f.id}`}
					className="block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dotori-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-dotori-500/40 dark:focus-visible:ring-offset-dotori-950"
					aria-label={`${f.name} 상세 보기`}
				>
					<FacilityCard facility={f} compact />
				</Link>
			))}
		</div>
	);
});
