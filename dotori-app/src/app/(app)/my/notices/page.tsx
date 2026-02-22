"use client";

import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { motion } from "motion/react";
import { stagger } from "@/lib/motion";

const notices = [
	{
		id: 1,
		title: "도토리 v1.0 출시",
		date: "2026-02-20",
		body: "도토리 서비스가 정식 출시되었습니다. AI 기반 어린이집 입소 전략 서비스를 지금 바로 이용해보세요.",
	},
	{
		id: 2,
		title: "2026년 3월 입소 신청 안내",
		date: "2026-02-15",
		body: "2026년 3월 어린이집 입소 신청이 시작됩니다. 관심 시설의 TO 현황을 확인하고 미리 준비하세요.",
	},
	{
		id: 3,
		title: "서비스 이용약관 개정 안내",
		date: "2026-02-10",
		body: "개인정보처리방침 및 서비스 이용약관이 일부 개정되었습니다. 주요 변경 사항을 확인해주세요.",
	},
];

export default function NoticesPage() {
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
				<h1 className="text-lg font-bold">공지사항</h1>
			</header>

			<motion.ul {...stagger.container} className="space-y-3 px-5 pt-2">
				{notices.map((notice) => (
					<motion.li key={notice.id} {...stagger.item}>
						<div className="rounded-3xl bg-white dark:bg-dotori-950 p-5 shadow-sm dark:shadow-none">
							<div className="flex items-center justify-between">
								<h3 className="text-base font-semibold text-dotori-900 dark:text-dotori-50">
									{notice.title}
								</h3>
								<span className="shrink-0 text-xs text-dotori-500 dark:text-dotori-300">
									{notice.date}
								</span>
							</div>
							<p className="mt-2 text-sm leading-relaxed text-dotori-500 dark:text-dotori-300">
								{notice.body}
							</p>
						</div>
					</motion.li>
				))}
			</motion.ul>
		</div>
	);
}
