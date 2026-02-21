"use client";

import type { TextBlock as TextBlockType } from "@/types/dotori";

export function TextBlock({ block }: { block: TextBlockType }) {
	return <p className="text-[15px] leading-relaxed">{block.content}</p>;
}
