"use client";

import { Button } from "@/components/catalyst/button";
import { Field, Fieldset, Label } from "@/components/catalyst/fieldset";
import { Heading } from "@/components/catalyst/heading";
import { Select } from "@/components/catalyst/select";
import { Text } from "@/components/catalyst/text";
import { suggestedPrompts } from "@/app/(app)/chat/_lib/chat-config";
import { stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

export type ChatPromptPanelItem = (typeof suggestedPrompts)[number];

interface ChatPromptPanelProps {
	onSelectPrompt: (prompt: ChatPromptPanelItem) => void;
	onSuggestPrompt: (prompt: ChatPromptPanelItem) => void;
	selectedPromptLabel: string;
	toriIcon: string;
}

export function ChatPromptPanel({
	onSelectPrompt,
	onSuggestPrompt,
	selectedPromptLabel,
	toriIcon,
}: ChatPromptPanelProps) {
	const handlePromptSelectChange = (value: string) => {
		const selectedPrompt = suggestedPrompts.find((prompt) => prompt.label === value);
		if (!selectedPrompt) return;
		onSelectPrompt(selectedPrompt);
	};

	return (
		<div className="relative px-5 py-6">
			<div className="mx-auto w-full max-w-sm overflow-hidden rounded-[32px] border border-dotori-100 bg-white p-6 shadow-[0_10px_30px_rgba(200,149,106,0.10)] dark:border-dotori-800 dark:bg-dotori-950 dark:shadow-none">
				<div className="relative rounded-3xl bg-gradient-to-b from-dotori-50 to-white px-4 py-5 dark:from-dotori-900 dark:to-dotori-950">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={toriIcon}
						alt=""
						className="mx-auto mb-4 h-20 w-20 rounded-full border border-dotori-100 bg-white shadow-sm dark:border-dotori-800 dark:bg-dotori-900 dark:shadow-none"
					/>
					<Heading
						level={3}
						className="text-center text-3xl leading-tight tracking-tight text-dotori-900 dark:text-dotori-50"
					>
						이동 고민이라면 뭐든 물어보세요
					</Heading>
					<Text className="mt-2 block text-center text-sm text-dotori-600 dark:text-dotori-300">
						반편성, 교사 교체, 빈자리까지 토리가 함께 정리해드려요.
					</Text>
				</div>

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

				<motion.ul className="relative mt-6 space-y-3" {...stagger.container}>
					{suggestedPrompts.map((prompt) => (
						<motion.li key={prompt.label} {...stagger.item}>
							<Button
								plain={true}
								type="button"
								onClick={() => onSuggestPrompt(prompt)}
								className={cn(
									"flex min-h-14 w-full items-center gap-3 rounded-2xl border border-dotori-100 bg-dotori-50/70 px-4 py-3.5 text-left transition-all dark:border-dotori-800 dark:bg-dotori-900/60",
									"hover:-translate-y-0.5 hover:bg-dotori-100 hover:shadow-sm dark:hover:bg-dotori-800 dark:hover:shadow-none active:scale-[0.97]",
									"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dotori-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-dotori-500 dark:focus-visible:ring-offset-dotori-950",
								)}
							>
								<span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-dotori-100 bg-white text-lg shadow-sm dark:border-dotori-700 dark:bg-dotori-900 dark:shadow-none">
									{prompt.icon}
								</span>
								<div className="min-w-0">
									<Text className="block text-base font-semibold text-dotori-800 dark:text-dotori-100">
										{prompt.label}
									</Text>
									<Text className="mt-0.5 block line-clamp-1 text-sm text-dotori-500 dark:text-dotori-300">
										{prompt.prompt}
									</Text>
								</div>
							</Button>
						</motion.li>
					))}
				</motion.ul>
			</div>
		</div>
	);
}
