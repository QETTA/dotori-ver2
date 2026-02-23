"use client";

import { memo } from "react";
import { Button } from "@/components/catalyst/button";
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
					<Button
						key={btn.id}
						plain={true}
						onClick={() => onAction?.(btn.id)}
						className={actionButtonClass}
					>
						{btn.label}
					</Button>
				) : (
					<Button
						key={btn.id}
						color="dotori"
						onClick={() => onAction?.(btn.id)}
						className={actionButtonClass}
					>
						{btn.label}
					</Button>
				),
			)}
		</div>
	);
});
