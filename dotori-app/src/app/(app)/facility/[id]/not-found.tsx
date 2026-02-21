import Link from "next/link";
import { ErrorState } from "@/components/dotori/ErrorState";

export default function FacilityNotFound() {
	return (
		<div className="flex min-h-dvh items-center justify-center bg-dotori-50 px-5">
			<div className="w-full max-w-md text-center">
				<ErrorState message="시설 정보를 찾을 수 없어요" />
				<div className="mt-6 space-y-3">
					<Link
						href="/explore"
						className="inline-flex min-h-12 w-full items-center justify-center rounded-3xl bg-dotori-400 px-7 text-[15px] font-bold text-white transition-all hover:bg-dotori-600 active:scale-[0.98]"
					>
						탐색으로 돌아가기
					</Link>
					<Link
						href="/explore"
						className="inline-flex min-h-12 w-full items-center justify-center rounded-3xl border border-dotori-200 bg-white px-7 text-[15px] font-bold text-dotori-700 transition-all hover:bg-dotori-50 active:scale-[0.98]"
					>
						다른 어린이집 찾기
					</Link>
				</div>
			</div>
		</div>
	);
}
