import { ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";
import { ChecklistBlock } from "@/components/dotori/blocks/ChecklistBlock";
import { cn } from "@/lib/utils";
import type { ChecklistBlock as ChecklistBlockType } from "@/types/dotori";

interface FacilityChecklistCardProps {
	facilityType: string;
	checklist: ChecklistBlockType | null;
	showChecklist: boolean;
	onToggle: () => void;
}

export function FacilityChecklistCard({
	facilityType,
	checklist,
	showChecklist,
	onToggle,
}: FacilityChecklistCardProps) {
	return (
		<section className="rounded-3xl bg-white shadow-sm">
			<button
				onClick={onToggle}
				className="flex w-full items-center gap-3 p-5 text-left transition-all active:scale-[0.99]"
			>
				<ClipboardDocumentCheckIcon className="h-6 w-6 shrink-0 text-dotori-500" />
				<div className="min-w-0 flex-1">
					<h3 className="font-semibold">입소 준비 체크리스트</h3>
					<p className="mt-0.5 text-[13px] text-dotori-500">
						{facilityType} 기준 필요 서류를 미리 확인하세요
					</p>
				</div>
				<span
					className={cn(
						"text-[13px] font-medium transition-transform",
						showChecklist ? "rotate-180" : "",
					)}
				>
					▼
				</span>
			</button>
			{showChecklist && (
				<div className="border-t border-dotori-100 p-4">
					{checklist ? (
						<ChecklistBlock block={checklist} />
					) : (
						<div className="flex justify-center py-6">
							<div className="h-6 w-6 animate-spin rounded-full border-2 border-dotori-300 border-t-dotori-600" />
						</div>
					)}
				</div>
			)}
		</section>
	);
}
