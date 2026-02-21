"use client";

import {
	ArrowUturnLeftIcon,
	CheckCircleIcon,
	InformationCircleIcon,
	XCircleIcon,
} from "@heroicons/react/24/outline";
import { motion } from "motion/react";
import type { ToastData } from "@/types/dotori";

const iconMap = {
	success: <CheckCircleIcon className="h-5 w-5 text-forest-400" />,
	error: <XCircleIcon className="h-5 w-5 text-red-400" />,
	info: <InformationCircleIcon className="h-5 w-5 text-blue-400" />,
	undo: <ArrowUturnLeftIcon className="h-5 w-5 text-dotori-300" />,
};

export function Toast({ type, message, action }: ToastData) {
	return (
		<motion.div
			role="alert"
			aria-live="polite"
			initial={{ y: 20, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			exit={{ y: 20, opacity: 0 }}
			className="mx-4 mb-2 flex items-center gap-3 rounded-xl bg-dotori-900 px-4 py-3 text-white shadow-2xl"
		>
			{iconMap[type]}
			<span className="flex-1 text-[15px]">{message}</span>
			{action && (
				<button
					onClick={action.onClick}
					className="text-[15px] font-semibold text-dotori-300 hover:text-white"
				>
					{action.label}
				</button>
			)}
		</motion.div>
	);
}
