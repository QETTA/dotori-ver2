"use client";

import { Button } from "@/components/catalyst/button";
import { Field, Fieldset, Label } from "@/components/catalyst/fieldset";
import { Heading } from "@/components/catalyst/heading";
import { Select } from "@/components/catalyst/select";
import { Text } from "@/components/catalyst/text";
import {
	promptItemVariants,
	promptListVariants,
	suggestedPrompts,
} from "@/app/(app)/chat/_lib/chat-config";
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
		<div className="relative px-5 pb-4 pt-8">
			<div className="mx-auto w-full max-w-sm overflow-hidden rounded-[32px] border border-dotori-100 bg-white p-6 shadow-[0_10px_30px_rgba(200,149,106,0.10)]">
				<div className="relative rounded-3xl bg-gradient-to-b from-dotori-50 to-white px-4 py-5">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={toriIcon}
						alt=""
						className="mx-auto mb-4 h-16 w-16 rounded-full border border-dotori-100 bg-white"
					/>
						<Heading level={3} className="text-center text-3xl leading-tight tracking-tight text-dotori-900">
							이동 고민이라면 뭐든 물어보세요
						</Heading>
					<Text className="mt-2 block text-center text-sm text-dotori-600">
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

				<motion.div
					className="relative mt-5 space-y-2.5"
					variants={promptListVariants}
					initial="hidden"
					animate="show"
				>
					{suggestedPrompts.map((prompt) => (
						<motion.div key={prompt.label} variants={promptItemVariants}>
							<Button
								plain={true}
								type="button"
								onClick={() => onSuggestPrompt(prompt)}
								className={cn(
									"flex w-full items-center gap-3 rounded-2xl border border-dotori-100 bg-dotori-50/70 px-4 py-3 text-left transition-all",
									"hover:-translate-y-0.5 hover:bg-dotori-100 active:scale-95",
								)}
							>
								<span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-dotori-100 bg-white text-lg shadow-sm">
									{prompt.icon}
								</span>
								<div className="min-w-0">
										<Text className="block text-base font-semibold text-dotori-800">
											{prompt.label}
										</Text>
									<Text className="mt-0.5 block line-clamp-1 text-sm text-dotori-500">
										{prompt.prompt}
									</Text>
								</div>
							</Button>
						</motion.div>
					))}
				</motion.div>
			</div>
		</div>
	);
}
