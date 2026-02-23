"use client";

import type React from "react";
import { cn } from "@/lib/utils";

type SurfaceProps = React.ComponentPropsWithoutRef<"div"> & {
	tone?: "default" | "muted" | "brand";
};

export function Surface({ className, tone = "default", ...props }: SurfaceProps) {
	return (
		<div
			{...props}
			className={cn(
				"relative overflow-hidden rounded-2xl ring-1",
				tone === "default" &&
					"bg-white ring-dotori-100 shadow-sm dark:bg-dotori-900 dark:ring-dotori-800 dark:shadow-none",
				tone === "muted" &&
					"bg-dotori-50/90 ring-dotori-100/70 shadow-sm dark:bg-dotori-900/60 dark:ring-dotori-800/60 dark:shadow-none",
				tone === "brand" &&
					"bg-dotori-900 ring-dotori-900 shadow-lg dark:bg-dotori-800 dark:ring-dotori-700 dark:shadow-none",
				className,
			)}
		/>
	);
}
