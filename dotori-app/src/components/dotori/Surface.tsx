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
				"relative overflow-hidden rounded-3xl ring-1 backdrop-blur-xl",
				tone === "default" && "bg-white/85 ring-dotori-100 shadow-md",
				tone === "muted" && "bg-dotori-50/80 ring-dotori-100/70 shadow-sm",
				tone === "brand" && "bg-dotori-900 ring-dotori-900 shadow-lg",
				className,
			)}
		/>
	);
}

