import type { Metadata } from "next";

export const metadata: Metadata = {
	title: {
		absolute: "토리 AI 상담 | 도토리",
	},
	description:
		"AI가 우리 아이에게 맞는 어린이집을 찾아드려요",
};

export default function ChatLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
