"use client";

import { useEffect, useMemo, useState } from "react";
import type {
	ChecklistBlock as ChecklistBlockType,
} from "@/types/dotori";
import { cn } from "@/lib/utils";

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
		<div className="overflow-hidden rounded-2xl border border-dotori-100 bg-white">
			{/* Header */}
			<div className="border-b border-dotori-100 px-4 py-3">
				<h3 className="text-[15px] font-semibold text-dotori-900">
					{block.title}
				</h3>
				<div className="mt-2 flex items-center gap-3">
					<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-dotori-100">
						<div
							className="h-full rounded-full bg-forest-500 transition-all duration-300"
							style={{ width: `${percentage}%` }}
						/>
					</div>
					<span className="text-[12px] font-medium text-dotori-500">
						{checkedCount}/{totalItems}
					</span>
				</div>
			</div>

			{/* Categories */}
				<div className="divide-y divide-dotori-100">
					{block.categories.map((category) => (
					<div key={category.title} className="px-4 py-3">
						<h4 className="mb-2 text-[13px] font-semibold text-dotori-600">
							{category.title}
						</h4>
						<ul className="space-y-1">
							{category.items.map((item) => {
								const isChecked = checkedMap[item.id] ?? false;
								const detailId = `${item.id}-detail`;
								return (
									<li key={item.id}>
										<button
											type="button"
											role="checkbox"
											aria-checked={isChecked}
											aria-label={`${item.text} ${isChecked ? "완료" : "미완료"}`}
											aria-describedby={item.detail ? detailId : undefined}
											className="flex min-h-[44px] w-full items-start gap-3 rounded-xl px-2 py-2 text-left transition-colors active:bg-dotori-50 active:scale-[0.99]"
											onClick={() => toggleItem(item.id)}
										>
											<span
												className={cn(
													"mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
													isChecked
														? "border-forest-500 bg-forest-500"
														: "border-dotori-200 bg-white",
												)}
											>
												{isChecked && (
													<svg
														className="h-3 w-3 text-white"
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
												)}
											</span>
											<div className="min-w-0 flex-1">
												<span
													className={cn(
														"text-[14px] leading-snug",
														isChecked
															? "text-dotori-500 line-through"
															: "text-dotori-900",
													)}
												>
													{item.text}
												</span>
												{item.detail && (
													<p
														id={detailId}
														className="mt-0.5 text-[12px] leading-relaxed text-dotori-500"
													>
														{item.detail}
													</p>
												)}
											</div>
										</button>
									</li>
								);
							})}
						</ul>
					</div>
				))}
			</div>
		</div>
	);
}
