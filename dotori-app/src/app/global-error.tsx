"use client";

import { copy } from "@/lib/brand-copy";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html lang="ko">
			<body className="flex min-h-dvh items-center justify-center bg-dotori-50 p-5 font-sans text-dotori-900 dark:bg-dotori-950 dark:text-dotori-50">
				<div className="mx-auto max-w-80 text-center">
					{/* Inline error icon — Catalyst unavailable in global-error */}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
						className="mx-auto mb-4 h-12 w-12 text-dotori-400"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
						/>
					</svg>
					<h2 className="mb-2 text-lg font-semibold">
						{copy.global.error.title}
					</h2>
					<p className="mb-4 text-sm text-dotori-600 dark:text-dotori-400">
						{copy.global.error.description}
					</p>
					{error.digest && (
						<p className="mb-4 font-mono text-xs text-dotori-400 dark:text-dotori-500">
							오류 코드: {error.digest}
						</p>
					)}
					<button
						onClick={reset}
						className="min-h-11 rounded-full bg-dotori-500 px-6 py-2.5 text-sm font-semibold text-white transition-transform active:scale-[0.97]"
					>
						{copy.global.error.retry}
					</button>
				</div>
			</body>
		</html>
	);
}
