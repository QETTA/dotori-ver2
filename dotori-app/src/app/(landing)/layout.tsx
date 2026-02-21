import type { Metadata } from "next";

export const metadata: Metadata = {
	title: {
		absolute: "도토리 — 우리 아이 어린이집, 도토리가 찾아드려요",
	},
	description:
		"AI가 분석한 어린이집 추천, 실시간 빈자리 알림, 입소 전략까지. 우리 아이에게 딱 맞는 어린이집을 도토리가 찾아드려요.",
	openGraph: {
		title: "도토리 — 우리 아이 어린이집, 도토리가 찾아드려요",
		description:
			"AI가 분석한 어린이집 추천, 실시간 빈자리 알림, 입소 전략까지. 우리 아이에게 딱 맞는 어린이집을 도토리가 찾아드려요.",
	},
};

export default function LandingLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
