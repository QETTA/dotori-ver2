"use client";

import { ErrorState } from "@/components/dotori/ErrorState";
import { copy } from "@/lib/brand-copy";

export default function AppError({
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="flex min-h-[60dvh] items-center justify-center">
			<ErrorState
				message={copy.global.error.description}
				action={{ label: copy.global.error.retry, onClick: reset }}
			/>
		</div>
	);
}
