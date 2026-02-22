import { BRAND } from "@/lib/brand-assets";
import { cn } from "@/lib/utils";
import { Button } from "@/components/catalyst/button";
import { Surface } from "@/components/dotori/Surface";

export function ErrorState({
	message,
	detail,
	action,
	variant = "default",
}: {
	message: string;
	detail?: string;
	action?: { label: string; onClick: () => void };
	variant?: "default" | "network" | "notfound";
}) {
	const illustrations: Record<string, string> = {
		default: BRAND.errorState,
		network: BRAND.errorState,
		notfound: BRAND.emptyState,
	};

	const defaultDetails: Record<string, string> = {
		network: "인터넷 연결을 확인해주세요",
		notfound: "요청하신 페이지를 찾을 수 없습니다",
	};

	return (
		<div
			className={cn(
				"px-5 py-6 text-center",
				"motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 duration-300",
			)}
		>
			<Surface className="mx-auto flex max-w-sm flex-col items-center gap-3 p-5">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={illustrations[variant]}
					alt=""
					aria-hidden="true"
					className="h-24 w-24 opacity-80"
				/>
				<p className="text-base font-semibold text-dotori-900 dark:text-dotori-50">{message}</p>
				{(detail || defaultDetails[variant]) ? (
					<p className="max-w-xs text-sm leading-relaxed text-dotori-600 dark:text-dotori-300">
						{detail || defaultDetails[variant]}
					</p>
				) : null}
				{action ? (
					<Button color="dotori" onClick={action.onClick} className="min-h-11 w-full">
						{action.label}
					</Button>
				) : null}
			</Surface>
		</div>
	);
}
