import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "커뮤니티",
	description:
		"다른 부모님들과 어린이집 정보를 나누고, 입소 경험과 팁을 공유하세요.",
};

export default function CommunityLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
