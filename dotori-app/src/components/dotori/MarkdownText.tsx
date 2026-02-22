"use client";

import { Fragment } from "react";
import type { ReactNode } from "react";

interface MarkdownTextProps {
	content: string;
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
					className="font-semibold text-dotori-900 dark:text-dotori-50"
				>
					{parseInline(match[1])}
				</strong>,
			);
		} else if (match[2] !== undefined) {
			segments.push(
				<em
					key={`italic-${index}`}
					className="text-dotori-800 italic dark:text-dotori-100"
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

export function MarkdownText({ content }: MarkdownTextProps) {
	const blocks = content.split(/\n{2,}/g);
	const hasContent = content.trim().length > 0;

	if (!hasContent) {
		return <p className="text-base leading-relaxed text-dotori-900 dark:text-dotori-50" />;
	}

	return (
		<div className="max-w-full text-base leading-relaxed text-dotori-900 dark:text-dotori-50">
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
							className="mb-2 mt-1 font-semibold text-dotori-800 dark:text-dotori-100"
						>
							{parseInline(headerMatch[1])}
						</h2>
					);
				}

				if (isBulletList) {
					return (
						<ul
							key={`list-${blockIndex}`}
							className="ml-5 list-disc space-y-1 [&>li]:text-base [&>li]:leading-relaxed"
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
						className={blockIndex > 0 ? "mt-3" : undefined}
					>
						{renderTextLines(lines)}
					</p>
				);
			})}
		</div>
	);
}
