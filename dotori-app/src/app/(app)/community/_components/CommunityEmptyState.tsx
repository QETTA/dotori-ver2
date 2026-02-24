import { DsButton } from "@/components/ds/DsButton";
import { DS_GLASS, DS_TYPOGRAPHY } from "@/lib/design-system/tokens";
import { fadeIn, fadeScale, fadeUp, stagger, tap } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

export function CommunityEmptyState({ message }: { message: string }) {
	return (
		<motion.section
			{...fadeUp}
			{...stagger.container}
			className={cn(
				"relative overflow-hidden rounded-3xl border border-dotori-100/70 bg-dotori-50/85 p-4 text-center shadow-sm ring-1 ring-dotori-100/70",
				DS_GLASS.CARD,
			)}
		>
			<motion.div
				{...fadeIn}
				aria-hidden
				className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-amber-200/30 blur-2xl dark:bg-amber-300/10"
			/>
			<motion.div
				{...fadeIn}
				aria-hidden
				transition={{ duration: 0.25, delay: 0.07 }}
				className="pointer-events-none absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-forest-100/40 blur-2xl dark:bg-forest-300/10"
			/>
			<motion.div
				{...stagger.item}
				{...fadeScale}
				className="relative mx-auto mb-5 h-44 w-44 rounded-[2rem] bg-[radial-gradient(circle_at_30%_20%,_rgba(255,255,255,0.95),_rgba(252,238,224,0.82)_58%,_rgba(247,228,204,0.72))] p-4 ring-1 ring-dotori-200/70 shadow-sm shadow-dotori-200/45 dark:bg-dotori-900 dark:ring-dotori-700 dark:shadow-none"
			>
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
			</motion.div>

			<motion.div {...stagger.item} className="border-b border-dotori-100/70 pb-4">
				<h3 className={cn(DS_TYPOGRAPHY.h3, "font-semibold text-dotori-900 dark:text-dotori-50")}>
					이웃 글이 아직 없어요
				</h3>
				<p className={cn(DS_TYPOGRAPHY.bodySm, "mt-2 text-dotori-600 dark:text-dotori-300")}>
					{message}
				</p>
			</motion.div>

			<motion.div className="pt-4" {...stagger.item}>
				<motion.div {...tap.button}>
					<DsButton
						href="/community/write"
					
						className={cn(
							"min-h-11 w-full justify-center rounded-full font-semibold shadow-sm shadow-dotori-900/20",
							DS_TYPOGRAPHY.body,
						)}
					>
						첫 번째 이웃 이야기를 올려보세요
					</DsButton>
				</motion.div>
			</motion.div>
		</motion.section>
	);
}
