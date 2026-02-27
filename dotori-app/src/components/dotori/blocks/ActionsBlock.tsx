"use client";

import { memo } from "react";
import { DsButton } from "@/components/ds/DsButton";
import { copy as COPY } from "@/lib/brand-copy";
import { DS_STATUS, DS_TYPOGRAPHY } from '@/lib/design-system/tokens'
import { cn } from "@/lib/utils";
import type { ActionsBlock as ActionsBlockType } from "@/types/dotori";

const ACTION_LABEL_DEFAULTS: Record<string, string> = {
	recommend: COPY.chat.suggestions[0],
	compare: COPY.chat.suggestions[1],
	strategy: COPY.chat.suggestions[2],
	checklist: "입소 체크리스트",
	generate_checklist: "입소 체크리스트",
	report: "리포트 보기",
	generate_report: "리포트 보기",
	explore: "시설 탐색하기",
};

const ACTION_BUTTON_BASE_CLASS = cn(
	DS_TYPOGRAPHY.bodySm,
	'min-h-10 rounded-2xl px-3.5',
	'w-full min-h-11',
);

const ACTION_BUTTON_VARIANT_CLASS = {
	solid: cn('border border-dotori-200/90 bg-dotori-100/80 text-dotori-700 transition-all duration-150 hover:bg-dotori-100 dark:border-dotori-700/80 dark:bg-dotori-900/60 dark:text-dotori-100 dark:hover:bg-dotori-900/80', DS_STATUS.available.border),
	outline: cn('border border-dotori-200/90 bg-white/85 text-dotori-700 transition-all duration-150 hover:bg-dotori-50 dark:border-dotori-700/80 dark:bg-dotori-900/60 dark:text-dotori-100 dark:hover:bg-dotori-900/80', DS_STATUS.waiting.border),
} as const;

function resolveActionLabel(actionId: string, label: string): string {
	const trimmed = label.trim();
	if (trimmed.length > 0) {
		return trimmed;
	}
	return ACTION_LABEL_DEFAULTS[actionId] ?? "다음 단계 보기";
}

export const ActionsBlock = memo(function ActionsBlock({
	block,
	onAction,
}: {
	block: ActionsBlockType;
	onAction?: (actionId: string) => void;
}) {
	if (block.buttons.length === 0) {
		return null;
	}

	return (
		<div className={'mt-2 flex flex-col gap-2'}>
			{block.buttons.map((btn) => {
				const isOutline = btn.variant === "outline";
				const actionLabel = resolveActionLabel(btn.id, btn.label);
				return (
					<DsButton
						key={btn.id}
						variant={isOutline ? "ghost" : "primary"}
						tone="dotori"
						onClick={() => onAction?.(btn.id)}
						className={cn(
							ACTION_BUTTON_BASE_CLASS,
							isOutline
								? ACTION_BUTTON_VARIANT_CLASS.outline
								: ACTION_BUTTON_VARIANT_CLASS.solid,
						)}
					>
						{actionLabel}
					</DsButton>
				);
			})}
		</div>
	);
});
