"use client";

import { memo } from "react";
import { DsButton } from "@/components/ds/DsButton";
import type { ActionsBlock as ActionsBlockType } from "@/types/dotori";

export const ActionsBlock = memo(function ActionsBlock({
	block,
	onAction,
}: {
	block: ActionsBlockType;
	onAction?: (actionId: string) => void;
}) {
	const actionButtonClass = "w-full min-h-11";

	return (
		<div className="mt-2 flex flex-col gap-2">
			{block.buttons.map((btn) =>
				btn.variant === "outline" ? (
					<DsButton
						key={btn.id}
					 variant="ghost"
						onClick={() => onAction?.(btn.id)}
						className={actionButtonClass}
					>
						{btn.label}
					</DsButton>
				) : (
					<DsButton
						key={btn.id}
					
						onClick={() => onAction?.(btn.id)}
						className={actionButtonClass}
					>
						{btn.label}
					</DsButton>
				),
			)}
		</div>
	);
});
