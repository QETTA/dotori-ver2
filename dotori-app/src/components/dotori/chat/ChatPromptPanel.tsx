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
		<div className="relative px-6 pb-4 pt-10">
			<div className="mx-auto w-full max-w-sm overflow-hidden rounded-3xl border border-dotori-100 bg-white/90 p-6 shadow-sm">
				<div className="relative">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={toriIcon}
						alt=""
						className="mx-auto mb-4 h-14 w-14 rounded-full border border-dotori-100 bg-white"
					/>
					<Heading level={3} className="text-center text-lg text-dotori-800">
						이동 고민이라면 뭐든 물어보세요
					</Heading>
					<Text className="mt-1.5 block text-center text-sm text-dotori-500">
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
					className="relative mt-6 space-y-2.5"
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
									"flex w-full items-center gap-3 rounded-2xl bg-dotori-50 px-4 py-3 text-left transition-all",
									"hover:bg-dotori-100 active:scale-95",
								)}
							>
								<span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-lg">
									{prompt.icon}
								</span>
								<div className="min-w-0">
									<Text className="block font-semibold text-dotori-700">
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
