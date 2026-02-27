import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { WebVitalsReporter } from "@/components/shared/WebVitalsReporter";
import "./globals.css";

const SITE_URL =
	process.env.NEXT_PUBLIC_SITE_URL || "https://dotori.app";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const organizationSchema = {
	"@context": "https://schema.org",
	"@type": "Organization",
	name: "도토리",
	url: SITE_URL,
	description:
		"어린이집·유치원 탐색 플랫폼. 반편성 불만·교사 교체·빈자리 탐색을 AI로 해결합니다.",
	logo: `${SITE_URL}/brand/dotori-favicon.svg`,
};

	export const metadata: Metadata = {
	title: {
		default: "도토리 — 어린이집·유치원 탐색 AI",
		template: "%s | 도토리 — 어린이집·유치원 탐색 AI",
	},
	description:
		"어린이집·유치원 이동 고민? 도토리 AI가 해결해드려요",
	keywords: [
		"어린이집이동",
		"어린이집변경",
		"반편성",
		"도토리",
		"어린이집",
		"유치원",
		"유치원이동",
		"유치원탐색",
		"영유아시설",
		"빈자리알림",
		"어린이집교체",
		"유치원변경",
		"유치원교체",
		"유보통합",
		"보육시설",
		"국공립어린이집",
	],
	authors: [{ name: "도토리" }],
	icons: { icon: "/brand/dotori-favicon.svg" },
	openGraph: {
		type: "website",
		locale: "ko_KR",
		siteName: "도토리",
		url: SITE_URL,
		title: "도토리 — 우리 아이 어린이집·유치원, 도토리가 찾아드려요",
		description:
			"반편성 불만·교사 교체·빈자리 탐색. AI 토리가 이동 상담해드려요.",
		images: [
			{
				url: `${SITE_URL}/api/og?title=${encodeURIComponent("도토리")}&desc=${encodeURIComponent("우리 아이 어린이집·유치원, 도토리가 찾아드려요")}`,
				width: 1200,
				height: 630,
				alt: "도토리 — 우리 아이 어린이집·유치원 찾기",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "도토리 — 우리 아이 어린이집·유치원 찾기",
		description:
			"AI가 분석한 어린이집·유치원 추천, 실시간 빈자리 알림, 입소 전략까지",
	},
	robots: {
		index: true,
		follow: true,
	},
	alternates: {
		canonical: SITE_URL,
	},
	manifest: "/manifest.json",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "도토리",
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	viewportFit: "cover",
	themeColor: "#c8956a",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html
			lang="ko"
			data-scroll-behavior="smooth"
			suppressHydrationWarning
		>
			<head>
				<script
					dangerouslySetInnerHTML={{
						__html: `(function(){try{var t=localStorage.getItem("dotori-theme");var r=t==="dark"?t:"light";if(r==="dark"){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){}})()`,
					}}
				/>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link
					rel="stylesheet"
					href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
				/>
				<link
					rel="stylesheet"
					crossOrigin="anonymous"
					href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
				/>
				<Script
					id="organization-schema"
					type="application/ld+json"
					strategy="beforeInteractive"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
				/>
			</head>
			<body className={'bg-dotori-50 text-dotori-900 antialiased transition-colors duration-200 dark:bg-dotori-950 dark:text-dotori-50'}>
				{/* Skip to content — a11y (Wave 9) */}
				<a
					href="#main-content"
					className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-dotori-500 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg"
				>
					본문으로 건너뛰기
				</a>
				<WebVitalsReporter />
				{children}
				{/* Kakao JS SDK (Channel, Share) */}
				<Script
					src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
					crossOrigin="anonymous"
					strategy="afterInteractive"
				/>
				<Script
					id="kakao-init"
					strategy="afterInteractive"
					dangerouslySetInnerHTML={{
						__html: `
							if(window.Kakao && !window.Kakao.isInitialized()){
								window.Kakao.init('${process.env.NEXT_PUBLIC_KAKAO_JS_KEY || process.env.NEXT_PUBLIC_KAKAO_KEY || ""}');
							}
						`,
					}}
				/>
				{/* GA4 (Google Analytics) */}
				{GA_ID && (
					<>
						<Script
							src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
							strategy="afterInteractive"
						/>
						<Script
							id="gtag-init"
							strategy="afterInteractive"
							dangerouslySetInnerHTML={{
								__html: `
									window.dataLayer=window.dataLayer||[];
									function gtag(){dataLayer.push(arguments);}
									gtag('js',new Date());
									gtag('config','${GA_ID}');
								`,
							}}
						/>
					</>
				)}
			</body>
		</html>
	);
}
