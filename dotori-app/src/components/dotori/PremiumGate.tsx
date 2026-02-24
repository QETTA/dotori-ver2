import type { ReactNode } from "react";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import { DsButton } from "@/components/ds/DsButton";
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
			<div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 px-4 backdrop-blur-sm dark:bg-dotori-950/80">
				<div className="w-full max-w-xs rounded-2xl bg-dotori-50 p-6 text-center shadow-sm dark:bg-dotori-900">
					<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-dotori-100 text-dotori-600 dark:bg-dotori-800 dark:text-dotori-200">
						<LockClosedIcon className="h-7 w-7" />
					</div>
					<div className="mt-4 space-y-2">
						<Strong className="block text-h3 text-dotori-900 dark:text-dotori-50">{feature}</Strong>
						<Text className="text-body-sm text-dotori-700 dark:text-dotori-200">{description}</Text>
					</div>
					<DsButton href="/my/settings" className="mt-4 min-h-11 w-full">
						프리미엄으로 업그레이드
					</DsButton>
				</div>
			</div>
		</div>
	);
}
