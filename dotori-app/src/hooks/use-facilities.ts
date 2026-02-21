"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Facility } from "@/types/dotori";

interface FacilitiesResponse {
	data: Facility[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

interface UseFacilitiesParams {
	search?: string;
	type?: string;
	status?: string;
	sido?: string;
	sigungu?: string;
	limit?: number;
}

interface UseFacilitiesReturn {
	facilities: Facility[];
	total: number;
	totalPages: number;
	page: number;
	isLoading: boolean;
	isLoadingMore: boolean;
	error: string | null;
	loadMore: () => void;
	refresh: () => void;
	hasMore: boolean;
}

export function useFacilities(
	params: UseFacilitiesParams = {},
): UseFacilitiesReturn {
	const [facilities, setFacilities] = useState<Facility[]>([]);
	const [page, setPage] = useState(1);
	const [total, setTotal] = useState(0);
	const [totalPages, setTotalPages] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const abortRef = useRef<AbortController | null>(null);

	const buildUrl = useCallback(
		(p: number) => {
			const sp = new URLSearchParams();
			sp.set("page", String(p));
			sp.set("limit", String(params.limit ?? 20));
			if (params.search) sp.set("search", params.search);
			if (params.type) sp.set("type", params.type);
			if (params.status) sp.set("status", params.status);
			if (params.sido) sp.set("sido", params.sido);
			if (params.sigungu) sp.set("sigungu", params.sigungu);
			return `/api/facilities?${sp.toString()}`;
		},
		[params.search, params.type, params.status, params.sido, params.sigungu, params.limit],
	);

	const fetchPage = useCallback(
		async (p: number, append: boolean) => {
			abortRef.current?.abort();
			const controller = new AbortController();
			abortRef.current = controller;

			if (append) setIsLoadingMore(true);
			else setIsLoading(true);
			setError(null);

			try {
				const res = await apiFetch<FacilitiesResponse>(buildUrl(p), {
					signal: controller.signal,
				});
				// Don't update state if this request was aborted
				if (controller.signal.aborted) return;
				setFacilities((prev) =>
					append ? [...prev, ...res.data] : res.data,
				);
				setTotal(res.pagination.total);
				setTotalPages(res.pagination.totalPages);
				setPage(p);
			} catch (err) {
				if (err instanceof DOMException && err.name === "AbortError") return;
				setError(
					err instanceof Error
						? err.message
						: "시설 목록을 불러올 수 없습니다",
				);
			} finally {
				// Only clear loading state if this controller is still the active one
				if (abortRef.current === controller) {
					setIsLoading(false);
					setIsLoadingMore(false);
				}
			}
		},
		[buildUrl],
	);

	useEffect(() => {
		fetchPage(1, false);
		return () => abortRef.current?.abort();
	}, [fetchPage]);

	const loadMore = useCallback(() => {
		if (page < totalPages && !isLoadingMore) {
			fetchPage(page + 1, true);
		}
	}, [page, totalPages, isLoadingMore, fetchPage]);

	const refresh = useCallback(() => {
		setFacilities([]);
		fetchPage(1, false);
	}, [fetchPage]);

	return {
		facilities,
		total,
		totalPages,
		page,
		isLoading,
		isLoadingMore,
		error,
		loadMore,
		refresh,
		hasMore: page < totalPages,
	};
}
