import Link from "next/link";

export default function NotFound() {
	return (
		<div className="flex min-h-dvh items-center justify-center">
			<div className="max-w-sm px-5 text-center">
				<p className="text-base font-semibold text-dotori-900 dark:text-dotori-50">
					페이지를 찾을 수 없어요
				</p>
				<p className="mt-2 text-sm leading-relaxed text-dotori-600 dark:text-dotori-300">
					주소가 변경되었거나 삭제된 페이지입니다.
				</p>
				<Link
					href="/"
					className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-dotori-400 px-5 py-2.5 text-sm font-bold text-white hover:bg-dotori-600"
				>
					홈으로 돌아가기
				</Link>
			</div>
		</div>
	);
}
