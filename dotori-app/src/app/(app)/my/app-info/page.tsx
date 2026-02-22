"use client";

import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { BRAND } from "@/lib/brand-assets";
import { motion } from "motion/react";
import { stagger } from "@/lib/motion";

export default function AppInfoPage() {
	return (
		<div className="pb-8">
			{/* 헤더 */}
			<header className="glass-header sticky top-0 z-20 flex items-center gap-3 px-5 py-4">
				<Link
					href="/my"
					aria-label="뒤로 가기"
					className="rounded-full p-2.5 transition-all active:scale-[0.97] hover:bg-dotori-50 dark:hover:bg-dotori-900"
				>
					<ArrowLeftIcon className="h-5 w-5" />
				</Link>
				<h1 className="text-lg font-bold">앱 정보</h1>
			</header>

			<motion.div {...stagger.container} className="px-5 pt-2">
				{/* 앱 아이콘 + 버전 */}
				<motion.div
					{...stagger.item}
					className="rounded-3xl bg-white dark:bg-dotori-950 p-5 shadow-sm dark:shadow-none"
				>
					<div className="flex flex-col items-center py-4">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={BRAND.appIconWarm}
							alt="도토리 앱 아이콘"
							className="h-20 w-20 rounded-[22px] shadow-md dark:shadow-none"
						/>
						<h2 className="mt-4 text-lg font-bold text-dotori-900 dark:text-dotori-50">
							도토리
						</h2>
						<p className="mt-1 text-sm text-dotori-500 dark:text-dotori-300">
							AI 어린이집 입소 전략 서비스
						</p>
						<div className="mt-4 flex gap-4">
							<div className="text-center">
								<span className="block text-sm text-dotori-500 dark:text-dotori-300">
									버전
								</span>
								<span className="text-base font-semibold text-dotori-900 dark:text-dotori-50">
									1.0.0
								</span>
							</div>
							<div className="h-8 w-px bg-dotori-100 dark:bg-dotori-800" />
							<div className="text-center">
								<span className="block text-sm text-dotori-500 dark:text-dotori-300">
									빌드
								</span>
								<span className="text-base font-semibold text-dotori-900 dark:text-dotori-50">
									2026.02.20
								</span>
							</div>
						</div>
					</div>
				</motion.div>

				{/* 오픈소스 라이선스 */}
				<motion.div
					{...stagger.item}
					className="mt-3 rounded-3xl bg-white dark:bg-dotori-950 p-5 shadow-sm dark:shadow-none"
				>
					<h3 className="text-base font-semibold text-dotori-900 dark:text-dotori-50">
						오픈소스 라이선스
					</h3>
					<p className="mt-2 text-sm leading-relaxed text-dotori-500 dark:text-dotori-300">
						이 앱은 다양한 오픈소스 소프트웨어를 사용하고 있습니다.
						각 라이브러리의 라이선스 정보는 추후 업데이트될
						예정입니다.
					</p>
				</motion.div>

				{/* 푸터 */}
				<motion.p
					{...stagger.item}
					className="mt-6 text-center text-xs text-dotori-300 dark:text-dotori-600"
				>
					&copy; 2026 도토리. All rights reserved.
				</motion.p>
			</motion.div>
		</div>
	);
}
