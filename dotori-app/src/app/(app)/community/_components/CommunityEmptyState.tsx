import Link from "next/link";

export function CommunityEmptyState({ message }: { message: string }) {
	return (
		<div className="rounded-3xl border border-dotori-100 bg-gradient-to-b from-dotori-50 to-white px-4 py-6 text-center dark:border-dotori-800 dark:from-dotori-900 dark:to-dotori-950">
			<div className="mx-auto mb-5 h-44 w-44 rounded-[2rem] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_rgba(253,242,232,0.7))] p-4 dark:bg-dotori-900">
				<svg
					viewBox="0 0 180 180"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					className="h-full w-full"
					aria-hidden
				>
					<rect x="35" y="90" width="110" height="60" rx="16" fill="#FFF3E9" />
					<path
						d="M70 85c0 6 4.5 11 10 11h20c5.5 0 10-5 10-11V64.5C100 58.5 95.5 54 90 54h-20c-5.5 0-10 4.5-10 10.5V85Z"
						fill="#F0D8BF"
					/>
					<path d="M68 82h22v-14a2 2 0 00-2-2h-18a2 2 0 00-2 2v14Z" fill="#D9A679" />
					<circle cx="66" cy="82" r="3" fill="#3B5569" />
					<circle cx="104" cy="82" r="3" fill="#3B5569" />
					<rect x="76" y="95" width="28" height="4" rx="2" fill="#3B5569" />
					<path
						d="M52 128c10-12 25-12 35 0"
						stroke="#3B5569"
						strokeWidth="4"
						strokeLinecap="round"
					/>
					<circle cx="90" cy="30" r="13" fill="#DB6A4F" />
					<path
						d="M82 52c5.5-11 17-11 22 0"
						stroke="#DB6A4F"
						strokeWidth="4"
						strokeLinecap="round"
					/>
					<circle cx="32" cy="64" r="10" fill="#4D7C63" />
					<circle cx="148" cy="74" r="10" fill="#F6A14A" />
					<circle cx="45" cy="126" r="8" fill="#A8D3C0" />
					<circle cx="147" cy="126" r="8" fill="#F5D5A7" />
				</svg>
			</div>
			<h3 className="text-base font-semibold text-dotori-900 dark:text-dotori-50">
				이웃 글이 아직 없어요
			</h3>
			<p className="mt-2 text-sm text-dotori-600 dark:text-dotori-300">{message}</p>
				<Link
					href="/community/write"
					className="mt-4 inline-flex min-h-[56px] w-full items-center justify-center rounded-full bg-dotori-900 px-5 py-3 text-base font-semibold text-white transition-all active:scale-[0.98] dark:bg-dotori-500"
				>
					첫 번째 이웃 이야기를 올려보세요
				</Link>
		</div>
	);
}
