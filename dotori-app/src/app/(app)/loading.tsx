import '@/styles/loading.css'

export default function AppLoading() {
	return (
		<div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3">
			<div
				className="h-10 w-10 animate-spin rounded-full border-2 border-dotori-200 border-t-dotori-500"
				role="status"
				aria-label="로딩 중"
			>
				<span className="sr-only">로딩 중</span>
			</div>
			<p className="dotori-loader__text">잠시만 기다려주세요</p>
		</div>
	)
}
