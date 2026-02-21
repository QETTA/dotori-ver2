"use client";

import {
	ArrowLeftIcon,
	ChatBubbleLeftRightIcon,
	EnvelopeIcon,
	PhoneIcon,
	QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function SupportPage() {
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
				<h1 className="text-[17px] font-bold">고객센터</h1>
			</header>

			<div className="space-y-3 px-5 pt-2">
				{/* 연락처 */}
				<div className="rounded-3xl bg-white p-5 shadow-sm motion-safe:animate-in motion-safe:fade-in duration-300">
					<h3 className="text-[15px] font-semibold text-dotori-900">
						연락처
					</h3>
					<div className="mt-3 space-y-3">
						<div className="flex items-center gap-3">
							<div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-dotori-50">
								<EnvelopeIcon className="h-5 w-5 text-dotori-500" />
							</div>
							<div>
								<span className="block text-[13px] text-dotori-400">
									이메일
								</span>
								<span className="text-[15px] font-medium text-dotori-900">
									help@dotori.app
								</span>
							</div>
						</div>
						<div className="flex items-center gap-3">
							<div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-dotori-50">
								<PhoneIcon className="h-5 w-5 text-dotori-500" />
							</div>
							<div>
								<span className="block text-[13px] text-dotori-400">
									전화
								</span>
								<span className="text-[15px] font-medium text-dotori-900">
									02-1234-5678
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* 자주 묻는 질문 */}
				<Link
					href="/landing#faq"
					className={cn(
						"flex items-center gap-3.5 rounded-3xl bg-white p-5 shadow-sm transition-all",
						"active:scale-[0.99] hover:shadow-md",
						"motion-safe:animate-in motion-safe:fade-in duration-300",
					)}
					style={{ animationDelay: "50ms", animationFillMode: "both" }}
				>
					<div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-dotori-50">
						<QuestionMarkCircleIcon className="h-5 w-5 text-dotori-500" />
					</div>
					<div className="min-w-0 flex-1">
						<h3 className="text-[15px] font-semibold text-dotori-900">
							자주 묻는 질문
						</h3>
						<p className="mt-0.5 text-[13px] text-dotori-400">
							FAQ에서 궁금한 점을 확인해보세요
						</p>
					</div>
				</Link>

				{/* 1:1 문의하기 */}
				<Link
					href="/chat?prompt=고객센터를 통해 문의드립니다."
					className={cn(
						"flex items-center justify-center gap-2 rounded-3xl bg-dotori-900 p-5 shadow-sm transition-all",
						"active:scale-[0.98] hover:bg-dotori-800",
						"motion-safe:animate-in motion-safe:fade-in duration-300",
					)}
					style={{ animationDelay: "100ms", animationFillMode: "both" }}
				>
					<ChatBubbleLeftRightIcon className="h-5 w-5 text-white" />
					<span className="text-[16px] font-semibold text-white">
						1:1 문의하기
					</span>
				</Link>
			</div>
		</div>
	);
}
