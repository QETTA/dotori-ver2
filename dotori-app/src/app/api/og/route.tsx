import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const SITE_NAME = "도토리";
const BRAND_COLOR = "#c8956a";
const DARK_BG = "#2d2418";

/**
 * 동적 OG 이미지 생성 (1200x630)
 * /api/og?title=시설명&desc=설명&type=facility|briefing|default
 */
export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;
	const title = searchParams.get("title") || SITE_NAME;
	const desc =
		searchParams.get("desc") ||
		"AI가 찾아주는 우리 아이 어린이집";
	const type = searchParams.get("type") || "default";

	const bgColor = type === "briefing" ? DARK_BG : "#FDF8F3";
	const textColor = type === "briefing" ? "#FDF8F3" : DARK_BG;
	const accentColor = BRAND_COLOR;

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "center",
					backgroundColor: bgColor,
					padding: "60px 80px",
					fontFamily: "sans-serif",
				}}
			>
				{/* 도토리 심볼 (텍스트 대체) */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "12px",
						marginBottom: "32px",
					}}
				>
					<div
						style={{
							width: "48px",
							height: "48px",
							borderRadius: "50%",
							background: accentColor,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<div
							style={{
								fontSize: "24px",
								color: "white",
								fontWeight: 800,
							}}
						>
							D
						</div>
					</div>
					<div
						style={{
							fontSize: "24px",
							fontWeight: 700,
							color: accentColor,
						}}
					>
						{SITE_NAME}
					</div>
				</div>

				{/* 제목 */}
				<div
					style={{
						fontSize: type === "facility" ? "48px" : "40px",
						fontWeight: 800,
						color: textColor,
						textAlign: "center",
						lineHeight: 1.3,
						maxWidth: "900px",
						overflow: "hidden",
						textOverflow: "ellipsis",
					}}
				>
					{title}
				</div>

				{/* 설명 */}
				<div
					style={{
						fontSize: "24px",
						color:
							type === "briefing"
								? "rgba(253,248,243,0.7)"
								: "rgba(45,36,24,0.6)",
						textAlign: "center",
						marginTop: "16px",
						maxWidth: "800px",
						overflow: "hidden",
						textOverflow: "ellipsis",
					}}
				>
					{desc}
				</div>

				{/* 하단 바 */}
				<div
					style={{
						position: "absolute",
						bottom: 0,
						left: 0,
						right: 0,
						height: "6px",
						background: `linear-gradient(90deg, ${accentColor}, #e8b889)`,
					}}
				/>
			</div>
		),
		{
			width: 1200,
			height: 630,
		},
	);
}
