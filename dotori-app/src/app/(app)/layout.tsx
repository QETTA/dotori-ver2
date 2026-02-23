import type { Metadata } from "next";
import Image from "next/image";
import { BottomTabBar } from "@/components/dotori/BottomTabBar";
import { PageTransition } from "@/components/dotori/PageTransition";
import { SplashScreen } from "@/components/dotori/SplashScreen";
import { ToastProvider } from "@/components/dotori/ToastProvider";
import { AuthProvider } from "@/components/shared/AuthProvider";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { AppProvider } from "@/hooks/use-app-state";
import { BRAND } from "@/lib/brand-assets";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "홈",
	description:
		"우리 아이 어린이집, 도토리가 찾아드려요. AI 분석 추천과 실시간 빈자리 알림.",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<AuthProvider>
			<SplashScreen />
			<AppProvider>
				<ToastProvider>
					<ErrorBoundary>
						<main
							id="app-main-content"
							tabIndex={-1}
							className="relative mx-auto min-h-dvh max-w-md overflow-x-hidden bg-gradient-to-b from-dotori-50 via-white to-dotori-50 pb-32"
						>
							{/* Background accents: subtle, brand-safe, mobile-first */}
							<div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
								<div className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-dotori-200/35 blur-3xl" />
								<div className="absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-forest-200/20 blur-3xl" />
								<Image
									src={BRAND.watermark}
									alt=""
									width={192}
									height={192}
									loading="eager"
									priority
									aria-hidden="true"
									className="absolute -right-16 top-8 h-48 w-48 opacity-10"
								/>
							</div>
							<PageTransition className="relative">{children}</PageTransition>
						</main>
					</ErrorBoundary>
				</ToastProvider>
				<BottomTabBar />
			</AppProvider>
		</AuthProvider>
	);
}
