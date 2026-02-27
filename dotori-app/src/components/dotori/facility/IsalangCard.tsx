import { Smartphone } from "lucide-react";
import { DS_TEXT } from "@/lib/design-system/tokens";
import { ISALANG_PORTAL, openIsalangLink, openIsalangApp } from "@/lib/external/isalang-api";
import { cn } from "@/lib/utils";

export function IsalangCard() {
	return (
		<section className={'glass-card rounded-2xl p-5 shadow-sm'}>
			<h3 className={'mb-1 font-semibold'}>
				아이사랑 앱으로 바로가기
			</h3>
			<p className={cn('mb-3 text-body', DS_TEXT.muted)}>
				공식 입소대기·서류제출은 아이사랑 앱에서 진행해요
			</p>

			{/* 앱 열기 버튼 (메인 CTA) */}
			<button
				onClick={() => openIsalangApp(ISALANG_PORTAL.main)}
				className={'mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-dotori-900 px-4 py-3.5 text-body font-semibold text-white shadow-md transition-all active:scale-[0.97] hover:bg-dotori-900/90'}
			>
				<Smartphone className={'h-5 w-5'} />
				아이사랑 앱 열기
			</button>

			{/* 웹 포털 바로가기 (세부 기능) */}
			<div className={'grid grid-cols-2 gap-2'}>
				<button
					onClick={() => openIsalangLink(ISALANG_PORTAL.waitlistApply)}
					className={'rounded-2xl bg-white px-4 py-3 text-center text-body font-medium text-dotori-700 shadow-sm transition-all active:scale-[0.97] hover:bg-dotori-50'}
				>
					입소대기 신청
				</button>
				<button
					onClick={() => openIsalangLink(ISALANG_PORTAL.waitlistStatus)}
					className={'rounded-2xl bg-white px-4 py-3 text-center text-body font-medium text-dotori-700 shadow-sm transition-all active:scale-[0.97] hover:bg-dotori-50'}
				>
					대기현황 확인
				</button>
				<button
					onClick={() => openIsalangLink(ISALANG_PORTAL.documentSubmit)}
					className={'col-span-2 rounded-2xl bg-white px-4 py-3 text-center text-body font-medium text-dotori-700 shadow-sm transition-all active:scale-[0.97] hover:bg-dotori-50'}
				>
					우선순위 서류제출
				</button>
			</div>
			<p className={'mt-2.5 text-center text-body-sm text-dotori-500'}>
				모바일: 앱 실행 · 데스크톱: 웹 포털 (공동인증서 필요)
			</p>
		</section>
	);
}
