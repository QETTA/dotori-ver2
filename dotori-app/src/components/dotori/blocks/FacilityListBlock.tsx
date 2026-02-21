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
	return (
		<div className="mt-2 space-y-2">
			{block.facilities.map((f) => (
				<Link key={f.id} href={`/facility/${f.id}`}>
					<FacilityCard facility={f} compact />
				</Link>
			))}
		</div>
	);
});
