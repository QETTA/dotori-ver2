import type { ReactNode } from "react";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/catalyst/button";
import { Text, Strong } from "@/components/catalyst/text";

interface PremiumGateProps {
	feature: string;
	description: string;
	children: ReactNode;
	isPremium: boolean;
}

export function PremiumGate({ feature, description, children, isPremium }: PremiumGateProps) {
	if (isPremium) {
		return <>{children}</>;
	}

	return (
		<div className="relative">
			<div className="pointer-events-none select-none">{children}</div>
			<div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/85 px-4 text-center backdrop-blur-sm dark:bg-dotori-950/85">
				<div className="rounded-full bg-dotori-100 p-3 text-dotori-600 dark:bg-dotori-800 dark:text-dotori-200">
					<LockClosedIcon className="h-6 w-6" />
				</div>
				<div>
					<Strong className="text-dotori-900 dark:text-dotori-50">{feature}</Strong>
					<Text className="text-dotori-600 dark:text-dotori-300">{description}</Text>
				</div>
				<Button color="dotori" href="/my/settings">
					프리미엄으로 업그레이드
				</Button>
			</div>
		</div>
	);
}
