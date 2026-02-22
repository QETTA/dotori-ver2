"use client";

import Link from "next/link";

export default function AuthError({
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="flex min-h-dvh items-center justify-center px-5">
			<div className="text-center">
				<h2 className="text-lg font-semibold text-dotori-900">
					로그인 중 문제가 발생했어요
				</h2>
				<p className="mt-2 text-sm text-dotori-500">
					잠시 후 다시 시도해주세요
				</p>
				<div className="mt-4 flex items-center justify-center gap-3">
					<button
						onClick={reset}
						className="rounded-full bg-dotori-400 px-5 py-2.5 text-sm font-bold text-white hover:bg-dotori-600"
					>
						다시 시도
					</button>
					<Link
						href="/"
						className="rounded-full bg-dotori-100 px-5 py-2.5 text-sm font-bold text-dotori-700 hover:bg-dotori-200"
					>
						홈으로
					</Link>
				</div>
			</div>
		</div>
	);
}
