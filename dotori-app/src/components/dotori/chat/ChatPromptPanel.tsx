'use client'

import { suggestedPrompts } from '@/app/(app)/chat/_lib/chat-config'
import { Field, Fieldset, Label } from '@/components/catalyst/fieldset'
import { Heading } from '@/components/catalyst/heading'
import { Select } from '@/components/catalyst/select'
import { Text } from '@/components/catalyst/text'
import { DsButton } from '@/components/ds/DsButton'
import { BRAND } from '@/lib/brand-assets'
import { copy } from '@/lib/brand-copy'
import { DS_GLASS, DS_TYPOGRAPHY } from '@/lib/design-system/tokens'
import { fadeUp, stagger, tap } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'

export type ChatPromptPanelItem = (typeof suggestedPrompts)[number];

interface ChatPromptPanelProps {
	onSelectPrompt: (prompt: ChatPromptPanelItem) => void
	onSuggestPrompt: (prompt: ChatPromptPanelItem) => void
	selectedPromptLabel: string
	toriIcon: string
}

export function ChatPromptPanel({
	onSelectPrompt,
	onSuggestPrompt,
	selectedPromptLabel,
	toriIcon,
}: ChatPromptPanelProps) {
	const chatCopy = copy.chat
	const handlePromptSelectChange = (value: string) => {
		const selectedPrompt = suggestedPrompts.find((prompt) => prompt.label === value)
		if (!selectedPrompt) return
		onSelectPrompt(selectedPrompt)
	}

	return (
		<div className="relative px-4 py-4">
			<div
				className={cn(
					DS_GLASS.CARD,
					"mx-auto w-full max-w-sm overflow-hidden rounded-[24px] border border-dotori-200/80 p-4 shadow-[0_14px_30px_rgba(200,149,106,0.16)] dark:border-dotori-800/70 dark:shadow-none",
				)}
			>
				<motion.div
					className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-dotori-100/80 via-dotori-50 to-white px-3.5 py-4 dark:from-dotori-900 dark:via-dotori-900 dark:to-dotori-950"
					{...fadeUp}
				>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={BRAND.socialGradient}
						alt=""
						aria-hidden="true"
						className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.12] dark:opacity-[0.2]"
					/>
					<div className="relative">
						<div className="mb-2 flex items-center justify-between gap-2">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={BRAND.lockupHorizontalKr} alt="도토리" className="h-5 w-auto" />
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={BRAND.symbolCorporate} alt="" aria-hidden="true" className="h-4 w-4" />
						</div>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={toriIcon}
						alt=""
						className="mx-auto mb-2.5 h-14 w-14 rounded-full border border-dotori-200/80 bg-white shadow-[0_8px_18px_rgba(200,149,106,0.14)] dark:border-dotori-700 dark:bg-dotori-900 dark:shadow-none"
					/>
					<Heading
						level={3}
						className={cn(DS_TYPOGRAPHY.h2, "text-center font-bold tracking-tight text-dotori-900 dark:text-dotori-50")}
					>
						{chatCopy.panelTitle}
					</Heading>
					<Text className={cn(DS_TYPOGRAPHY.bodySm, "mt-1.5 block text-center text-dotori-500 dark:text-dotori-300")}>
						{chatCopy.panelDescription}
					</Text>
					</div>
				</motion.div>

				<Fieldset className="sr-only">
					<Field>
						<Label>빠른 시나리오</Label>
						<Select
							value={selectedPromptLabel}
							onChange={(event) => handlePromptSelectChange(event.currentTarget.value)}
						>
							{suggestedPrompts.map((prompt) => (
								<option key={prompt.label} value={prompt.label}>
									{prompt.label}
								</option>
							))}
						</Select>
					</Field>
				</Fieldset>

					<motion.ul className="relative mt-4 space-y-2.5" {...stagger.container}>
						{suggestedPrompts.map((prompt) => (
							<motion.li key={prompt.label} {...stagger.item}>
								<motion.div {...tap.chip}>
									<DsButton
									 variant="ghost"
										type="button"
										onClick={() => onSuggestPrompt(prompt)}
										className={cn(
											DS_GLASS.CARD,
											"flex min-h-10 w-full items-center gap-2.5 rounded-xl border border-dotori-200/80 px-3 py-2.5 text-left transition-all dark:border-dotori-800/70",
											"hover:-translate-y-0.5 hover:border-dotori-300 hover:bg-dotori-100/80 hover:shadow-[0_8px_18px_rgba(200,149,106,0.14)] dark:hover:border-dotori-700 dark:hover:bg-dotori-800/80 dark:hover:shadow-none",
											"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dotori-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-dotori-500 dark:focus-visible:ring-offset-dotori-950",
										)}
									>
										<span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-dotori-200/70 bg-white text-base shadow-sm dark:border-dotori-700 dark:bg-dotori-900 dark:shadow-none">
											{prompt.icon}
										</span>
										<div className="min-w-0">
											<Text className={cn(DS_TYPOGRAPHY.body, "block text-dotori-800 dark:text-dotori-100")}>
												{prompt.label}
											</Text>
											<Text
												className={cn(
													DS_TYPOGRAPHY.caption,
													"mt-0.5 block line-clamp-1 text-dotori-500 dark:text-dotori-300",
												)}
											>
												{prompt.prompt}
											</Text>
										</div>
									</DsButton>
								</motion.div>
							</motion.li>
						))}
					</motion.ul>
			</div>
		</div>
	);
}
