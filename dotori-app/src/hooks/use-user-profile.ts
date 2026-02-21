"use client";

import { apiFetch } from "@/lib/api";
import type { UserProfile } from "@/types/dotori";
import { useCallback, useEffect, useRef, useState } from "react";

interface UserProfileData {
	user: UserProfile | null;
	interestsCount: number;
	waitlistCount: number;
	alertCount: number;
	isLoading: boolean;
	error: string | null;
	refresh: () => void;
}

export function useUserProfile(): UserProfileData {
	const [user, setUser] = useState<UserProfile | null>(null);
	const [interestsCount, setInterestsCount] = useState(0);
	const [waitlistCount, setWaitlistCount] = useState(0);
	const [alertCount, setAlertCount] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const mountedRef = useRef(true);

	const fetchProfile = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			const [meRes, waitlistRes, alertsRes] =
				await Promise.allSettled([
					apiFetch<{ data: UserProfile }>("/api/users/me"),
					apiFetch<{ data: { count: number } }>("/api/waitlist?count=true"),
					apiFetch<{ data: unknown[] }>("/api/alerts"),
				]);

			if (!mountedRef.current) return;

			if (meRes.status === "fulfilled") {
				const profile = meRes.value.data;
				setUser(profile);
				setInterestsCount(profile.interests?.length ?? 0);
			}
			if (waitlistRes.status === "fulfilled") {
				const d = waitlistRes.value.data;
				if (d && typeof d === "object" && "count" in d && typeof d.count === "number") {
					setWaitlistCount(d.count);
				}
			}
			if (alertsRes.status === "fulfilled") {
				const d = alertsRes.value.data;
				setAlertCount(Array.isArray(d) ? d.length : 0);
			}
		} catch {
			if (!mountedRef.current) return;
			setError("프로필을 불러오지 못했어요");
		} finally {
			if (mountedRef.current) {
				setIsLoading(false);
			}
		}
	}, []);

	useEffect(() => {
		mountedRef.current = true;
		fetchProfile();
		return () => {
			mountedRef.current = false;
		};
	}, [fetchProfile]);

	return {
		user,
		interestsCount,
		waitlistCount,
		alertCount,
		isLoading,
		error,
		refresh: fetchProfile,
	};
}
