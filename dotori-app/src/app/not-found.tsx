import Link from "next/link";
import { BrandEmptyIllustration } from "@/components/dotori/BrandEmptyIllustration";

export default function NotFound() {
	return (
		<div className="flex min-h-dvh items-center justify-center bg-dotori-50 text-dotori-900 dark:bg-dotori-950 dark:text-dotori-50">
			<div className="max-w-sm px-5 text-center">
				<BrandEmptyIllustration variant="error" size={96} className="mb-4" />
				<p className="text-lg font-semibold text-dotori-900 dark:text-dotori-50">
					페이지를 찾을 수 없어요
				</p>
				<p className="mt-2 text-sm leading-relaxed text-dotori-600 dark:text-dotori-300">
					주소가 변경되었거나 삭제된 페이지입니다.
				</p>
				<Link
					href="/"
					className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-dotori-500 px-5 py-2.5 text-sm font-bold text-white transition-transform hover:bg-dotori-600 active:scale-[0.97]"
				>
					홈으로 돌아가기
				</Link>
			</div>
		</div>
	);
}
