import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "토리챗",
	description:
		"AI 토리에게 어린이집 입소 전략, 서류 준비, 대기 순번 등 궁금한 점을 물어보세요.",
};

export default function ChatLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
