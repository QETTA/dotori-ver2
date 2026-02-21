import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "로그인",
	description: "도토리에 로그인하고 우리 아이 어린이집을 찾아보세요.",
};

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<main className="relative mx-auto flex min-h-dvh max-w-md flex-col bg-dotori-50 px-6 pt-[22vh]">
			{children}
		</main>
	);
}
