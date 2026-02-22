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
import { motion } from "motion/react";
import { stagger } from "@/lib/motion";

export default function SupportPage() {
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
				<h1 className="text-lg font-bold">고객센터</h1>
			</header>

			<motion.ul {...stagger.container} className="space-y-3 px-5 pt-2">
				{/* 연락처 */}
				<motion.li {...stagger.item}>
					<div className="rounded-3xl bg-white dark:bg-dotori-950 p-5 shadow-sm dark:shadow-none">
						<h3 className="text-base font-semibold text-dotori-900 dark:text-dotori-50">
							연락처
						</h3>
						<div className="mt-3 space-y-3">
							<div className="flex items-center gap-3">
								<div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-dotori-50 dark:bg-dotori-900">
									<EnvelopeIcon className="h-5 w-5 text-dotori-500" />
								</div>
								<div>
									<span className="block text-sm text-dotori-500 dark:text-dotori-300">
										이메일
									</span>
									<span className="text-base font-medium text-dotori-900 dark:text-dotori-50">
										help@dotori.app
									</span>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-dotori-50 dark:bg-dotori-900">
									<PhoneIcon className="h-5 w-5 text-dotori-500" />
								</div>
								<div>
									<span className="block text-sm text-dotori-500 dark:text-dotori-300">
										전화
									</span>
									<span className="text-base font-medium text-dotori-900 dark:text-dotori-50">
										02-1234-5678
									</span>
								</div>
							</div>
						</div>
					</div>
				</motion.li>

				{/* 자주 묻는 질문 */}
				<motion.li {...stagger.item}>
					<Link
						href="/landing#faq"
						className={cn(
							"flex items-center gap-3.5 rounded-3xl bg-white dark:bg-dotori-950 p-5 shadow-sm dark:shadow-none transition-all",
							"active:scale-[0.99] hover:shadow-md dark:hover:shadow-none",
						)}
					>
						<div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-dotori-50 dark:bg-dotori-900">
							<QuestionMarkCircleIcon className="h-5 w-5 text-dotori-500" />
						</div>
						<div className="min-w-0 flex-1">
							<h3 className="text-base font-semibold text-dotori-900 dark:text-dotori-50">
								자주 묻는 질문
							</h3>
							<p className="mt-0.5 text-sm text-dotori-500 dark:text-dotori-300">
								FAQ에서 궁금한 점을 확인해보세요
							</p>
						</div>
					</Link>
				</motion.li>

				{/* 1:1 문의하기 */}
				<motion.li {...stagger.item}>
					<Link
						href="/chat?prompt=고객센터를 통해 문의드립니다."
						className={cn(
							"flex items-center justify-center gap-2 rounded-3xl bg-dotori-900 dark:bg-dotori-800 p-5 shadow-sm dark:shadow-none transition-all",
							"active:scale-[0.98] hover:bg-dotori-800 dark:hover:bg-dotori-700",
						)}
					>
						<ChatBubbleLeftRightIcon className="h-5 w-5 text-white" />
						<span className="text-base font-semibold text-white">
							1:1 문의하기
						</span>
					</Link>
				</motion.li>
			</motion.ul>
		</div>
	);
}
