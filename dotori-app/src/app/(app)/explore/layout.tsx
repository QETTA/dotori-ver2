import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "어린이집 탐색",
	description:
		"내 주변 어린이집을 지도와 목록으로 탐색하세요. 필터로 조건에 맞는 시설을 쉽게 찾을 수 있어요.",
};

export default function ExploreLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
