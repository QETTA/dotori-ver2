"use client";

import { ErrorState } from "@/components/dotori/ErrorState";

export default function AppError({
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="flex min-h-[60dvh] items-center justify-center">
			<ErrorState
				message="문제가 발생했어요. 다시 시도해주세요."
				action={{ label: "다시 시도", onClick: reset }}
			/>
		</div>
	);
}
