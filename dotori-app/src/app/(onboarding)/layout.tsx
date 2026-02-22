import type { Metadata } from "next";
import { AppProvider } from "@/hooks/use-app-state";

export const metadata: Metadata = {
	title: "프로필 설정",
	description: "도토리 프로필을 설정하고 맞춤 어린이집 추천을 받아보세요.",
};

export default function OnboardingLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<AppProvider>
			<main className="mx-auto min-h-dvh max-w-md bg-dotori-50 text-dotori-900 dark:bg-dotori-900 dark:text-dotori-50">
				{children}
			</main>
		</AppProvider>
	);
}
