import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const noisePattern = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" width="250" height="250" viewBox="0 0 100 100"><filter id="n"><feTurbulence type="turbulence" baseFrequency="1.4" numOctaves="1" seed="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>'.replace(
		/\s+/g,
		" ",
	),
)}")`;

export function Wallpaper({
	color = "warm",
	children,
	className,
}: {
	color?: "warm" | "green" | "neutral";
	children: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"relative overflow-hidden",
				color === "warm" && "bg-dotori-400 dark:bg-dotori-900",
				color === "green" && "bg-forest-400 dark:bg-forest-900",
				color === "neutral" && "bg-dotori-200 dark:bg-dotori-950",
				className,
			)}
		>
			<div
				className="absolute inset-0 opacity-25 mix-blend-overlay dark:opacity-20"
				style={{ backgroundPosition: "center", backgroundImage: noisePattern }}
			/>
			<div className="relative">{children}</div>
		</div>
	);
}
