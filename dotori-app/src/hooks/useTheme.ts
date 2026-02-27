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

export function subscribeToMediaQueryListChange(
	mql: MediaQueryList,
	onChange: (matches: boolean) => void,
) {
	const handler = (event?: { matches?: boolean }) => {
		onChange(event?.matches ?? mql.matches);
	};

	if (
		typeof mql.addEventListener === "function" &&
		typeof mql.removeEventListener === "function"
	) {
		const typedHandler = handler as (event: MediaQueryListEvent) => void;
		mql.addEventListener("change", typedHandler);
		return () => mql.removeEventListener("change", typedHandler);
	}

	if (
		typeof mql.addListener === "function" &&
		typeof mql.removeListener === "function"
	) {
		const typedHandler = handler as (event: MediaQueryListEvent) => void;
		mql.addListener(typedHandler);
		return () => mql.removeListener(typedHandler);
	}

	return () => {};
}

/**
 * 다크모드 토글 훅
 *
 * @example
 * const { mode, resolved, setMode } = useTheme();
 * <button onClick={() => setMode(mode === "dark" ? "light" : "dark")}>
 */
function getInitialMode(): ThemeMode {
	if (typeof window === "undefined") return "light";
	const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
	return stored === "light" || stored === "dark" || stored === "system"
		? stored
		: "light";
}

export function useTheme() {
	const [mode, setModeState] = useState<ThemeMode>(getInitialMode);

	// 초기 DOM 적용 (mode 변경 시마다 동기화)
	useEffect(() => {
		const resolved = mode === "system" ? getSystemPreference() : mode;
		applyTheme(resolved);
	}, [mode]);

	// 시스템 테마 변경 감지
	useEffect(() => {
		if (mode !== "system") return;

		const mql = window.matchMedia("(prefers-color-scheme: dark)");
		return subscribeToMediaQueryListChange(mql, (matches) => {
			applyTheme(matches ? "dark" : "light");
		});
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
