"use client";

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
						문제가 발생했어요
					</h2>
					<p className="mb-4 text-sm text-dotori-600">
						앱에 오류가 발생했습니다. 다시 시도해주세요.
					</p>
					<button
						onClick={reset}
						className="rounded-full bg-dotori-400 px-6 py-2.5 text-[15px] font-semibold text-white active:scale-[0.97] transition-transform"
					>
						다시 시도
					</button>
				</div>
			</body>
		</html>
	);
}
