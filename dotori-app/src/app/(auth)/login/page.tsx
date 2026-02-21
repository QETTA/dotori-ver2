"use client";

import { Button } from "@/components/catalyst/button";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { BRAND } from "@/lib/brand-assets";
import { cn } from "@/lib/utils";

export default function LoginPage() {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleKakaoLogin() {
		setIsLoading(true);
		setError(null);
		try {
			const result = await signIn("kakao", {
				callbackUrl: "/",
				redirect: false,
			});
			if (result?.error) {
				setError("로그인에 실패했어요. 다시 시도해주세요");
			} else if (result?.url) {
				window.location.href = result.url;
			}
		} catch {
			setError("로그인에 실패했어요. 다시 시도해주세요");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="relative min-h-dvh bg-dotori-50">
			{/* ── 배경 장식 ── */}
			{/* 상단 따뜻한 그라디언트 */}
			<div
				className="pointer-events-none absolute inset-0 z-0"
				aria-hidden="true"
			>
				<div className="absolute inset-0 bg-gradient-to-b from-dotori-100 via-dotori-50 to-white" />

				{/* 좌상단 원 */}
				<svg
					className="absolute -left-16 -top-16 h-64 w-64 text-dotori-200/50"
					viewBox="0 0 200 200"
					fill="currentColor"
				>
					<circle cx="100" cy="100" r="100" />
				</svg>

				{/* 우상단 원 */}
				<svg
					className="absolute -right-10 top-12 h-40 w-40 text-dotori-200/30"
					viewBox="0 0 200 200"
					fill="currentColor"
				>
					<circle cx="100" cy="100" r="100" />
				</svg>

				{/* 좌하단 작은 원 */}
				<svg
					className="absolute bottom-32 left-6 h-20 w-20 text-dotori-200/20"
					viewBox="0 0 200 200"
					fill="currentColor"
				>
					<circle cx="100" cy="100" r="100" />
				</svg>

				{/* 우하단 중간 원 */}
				<svg
					className="absolute -right-8 bottom-48 h-32 w-32 text-dotori-100/60"
					viewBox="0 0 200 200"
					fill="currentColor"
				>
					<circle cx="100" cy="100" r="100" />
				</svg>
			</div>

			{/* ── 메인 콘텐츠 ── */}
			<div className="relative z-10 flex min-h-dvh w-full flex-col items-center px-6 text-center motion-safe:animate-in motion-safe:fade-in duration-400">
				{/* 인사말 */}
				<p className="mb-3 mt-12 text-[14px] font-medium tracking-wide text-dotori-400">
					우리 아이 어린이집 찾기
				</p>

				{/* 로고 */}
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src={BRAND.lockupStacked} alt="도토리" className="h-32" />

				{/* 서브 태그라인 */}
				<p className="mt-5 text-[16px] leading-relaxed text-dotori-400">
					빈자리 알림부터 대기 신청까지
				</p>
				<p className="mt-1.5 text-[13px] text-dotori-300">
					전국 20,000+ 어린이집 정보를 한눈에
				</p>

				{/* 에러 메시지 */}
				{error && (
					<p className="mt-4 rounded-xl bg-dotori-100 px-4 py-2 text-[14px] text-dotori-700">
						{error}
					</p>
				)}

				{/* 카카오 로그인 */}
				<Button
					onClick={handleKakaoLogin}
					disabled={isLoading}
					aria-busy={isLoading}
					color="amber"
					className={cn(
						"mt-10 w-full gap-2.5 px-6 py-4.5 text-[16px] font-semibold",
						isLoading && "opacity-60",
					)}
				>
					{isLoading ? (
						<span className="animate-pulse">로그인 중...</span>
					) : (
						<>
							<span data-slot="icon" aria-hidden="true">
								<svg
									className="h-5 w-5"
									viewBox="0 0 24 24"
									fill="currentColor"
								>
									<path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.727 1.8 5.127 4.508 6.49-.197.735-.712 2.664-.815 3.078-.127.509.187.501.393.364.163-.108 2.593-1.762 3.644-2.48.734.105 1.49.16 2.27.16 5.523 0 10-3.463 10-7.612C22 6.463 17.523 3 12 3z" />
								</svg>
							</span>
							<span>카카오로 계속하기</span>
						</>
					)}
				</Button>

				{/* 둘러보기 */}
				<Link
					href="/"
					className="mt-5 py-2.5 text-[15px] text-dotori-400 transition-colors hover:text-dotori-500"
				>
					로그인 없이 둘러보기
				</Link>

				{/* 이용약관 */}
				<p className="mt-8 max-w-xs text-[12px] leading-relaxed text-dotori-300">
					시작하면{" "}
					<Link href="/my/terms" className="underline hover:text-dotori-400">
						이용약관
					</Link>{" "}
					및{" "}
					<Link href="/my/terms" className="underline hover:text-dotori-400">
						개인정보처리방침
					</Link>
					에 동의하게 됩니다.
				</p>
			</div>
		</div>
	);
}
