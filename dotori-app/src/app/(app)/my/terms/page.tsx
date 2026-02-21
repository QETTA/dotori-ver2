"use client";

import { useState } from "react";
import { ArrowLeftIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { cn } from "@/lib/utils";

const termsSections = [
	{
		id: 1,
		title: "서비스 이용약관",
		summary:
			"도토리 서비스의 이용 조건, 회원의 권리와 의무, 서비스 제공 범위 등에 관한 사항을 규정합니다.",
		detail:
			"제1조 (목적) 이 약관은 도토리(이하 '서비스')가 제공하는 어린이집 탐색 및 입소 지원 서비스의 이용 조건 및 절차, 회원과 서비스 간의 권리·의무 및 기타 필요한 사항을 규정함을 목적으로 합니다.\n\n제2조 (정의) '회원'이란 서비스에 가입하여 이용계약을 체결한 자를 말합니다. '콘텐츠'란 서비스가 제공하는 어린이집 정보, AI 분석 결과, 커뮤니티 게시물 등을 말합니다.\n\n제3조 (서비스 제공) 서비스는 어린이집 검색, 비교, 입소 대기 신청 지원, AI 상담 등의 기능을 제공합니다. 서비스 내용은 사전 고지 후 변경될 수 있습니다.",
	},
	{
		id: 2,
		title: "개인정보처리방침",
		summary:
			"수집하는 개인정보 항목, 이용 목적, 보유 기간 및 파기 절차 등 개인정보 보호에 관한 사항을 안내합니다.",
		detail:
			"1. 수집하는 개인정보 항목: 이름, 이메일, 카카오 계정 정보, 자녀 정보(이름, 생년월, 성별), 거주 지역, 위치 정보\n\n2. 수집 목적: 맞춤형 어린이집 추천, 입소 대기 알림, 커뮤니티 서비스 제공\n\n3. 보유 기간: 회원 탈퇴 시 즉시 파기. 단, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보존합니다.\n\n4. 파기 절차: 전자적 파일은 복구 불가능한 방법으로, 종이 문서는 분쇄 또는 소각하여 파기합니다.",
	},
	{
		id: 3,
		title: "위치기반서비스 이용약관",
		summary:
			"주변 어린이집 탐색 등 위치 정보를 활용한 서비스 제공에 관한 사항을 규정합니다.",
		detail:
			"제1조 (목적) 이 약관은 도토리가 제공하는 위치기반서비스의 이용 조건을 규정합니다.\n\n제2조 (서비스 내용) 사용자의 현재 위치를 기반으로 주변 어린이집을 탐색하고, 거리순 정렬 및 지도 표시 기능을 제공합니다.\n\n제3조 (위치 정보의 보호) 위치 정보는 서비스 제공 목적으로만 사용되며, 별도 저장하지 않습니다. 사용자는 기기 설정에서 위치 정보 제공을 거부할 수 있습니다.",
	},
];

export default function TermsPage() {
	const [expanded, setExpanded] = useState<number | null>(null);

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
				<h1 className="text-[17px] font-bold">이용약관</h1>
			</header>

			<div className="space-y-3 px-5 pt-2">
				{termsSections.map((section, index) => (
					<div
						key={section.id}
						className="rounded-3xl bg-white p-5 shadow-sm motion-safe:animate-in motion-safe:fade-in duration-300"
						style={{
							animationDelay: `${index * 50}ms`,
							animationFillMode: "both",
						}}
					>
						<h3 className="text-[15px] font-semibold text-dotori-900">
							{section.title}
						</h3>
						<p className="mt-2 text-[14px] leading-relaxed text-dotori-500">
							{section.summary}
						</p>
						<button
							type="button"
							onClick={() =>
								setExpanded(expanded === section.id ? null : section.id)
							}
							className="mt-3 flex items-center gap-1 text-[14px] font-medium text-dotori-500 transition-colors hover:text-dotori-600"
						>
							{expanded === section.id ? "접기" : "전문 보기"}
							<ChevronDownIcon
								className={cn(
									"h-4 w-4 transition-transform duration-200",
									expanded === section.id && "rotate-180",
								)}
							/>
						</button>
						{expanded === section.id && (
							<div className="mt-3 whitespace-pre-line border-t border-dotori-100 pt-3 text-[13px] leading-relaxed text-dotori-600">
								{section.detail}
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
