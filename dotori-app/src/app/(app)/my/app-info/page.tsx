"use client";

import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { BRAND } from "@/lib/brand-assets";

export default function AppInfoPage() {
	return (
		<div className="pb-8">
			{/* 헤더 */}
			<header className="sticky top-0 z-20 flex items-center gap-3 bg-white/80 px-5 py-4 backdrop-blur-xl">
				<Link
					href="/my"
					aria-label="뒤로 가기"
					className="rounded-full p-2.5 transition-all active:scale-[0.97] hover:bg-dotori-50"
				>
					<ArrowLeftIcon className="h-5 w-5" />
				</Link>
				<h1 className="text-[17px] font-bold">앱 정보</h1>
			</header>

			<div className="px-5 pt-2">
				{/* 앱 아이콘 + 버전 */}
				<div className="rounded-3xl bg-white p-5 shadow-sm motion-safe:animate-in motion-safe:fade-in duration-300">
					<div className="flex flex-col items-center py-4">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={BRAND.appIconWarm}
							alt="도토리 앱 아이콘"
							className="h-20 w-20 rounded-[22px] shadow-md"
						/>
						<h2 className="mt-4 text-[18px] font-bold text-dotori-900">
							도토리
						</h2>
						<p className="mt-1 text-[14px] text-dotori-500">
							AI 어린이집 입소 전략 서비스
						</p>
						<div className="mt-4 flex gap-4">
							<div className="text-center">
								<span className="block text-[13px] text-dotori-400">
									버전
								</span>
								<span className="text-[15px] font-semibold text-dotori-900">
									1.0.0
								</span>
							</div>
							<div className="h-8 w-px bg-dotori-100" />
							<div className="text-center">
								<span className="block text-[13px] text-dotori-400">
									빌드
								</span>
								<span className="text-[15px] font-semibold text-dotori-900">
									2026.02.20
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* 오픈소스 라이선스 */}
				<div className="mt-3 rounded-3xl bg-white p-5 shadow-sm motion-safe:animate-in motion-safe:fade-in duration-300" style={{ animationDelay: "50ms", animationFillMode: "both" }}>
					<h3 className="text-[15px] font-semibold text-dotori-900">
						오픈소스 라이선스
					</h3>
					<p className="mt-2 text-[14px] leading-relaxed text-dotori-500">
						이 앱은 다양한 오픈소스 소프트웨어를 사용하고 있습니다.
						각 라이브러리의 라이선스 정보는 추후 업데이트될
						예정입니다.
					</p>
				</div>

				{/* 푸터 */}
				<p className="mt-6 text-center text-[12px] text-dotori-300">
					&copy; 2026 도토리. All rights reserved.
				</p>
			</div>
		</div>
	);
}
