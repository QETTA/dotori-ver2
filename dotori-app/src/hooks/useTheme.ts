"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "dotori-theme";

function getSystemPreference(): "light" | "dark" {
	if (typeof window === "undefined") return "light";
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

function applyTheme(resolved: "light" | "dark") {
	const root = document.documentElement;
	if (resolved === "dark") {
		root.classList.add("dark");
	} else {
		root.classList.remove("dark");
	}
}

/**
 * 다크모드 토글 훅
 *
 * @example
 * const { mode, resolved, setMode } = useTheme();
 * <button onClick={() => setMode(mode === "dark" ? "light" : "dark")}>
 */
export function useTheme() {
	const [mode, setModeState] = useState<ThemeMode>("system");

	// 초기 로드: localStorage에서 복원
	useEffect(() => {
		const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
		const initial = stored === "light" || stored === "dark" || stored === "system"
			? stored
			: "system";
		setModeState(initial);

		const resolved = initial === "system" ? getSystemPreference() : initial;
		applyTheme(resolved);
	}, []);

	// 시스템 테마 변경 감지
	useEffect(() => {
		if (mode !== "system") return;

		const mql = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = (e: MediaQueryListEvent) => {
			applyTheme(e.matches ? "dark" : "light");
		};

		mql.addEventListener("change", handler);
		return () => mql.removeEventListener("change", handler);
	}, [mode]);

	const setMode = useCallback((next: ThemeMode) => {
		setModeState(next);
		localStorage.setItem(STORAGE_KEY, next);
		const resolved = next === "system" ? getSystemPreference() : next;
		applyTheme(resolved);
	}, []);

	const resolved: "light" | "dark" =
		mode === "system" ? getSystemPreference() : mode;

	return { mode, resolved, setMode } as const;
}
