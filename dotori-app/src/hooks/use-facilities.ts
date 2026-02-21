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
	sort?: "distance" | "rating" | "capacity";
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

interface FacilityCacheEntry {
	paramsKey: string;
	timestamp: number;
	page: number;
	facilities: Facility[];
	total: number;
	totalPages: number;
}

const facilityCache = new Map<string, FacilityCacheEntry>();
const FACILITY_CACHE_TTL_MS = 30_000;

function buildRequestParams(
	params: UseFacilitiesParams,
	page: number,
): Record<string, string | number> {
	const requestParams: Record<string, string | number> = {
		page,
		limit: params.limit ?? 20,
	};

	if (params.search) requestParams.search = params.search;
	if (params.type) requestParams.type = params.type;
	if (params.status) requestParams.status = params.status;
	if (params.sido) requestParams.sido = params.sido;
	if (params.sigungu) requestParams.sigungu = params.sigungu;
	if (params.sort) requestParams.sort = params.sort;

	return requestParams;
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

	const buildUrl = useCallback((requestParams: Record<string, string | number>) => {
		const sp = new URLSearchParams();
		Object.entries(requestParams).forEach(([key, value]) => {
			sp.set(key, String(value));
		});
		return `/api/facilities?${sp.toString()}`;
	}, []);

	const fetchPage = useCallback(
		async (p: number, append: boolean) => {
			const requestParams = buildRequestParams(params, p);
			const cacheKey = JSON.stringify(requestParams);
			abortRef.current?.abort();
			const controller = new AbortController();
			abortRef.current = controller;
			const now = Date.now();

			const cacheEntry = facilityCache.get(cacheKey);
			if (
				cacheEntry &&
				cacheEntry.paramsKey === cacheKey &&
				now - cacheEntry.timestamp < FACILITY_CACHE_TTL_MS
			) {
				if (append) setFacilities((prev) => [...prev, ...cacheEntry.facilities]);
				else setFacilities(cacheEntry.facilities);
				setTotal(cacheEntry.total);
				setTotalPages(cacheEntry.totalPages);
				setPage(cacheEntry.page);

				if (abortRef.current === controller) {
					setIsLoading(false);
					setIsLoadingMore(false);
				}
				return;
			}

			if (append) setIsLoadingMore(true);
			else setIsLoading(true);
			setError(null);

			try {
				const res = await apiFetch<FacilitiesResponse>(buildUrl(requestParams), {
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
				facilityCache.set(cacheKey, {
					paramsKey: cacheKey,
					timestamp: Date.now(),
					page: p,
					facilities: res.data,
					total: res.pagination.total,
					totalPages: res.pagination.totalPages,
				});
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
		[params, buildUrl],
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
