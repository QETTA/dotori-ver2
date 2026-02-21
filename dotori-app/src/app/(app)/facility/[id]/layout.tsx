import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "어린이집 상세정보",
	description:
		"어린이집 상세 정보, 평가 등급, 입소 확률, 빈자리 현황을 확인하세요.",
};

export default function FacilityDetailLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
