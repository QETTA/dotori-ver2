import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { WebVitalsReporter } from "@/components/shared/WebVitalsReporter";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
	subsets: ["latin"],
	weight: ["400", "600", "700", "800"],
	variable: "--font-wordmark",
	display: "swap",
});

const SITE_URL =
	process.env.NEXT_PUBLIC_SITE_URL || "https://dotori.app";
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const organizationSchema = {
	"@context": "https://schema.org",
	"@type": "Organization",
	name: "도토리",
	url: SITE_URL,
	description:
		"AI가 추천해주는 어린이집 검색, 실시간 빈자리 알림, 입소 대기 관리 플랫폼입니다.",
	logo: `${SITE_URL}/brand/dotori-favicon.svg`,
};

export const metadata: Metadata = {
	title: {
		default: "도토리 — 우리 아이 어린이집 찾기",
		template: "%s | 도토리",
	},
	description:
		"AI가 분석한 어린이집 추천, 실시간 빈자리 알림, 입소 전략까지. 도토리가 우리 아이 어린이집을 찾아드려요.",
	keywords: [
		"어린이집",
		"도토리",
		"유치원",
		"보육시설",
		"입소신청",
		"대기순번",
		"빈자리알림",
	],
	authors: [{ name: "도토리" }],
	icons: { icon: "/brand/dotori-favicon.svg" },
	openGraph: {
		type: "website",
		locale: "ko_KR",
		siteName: "도토리",
		url: SITE_URL,
		title: "도토리 — 우리 아이 어린이집 찾기",
		description:
			"AI가 분석한 어린이집 추천, 실시간 빈자리 알림, 입소 전략까지",
		images: [
			{
				url: `${SITE_URL}/api/og?title=${encodeURIComponent("도토리")}&desc=${encodeURIComponent("우리 아이 어린이집, 도토리가 찾아드려요")}`,
				width: 1200,
				height: 630,
				alt: "도토리 — 우리 아이 어린이집 찾기",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "도토리 — 우리 아이 어린이집 찾기",
		description:
			"AI가 분석한 어린이집 추천, 실시간 빈자리 알림, 입소 전략까지",
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
		<html lang="ko" className={plusJakarta.variable}>
			<head>
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
			<body className="bg-white text-dotori-900 antialiased">
				<WebVitalsReporter />
				{children}
				{/* 카카오 JavaScript SDK */}
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
							(function check(){
								if(window.Kakao&&!window.Kakao.isInitialized()){
									window.Kakao.init("${process.env.NEXT_PUBLIC_KAKAO_JS_KEY || ""}");
								}else if(!window.Kakao){
									setTimeout(check,200);
								}
							})();
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
