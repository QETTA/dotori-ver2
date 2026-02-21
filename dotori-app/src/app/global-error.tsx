"use client";

export default function GlobalError({
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html lang="ko">
			<body>
				<div
					style={{
						display: "flex",
						minHeight: "100dvh",
						alignItems: "center",
						justifyContent: "center",
						fontFamily: "system-ui, sans-serif",
						padding: "20px",
					}}
				>
					<div style={{ textAlign: "center", maxWidth: "320px" }}>
						<h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>
							문제가 발생했어요
						</h2>
						<p style={{ fontSize: "14px", color: "#888", marginBottom: "16px" }}>
							앱에 오류가 발생했습니다. 다시 시도해주세요.
						</p>
						<button
							onClick={reset}
							style={{
								padding: "10px 24px",
								borderRadius: "24px",
								backgroundColor: "#c8956a",
								color: "white",
								fontSize: "15px",
								fontWeight: 600,
								border: "none",
								cursor: "pointer",
							}}
						>
							다시 시도
						</button>
					</div>
				</div>
			</body>
		</html>
	);
}
