"use client";

import { cn } from "@/lib/utils";
import type { ToastData } from "@/types/dotori";
import { motion } from "motion/react";
import { useState } from "react";
import {
	ArrowUturnLeftIcon,
	CheckCircleIcon,
	InformationCircleIcon,
	XCircleIcon,
} from "@heroicons/react/24/outline";

type ToastProps = ToastData & { onDismiss: () => void };

const toneByType: Record<
	ToastProps["type"],
	{ container: string; icon: string; action: string }
> = {
	success: {
		container:
			"bg-forest-100 text-forest-800 border-forest-200 dark:bg-forest-900/20 dark:text-forest-100 dark:border-forest-700/40",
		icon: "text-forest-700 dark:text-forest-100",
		action:
			"text-forest-900 hover:text-forest-950 dark:text-forest-100 dark:hover:text-white",
	},
	error: {
		container:
			"bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-100 dark:border-red-700/40",
		icon: "text-red-600 dark:text-red-100",
		action:
			"text-red-800 hover:text-red-900 dark:text-red-100 dark:hover:text-white",
	},
	info: {
		container:
			"bg-dotori-900 text-white border-dotori-900/20 dark:bg-dotori-900/40 dark:text-dotori-50 dark:border-dotori-700/40",
		icon: "text-white",
		action: "text-white/90 hover:text-white",
	},
	undo: {
		container:
			"bg-dotori-900 text-white border-dotori-900/20 dark:bg-dotori-900/40 dark:text-dotori-50 dark:border-dotori-700/40",
		icon: "text-white",
		action: "text-white/90 hover:text-white",
	},
};

export function Toast({ type, message, action, onDismiss }: ToastProps) {
	const [isDragging, setIsDragging] = useState(false);
	const tone = toneByType[type];

	return (
		<motion.div
			role="alert"
			aria-live="polite"
			initial={{ y: 20, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			exit={{ y: 20, opacity: 0 }}
			drag="x"
			dragConstraints={{ left: -96, right: 96 }}
			dragElastic={0.15}
			onDragStart={() => setIsDragging(true)}
			onDragEnd={(_, info) => {
				setIsDragging(false);
				if (Math.abs(info.offset.x) > 52) {
					onDismiss();
				}
			}}
			className={cn(
				"pointer-events-auto relative mx-4 mb-2 flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md dark:shadow-none",
				tone.container,
			)}
		>
			<motion.div
				className="absolute -top-1 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-current"
				animate={{ opacity: isDragging ? 0.95 : 0.35 }}
				transition={{ duration: 0.2 }}
			/>
			{type === "success" && (
				<CheckCircleIcon className={cn("h-5 w-5", tone.icon)} />
			)}
			{type === "error" && <XCircleIcon className={cn("h-5 w-5", tone.icon)} />}
			{type === "info" && (
				<InformationCircleIcon className={cn("h-5 w-5", tone.icon)} />
			)}
			{type === "undo" && (
				<ArrowUturnLeftIcon className={cn("h-5 w-5", tone.icon)} />
			)}
			<span className="min-w-0 flex-1 text-sm leading-snug">{message}</span>
			{action ? (
				<button
					type="button"
					onClick={action.onClick}
					className={cn(
						"min-h-11 shrink-0 rounded-lg px-3 text-sm font-semibold transition-transform active:scale-[0.97]",
						tone.action,
					)}
				>
					{action.label}
				</button>
			) : null}
		</motion.div>
	);
}
