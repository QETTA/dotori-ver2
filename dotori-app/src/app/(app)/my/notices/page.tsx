"use client";

import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

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
			<header className="sticky top-0 z-20 flex items-center gap-3 bg-white/80 px-5 py-4 backdrop-blur-xl">
				<Link
					href="/my"
					aria-label="뒤로 가기"
					className="rounded-full p-2.5 transition-all active:scale-[0.97] hover:bg-dotori-50"
				>
					<ArrowLeftIcon className="h-5 w-5" />
				</Link>
				<h1 className="text-[17px] font-bold">공지사항</h1>
			</header>

			<div className="space-y-3 px-5 pt-2">
				{notices.map((notice, index) => (
					<div
						key={notice.id}
						className="rounded-3xl bg-white p-5 shadow-sm motion-safe:animate-in motion-safe:fade-in duration-300"
						style={{
							animationDelay: `${index * 50}ms`,
							animationFillMode: "both",
						}}
					>
						<div className="flex items-center justify-between">
							<h3 className="text-[15px] font-semibold text-dotori-900">
								{notice.title}
							</h3>
							<span className="shrink-0 text-[12px] text-dotori-500">
								{notice.date}
							</span>
						</div>
						<p className="mt-2 text-[14px] leading-relaxed text-dotori-500">
							{notice.body}
						</p>
					</div>
				))}
			</div>
		</div>
	);
}
