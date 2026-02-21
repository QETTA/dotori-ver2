import type { Metadata } from "next";
import { BottomTabBar } from "@/components/dotori/BottomTabBar";
import { PageTransition } from "@/components/dotori/PageTransition";
import { SplashScreen } from "@/components/dotori/SplashScreen";
import { ToastProvider } from "@/components/dotori/ToastProvider";
import { AuthProvider } from "@/components/shared/AuthProvider";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { AppProvider } from "@/hooks/use-app-state";

export const metadata: Metadata = {
	title: "홈",
	description:
		"우리 아이 어린이집, 도토리가 찾아드려요. AI 분석 추천과 실시간 빈자리 알림.",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<AuthProvider>
			<AppProvider>
				<ToastProvider>
					<SplashScreen />
					<ErrorBoundary>
						<main className="mx-auto min-h-dvh max-w-md bg-dotori-50 pb-32">
							<PageTransition>{children}</PageTransition>
						</main>
					</ErrorBoundary>
					<BottomTabBar />
				</ToastProvider>
			</AppProvider>
		</AuthProvider>
	);
}
