import type { Metadata } from "next";

export const metadata: Metadata = {
	title: {
		absolute: "이웃 커뮤니티 | 도토리",
	},
	description:
		"어린이집 정보를 이웃과 나눠요",
};

export default function CommunityLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
