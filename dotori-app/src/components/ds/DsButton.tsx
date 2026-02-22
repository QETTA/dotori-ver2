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

type DsButtonProps = React.ComponentProps<typeof Button> & {
	variant?: DsButtonVariant;
	tone?: DsButtonTone;
	fullWidth?: boolean;
};

export function DsButton({
	variant = "primary",
	tone = "dotori",
	fullWidth = false,
	className,
	children,
	...props
}: DsButtonProps) {
	const appearanceProps =
		variant === "primary"
			? { color: DS_BUTTON_PRIMARY_COLOR[tone] }
			: variant === "secondary"
				? { outline: true }
				: { plain: true };

	const mergedClassName = cn(
		"min-h-11",
		fullWidth && "w-full justify-center",
		DS_BUTTON_TONE_CLASS[variant][tone],
		className,
	);

	return (
		<Button
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			{...(appearanceProps as any)}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			{...(props as any)}
			className={mergedClassName}
		>
			{children}
		</Button>
	);
}
