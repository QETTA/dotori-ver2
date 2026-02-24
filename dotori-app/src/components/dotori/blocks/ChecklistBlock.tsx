"use client";

import { useEffect, useMemo, useState } from "react";
import type {
	ChecklistBlock as ChecklistBlockType,
} from "@/types/dotori";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { fadeUp, stagger, tap } from "@/lib/motion";

const CHECKLIST_STORAGE_PREFIX = "dotori_checklist_";

type ChecklistBlockWithFacilityId = ChecklistBlockType & {
	facilityId?: string;
};

function buildCheckedMap(
	block: ChecklistBlockType,
): Record<string, boolean> {
	const map: Record<string, boolean> = {};
	for (const category of block.categories) {
		for (const item of category.items) {
			map[item.id] = item.checked;
		}
	}
	return map;
}

function createStorageKey(block: ChecklistBlockWithFacilityId): string {
	const facilityId =
		block.facilityId?.trim() ??
		block.title;
	const fallbackId = facilityId.trim().length > 0 ? facilityId : "default";
	return `${CHECKLIST_STORAGE_PREFIX}${encodeURIComponent(fallbackId)}`;
}

function readCheckedMap(
	storageKey: string,
	fallback: Record<string, boolean>,
): Record<string, boolean> {
	if (typeof window === "undefined") {
		return fallback;
	}

	try {
		const raw = window.localStorage.getItem(storageKey);
		if (!raw) {
			return fallback;
		}

		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed !== "object") {
			return fallback;
		}

		const restored = { ...fallback };
		for (const [id, checked] of Object.entries(parsed)) {
			if (typeof checked === "boolean") {
				restored[id] = checked;
			}
		}
		return restored;
	} catch {
		return fallback;
	}
}

function writeCheckedMap(storageKey: string, checkedMap: Record<string, boolean>) {
	if (typeof window === "undefined") {
		return;
	}
	try {
		window.localStorage.setItem(storageKey, JSON.stringify(checkedMap));
	} catch {
		// ignore storage write failures in browser environments with restricted storage
	}
}

export function ChecklistBlock({ block }: { block: ChecklistBlockType }) {
	const storageKey = useMemo(
		() => createStorageKey(block as ChecklistBlockWithFacilityId),
		[block],
	);

	const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>(
		() => readCheckedMap(storageKey, buildCheckedMap(block)),
	);

	useEffect(() => {
		setCheckedMap(readCheckedMap(storageKey, buildCheckedMap(block)));
	}, [block, storageKey]);

	useEffect(() => {
		writeCheckedMap(storageKey, checkedMap);
	}, [storageKey, checkedMap]);

	const totalItems = useMemo(
		() => block.categories.reduce((acc, cat) => acc + cat.items.length, 0),
		[block.categories],
	);
	const checkedCount = useMemo(
		() => Object.values(checkedMap).filter(Boolean).length,
		[checkedMap],
	);
	const percentage = useMemo(
		() => (totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0),
		[checkedCount, totalItems],
	);

	function toggleItem(id: string) {
		setCheckedMap((prev) => ({ ...prev, [id]: !prev[id] }));
	}

	return (
		<motion.div
			{...fadeUp}
			className="mt-2 overflow-hidden rounded-2xl bg-dotori-50/80 ring-1 ring-dotori-100/70 dark:bg-dotori-900/60 dark:ring-dotori-800/60"
		>
			{/* Header */}
			<div className="border-b border-dotori-100/70 px-4 py-3 dark:border-dotori-800/60">
				<h3 className="text-base font-semibold text-dotori-900 dark:text-dotori-50">{block.title}</h3>
				<div className="mt-2 flex items-center gap-3">
					<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-dotori-100 dark:bg-dotori-800">
						<div
							className="h-full rounded-full bg-forest-500 transition-all duration-300"
							style={{ width: `${percentage}%` }}
						/>
					</div>
					<span className="text-xs font-medium text-dotori-500 dark:text-dotori-300">
						{checkedCount}/{totalItems}
					</span>
				</div>
			</div>

			{/* Categories */}
			<div className="divide-y divide-dotori-100/70 dark:divide-dotori-800/60">
				{totalItems === 0 ? (
					<div className="px-4 py-6 text-center">
						<p className="text-sm font-medium text-dotori-700 dark:text-dotori-200">
							체크할 항목이 아직 없어요.
						</p>
						<p className="mt-1 text-xs text-dotori-500 dark:text-dotori-300">
							필요한 항목이 생기면 여기에 정리해드릴게요.
						</p>
					</div>
				) : (
					block.categories.map((category) => (
						<div key={category.title} className="px-4 py-3">
							<h4 className="mb-2 text-sm font-semibold text-dotori-600 dark:text-dotori-300">
								{category.title}
							</h4>
							<motion.ul className="space-y-1.5" {...stagger.container}>
								{category.items.map((item) => {
									const isChecked = checkedMap[item.id] ?? false;
									const detailId = `${item.id}-detail`;
									return (
										<motion.li key={item.id} {...stagger.item}>
											<motion.button
												type="button"
												role="checkbox"
												aria-checked={isChecked}
												aria-label={`${item.text} ${isChecked ? "완료" : "미완료"}`}
												aria-describedby={item.detail ? detailId : undefined}
												className="flex min-h-11 w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-dotori-100/60 active:bg-dotori-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dotori-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:hover:bg-dotori-950/30 dark:active:bg-dotori-950/40 dark:focus-visible:ring-dotori-500/40 dark:focus-visible:ring-offset-dotori-950"
												onClick={() => toggleItem(item.id)}
												{...tap.button}
											>
												<span
													className={cn(
														"mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 bg-white transition-colors dark:bg-dotori-950",
														isChecked
															? "border-forest-400/80 bg-forest-50/80 dark:border-forest-500/80 dark:bg-forest-950/30"
															: "border-dotori-200 dark:border-dotori-700",
													)}
												>
													<svg
														className={cn(
															"h-3 w-3 transition-colors",
															isChecked ? "text-forest-500" : "text-dotori-300",
														)}
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
														strokeWidth={3}
														aria-hidden="true"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															d="M5 13l4 4L19 7"
														/>
													</svg>
												</span>
												<div className="min-w-0 flex-1">
													<span
														className={cn(
															"text-sm leading-snug",
															isChecked
																? "text-dotori-500 line-through dark:text-dotori-300"
																: "text-dotori-900 dark:text-dotori-50",
														)}
													>
														{item.text}
													</span>
													{item.detail && (
														<p
															id={detailId}
															className="mt-0.5 text-xs leading-relaxed text-dotori-500 dark:text-dotori-300"
														>
															{item.detail}
														</p>
													)}
												</div>
											</motion.button>
										</motion.li>
									);
								})}
							</motion.ul>
						</div>
					))
				)}
			</div>
		</motion.div>
	);
}
