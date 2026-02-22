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
				color === "warm" &&
					"bg-gradient-to-br from-dotori-200 via-dotori-300 to-dotori-400 dark:from-dotori-950 dark:via-dotori-950 dark:to-dotori-900",
				color === "green" &&
					"bg-gradient-to-br from-forest-200 via-forest-300 to-forest-400 dark:from-forest-900 dark:via-forest-900 dark:to-forest-900",
				color === "neutral" &&
					"bg-gradient-to-br from-dotori-100 via-dotori-200 to-dotori-300 dark:from-dotori-950 dark:via-dotori-950 dark:to-dotori-900",
				className,
			)}
		>
			<div
				className="absolute inset-0 opacity-20 mix-blend-overlay dark:opacity-15"
				style={{ backgroundPosition: "center", backgroundImage: noisePattern }}
			/>
			<div className="relative">{children}</div>
		</div>
	);
}
