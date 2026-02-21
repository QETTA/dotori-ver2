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

const backgroundByType: Record<ToastProps["type"], string> = {
	success: "bg-forest-500",
	error: "bg-danger",
	info: "bg-dotori-900",
	undo: "bg-dotori-900",
};

const iconClassByType: Record<ToastProps["type"], string> = {
	success: "text-white",
	error: "text-white",
	info: "text-white",
	undo: "text-dotori-100",
};

export function Toast({ type, message, action, onDismiss }: ToastProps) {
	const [isDragging, setIsDragging] = useState(false);

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
				"pointer-events-auto relative mx-4 mb-2 flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-white shadow-2xl",
				backgroundByType[type],
			)}
		>
			<motion.div
				className="absolute -top-1 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-white/60"
				animate={{ opacity: isDragging ? 0.95 : 0.35 }}
				transition={{ duration: 0.2 }}
			/>
			{type === "success" && (
				<CheckCircleIcon className={cn("h-5 w-5", iconClassByType[type])} />
			)}
			{type === "error" && <XCircleIcon className={cn("h-5 w-5", iconClassByType[type])} />}
			{type === "info" && (
				<InformationCircleIcon className={cn("h-5 w-5", iconClassByType[type])} />
			)}
			{type === "undo" && (
				<ArrowUturnLeftIcon className={cn("h-5 w-5", iconClassByType[type])} />
			)}
			<span className="flex-1 text-[15px]">{message}</span>
			{action && (
				<button
					onClick={action.onClick}
					className="text-[15px] font-semibold text-white/90 hover:text-white"
				>
					{action.label}
				</button>
			)}
		</motion.div>
	);
}
