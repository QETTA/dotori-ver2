"use client";

import { AnimatePresence } from "motion/react";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import type { ToastData } from "@/types/dotori";
import { DS_LAYOUT, DS_TOAST } from "@/lib/design-system/tokens";
import { cn } from "@/lib/utils";
import { Toast } from "./Toast";

interface ToastContextValue {
	addToast: (toast: Omit<ToastData, "id">) => void;
}

const ToastContext = createContext<ToastContextValue>({
	addToast: () => {},
});

export function useToast() {
	return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<ToastData[]>([]);
	const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
		const timer = timers.current.get(id);
		if (timer) {
			clearTimeout(timer);
			timers.current.delete(id);
		}
	}, []);

	const addToast = useCallback(
		(toast: Omit<ToastData, "id">) => {
			const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
			const newToast: ToastData = { ...toast, id };
			setToasts((prev) => [...prev.slice(-2), newToast]);

			const timer = setTimeout(() => removeToast(id), toast.duration || 4000);
			timers.current.set(id, timer);
		},
		[removeToast],
	);

	useEffect(() => {
		const currentTimers = timers.current;
		return () => {
			currentTimers.forEach((timer) => clearTimeout(timer));
		};
	}, []);

	return (
		<ToastContext.Provider value={{ addToast }}>
			{children}
			<div className={cn(DS_TOAST.STACK_WRAP, DS_LAYOUT.SAFE_AREA_TOAST)}>
				<AnimatePresence>
					{toasts.map((t) => (
						<Toast key={t.id} {...t} onDismiss={() => removeToast(t.id)} />
					))}
				</AnimatePresence>
			</div>
		</ToastContext.Provider>
	);
}
