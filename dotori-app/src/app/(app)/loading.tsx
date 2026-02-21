import '@/styles/loading.css'

export default function AppLoading() {
	return (
		<div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3">
			<div className="dotori-loader dotori-loader--breathe dotori-loader--lg">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					className="dotori-loader__icon"
					src="/brand/dotori-symbol.svg"
					alt="로딩 중"
					width={64}
					height={70}
				/>
			</div>
			<p className="dotori-loader__text">잠시만 기다려주세요</p>
		</div>
	)
}

