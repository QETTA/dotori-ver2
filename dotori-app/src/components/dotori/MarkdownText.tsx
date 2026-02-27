"use client";

import { Fragment } from "react";
import type { ReactNode } from "react";
import { BRAND } from "@/lib/brand-assets";
import { DS_STATUS } from '@/lib/design-system/tokens'
import { cn } from "@/lib/utils";

interface MarkdownTextProps {
	content: string;
	tone?: keyof typeof DS_STATUS;
}

const MARKDOWN_STATUS_SIGNAL = Object.entries(DS_STATUS)
	.map(([status, token]) => `${status}:${token.label}`)
	.join("|");

const MARKDOWN_SIGNAL_PROPS = {
	"data-dotori-brand": BRAND.symbol,
	"data-dotori-glass-surface": 'glass-card',
	"data-dotori-status-signal": MARKDOWN_STATUS_SIGNAL,
} as const;

function resolveToneSurfaceClassName(tone?: keyof typeof DS_STATUS) {
	if (!tone) {
		return undefined;
	}

	return cn('glass-card', DS_STATUS[tone].border);
}

function parseInline(text: string): ReactNode[] {
	const segments: ReactNode[] = [];
	const regex = /\*\*(.*?)\*\*|\*(.*?)\*/g;
	let lastIndex = 0;
	let match: RegExpExecArray | null = null;
	let index = 0;

	while ((match = regex.exec(text)) !== null) {
		if (match.index > lastIndex) {
			segments.push(text.slice(lastIndex, match.index));
		}

		if (match[1] !== undefined) {
			segments.push(
				<strong
					key={`bold-${index}`}
					className={'font-semibold text-dotori-900 dark:text-dotori-50'}
				>
					{parseInline(match[1])}
				</strong>,
			);
		} else if (match[2] !== undefined) {
			segments.push(
				<em
					key={`italic-${index}`}
					className={'text-dotori-800 italic dark:text-dotori-100'}
				>
					{parseInline(match[2])}
				</em>,
			);
		}

		lastIndex = match.index + match[0].length;
		index += 1;
	}

	if (lastIndex < text.length) {
		segments.push(text.slice(lastIndex));
	}

	return segments;
}

function renderTextLines(lines: string[]) {
	return lines.map((line, lineIndex) => (
		<Fragment key={`line-${lineIndex}`}>
			{parseInline(line)}
			{lineIndex < lines.length - 1 && <br />}
		</Fragment>
	));
}

export function MarkdownText({ content, tone }: MarkdownTextProps) {
	const blocks = content.split(/\n{2,}/g);
	const hasContent = content.trim().length > 0;
	const toneSurfaceClassName = resolveToneSurfaceClassName(tone);

	if (!hasContent) {
		return (
			<>
				<span aria-hidden="true" hidden {...MARKDOWN_SIGNAL_PROPS} />
				<p className={cn('text-body leading-relaxed text-dotori-900 dark:text-dotori-50', toneSurfaceClassName)} />
			</>
		);
	}

	return (
		<>
			<span aria-hidden="true" hidden {...MARKDOWN_SIGNAL_PROPS} />
			<div className={cn('max-w-full text-body leading-relaxed text-dotori-900 dark:text-dotori-50', toneSurfaceClassName)}>
				{blocks.map((block, blockIndex) => {
					const lines = block.split("\n");
					const bulletLines = lines.filter((line) => line.trim().length > 0);
					const isBulletList =
						bulletLines.length > 0 &&
						bulletLines.every((line) => /^\s*-\s+/.test(line));
					const headerMatch = block.match(/^\s*##\s+(.*)$/);

					if (headerMatch) {
						return (
							<h2
								key={`header-${blockIndex}`}
								className={'mb-2 mt-1 font-semibold text-dotori-800 dark:text-dotori-100'}
							>
								{parseInline(headerMatch[1])}
							</h2>
						);
					}

					if (isBulletList) {
						return (
							<ul
								key={`list-${blockIndex}`}
								className={'ml-5 list-disc space-y-1 [&>li]:text-body [&>li]:leading-relaxed'}
							>
								{bulletLines.map((line, index) => (
									<li key={`bullet-${index}`}>
										{parseInline(line.replace(/^\s*-\s+/, ""))}
									</li>
								))}
							</ul>
						);
					}

					return (
						<p
							key={`paragraph-${blockIndex}`}
							className={blockIndex > 0 ? 'mt-3' : undefined}
						>
							{renderTextLines(lines)}
						</p>
					);
				})}
			</div>
		</>
	);
}
