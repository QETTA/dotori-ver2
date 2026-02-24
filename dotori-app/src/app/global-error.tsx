"use client";

import { copy } from "@/lib/brand-copy";

export default function GlobalError({
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html lang="ko">
			<body className="flex min-h-dvh items-center justify-center bg-dotori-50 p-5 font-sans text-dotori-900">
				<div className="text-center" style={{ maxWidth: "320px" }}>
					<h2 className="mb-2 text-lg font-semibold">
						{copy.global.error.title}
					</h2>
					<p className="mb-4 text-sm text-dotori-600">
						{copy.global.error.description}
					</p>
					<button
						onClick={reset}
						className="rounded-full bg-dotori-500 px-6 py-2.5 text-base font-semibold text-white active:scale-[0.97] transition-transform"
					>
						{copy.global.error.retry}
					</button>
				</div>
			</body>
		</html>
	);
}
