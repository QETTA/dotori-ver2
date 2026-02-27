"use client";

import { cn } from "@/lib/utils";
import type { ToastData } from "@/types/dotori";
import { motion } from "motion/react";
import { useState } from "react";
import { DS_TOAST } from "@/lib/design-system/tokens";
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
		container: DS_TOAST.SUCCESS_CONTAINER,
		icon: DS_TOAST.SUCCESS_ICON,
		action: DS_TOAST.SUCCESS_ACTION,
	},
	error: {
		container: DS_TOAST.ERROR_CONTAINER,
		icon: DS_TOAST.ERROR_ICON,
		action: DS_TOAST.ERROR_ACTION,
	},
	info: {
		container: DS_TOAST.INFO_CONTAINER,
		icon: DS_TOAST.INFO_ICON,
		action: DS_TOAST.INFO_ACTION,
	},
	undo: {
		container: DS_TOAST.UNDO_CONTAINER,
		icon: DS_TOAST.UNDO_ICON,
		action: DS_TOAST.UNDO_ACTION,
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
				DS_TOAST.CONTAINER_BASE,
				tone.container,
			)}
		>
			<motion.div
				className={DS_TOAST.HANDLE_BAR}
				animate={{ opacity: isDragging ? 0.95 : 0.35 }}
				transition={{ duration: 0.2 }}
			/>
			{type === "success" && (
				<CheckCircleIcon className={cn(DS_TOAST.ICON_BASE, tone.icon)} />
			)}
			{type === "error" && <XCircleIcon className={cn(DS_TOAST.ICON_BASE, tone.icon)} />}
			{type === "info" && (
				<InformationCircleIcon className={cn(DS_TOAST.ICON_BASE, tone.icon)} />
			)}
			{type === "undo" && (
				<ArrowUturnLeftIcon className={cn(DS_TOAST.ICON_BASE, tone.icon)} />
			)}
			<span className={DS_TOAST.MESSAGE}>{message}</span>
			{action ? (
				<button
					type="button"
					onClick={action.onClick}
					className={cn(
						DS_TOAST.ACTION_BUTTON,
						tone.action,
					)}
				>
					{action.label}
				</button>
			) : null}
		</motion.div>
	);
}
