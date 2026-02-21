import type { Metadata } from "next";

export const metadata: Metadata = {
	title: {
		absolute: "어린이집 탐색 | 도토리",
	},
	description:
		"전국 20,000+ 어린이집을 검색하세요",
};

export default function ExploreLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
