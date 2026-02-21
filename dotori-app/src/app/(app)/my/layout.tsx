import type { Metadata } from "next";

export const metadata: Metadata = {
	title: {
		absolute: "마이페이지 | 도토리",
	},
	description:
		"내 프로필, 관심 시설, 대기 현황, 알림 설정을 관리하세요.",
};

export default function MyLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
