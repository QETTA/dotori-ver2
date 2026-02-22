import { ErrorState } from "@/components/dotori/ErrorState";
import Link from "next/link";

export default function NotFound() {
	return (
		<div className="flex min-h-dvh items-center justify-center">
			<div className="text-center">
				<ErrorState message="페이지를 찾을 수 없어요" />
				<Link
					href="/"
					className="mt-4 inline-block rounded-full bg-dotori-400 px-5 py-2.5 text-sm font-bold text-white hover:bg-dotori-600"
				>
					홈으로 돌아가기
				</Link>
			</div>
		</div>
	);
}
