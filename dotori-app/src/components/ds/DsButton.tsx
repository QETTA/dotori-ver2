"use client";

import type React from "react";
import { Button } from "@/components/catalyst/button";
import {
	DS_BUTTON_PRIMARY_COLOR,
	DS_BUTTON_TONE_CLASS,
	type DsButtonTone,
	type DsButtonVariant,
} from "@/lib/design-system/tokens";
import { cn } from "@/lib/utils";

/** Distributes Omit over union members so the href-based union is preserved. */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
	? Omit<T, K>
	: never;

type CatalystButtonProps = React.ComponentProps<typeof Button>;

type CatalystButtonAppearance =
	| {
			color: CatalystButtonProps extends { color?: infer C } ? C : never;
			outline?: never;
			plain?: never;
	  }
	| { color?: never; outline: true; plain?: never }
	| { color?: never; outline?: never; plain: true };

type DsButtonProps = DistributiveOmit<
	CatalystButtonProps,
	"color" | "outline" | "plain"
> & {
	variant?: DsButtonVariant;
	tone?: DsButtonTone;
	fullWidth?: boolean;
	/** Direct Catalyst color override — prefer using `tone` instead. */
	color?: CatalystButtonAppearance extends { color?: infer C } ? C : never;
};

export function DsButton({
	variant = "primary",
	tone = "dotori",
	fullWidth = false,
	color,
	className,
	children,
	...props
}: DsButtonProps) {
	const appearanceProps: CatalystButtonAppearance = color
		? { color }
		: variant === "primary"
			? { color: DS_BUTTON_PRIMARY_COLOR[tone] }
			: variant === "secondary"
				? { outline: true as const }
				: { plain: true as const };

	const mergedClassName = cn(
		"min-h-11 rounded-xl text-body transition-transform duration-150 active:scale-[0.98] data-focus:!outline-dotori-500",
		fullWidth && "w-full justify-center",
		DS_BUTTON_TONE_CLASS[variant][tone],
		className,
	);

	return (
		<Button
			{...appearanceProps}
			{...props}
			className={mergedClassName}
		>
			{children}
		</Button>
	);
}
