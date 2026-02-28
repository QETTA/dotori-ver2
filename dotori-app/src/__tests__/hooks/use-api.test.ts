// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

/* ─── Hoisted Mocks ─── */
const { apiFetchMock } = vi.hoisted(() => ({
	apiFetchMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
	apiFetch: apiFetchMock,
}));

beforeEach(() => {
	vi.clearAllMocks();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("useApi", () => {
	it("fetches data successfully", async () => {
		apiFetchMock.mockResolvedValueOnce({ name: "test" });

		const { useApi } = await import("@/hooks/use-api");
		const { result } = renderHook(() => useApi<{ name: string }>("/api/test"));

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.data).toEqual({ name: "test" });
		expect(result.current.error).toBeNull();
	});

	it("sets error on fetch failure", async () => {
		apiFetchMock.mockRejectedValueOnce(new Error("네트워크 오류"));

		const { useApi } = await import("@/hooks/use-api");
		const { result } = renderHook(() => useApi<unknown>("/api/fail"));

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.data).toBeNull();
		expect(result.current.error).toBe("네트워크 오류");
	});

	it("skips fetch when path is null", async () => {
		const { useApi } = await import("@/hooks/use-api");
		const { result } = renderHook(() => useApi<unknown>(null));

		expect(result.current.isLoading).toBe(false);
		expect(result.current.data).toBeNull();
		expect(apiFetchMock).not.toHaveBeenCalled();
	});

	it("refetches data on refetch call", async () => {
		apiFetchMock
			.mockResolvedValueOnce({ count: 1 })
			.mockResolvedValueOnce({ count: 2 });

		const { useApi } = await import("@/hooks/use-api");
		const { result } = renderHook(() => useApi<{ count: number }>("/api/data"));

		await waitFor(() => {
			expect(result.current.data).toEqual({ count: 1 });
		});

		await act(async () => {
			result.current.refetch();
		});

		await waitFor(() => {
			expect(result.current.data).toEqual({ count: 2 });
		});
	});

	it("sets isLoading true initially when path is provided", async () => {
		apiFetchMock.mockResolvedValueOnce({ data: "ok" });

		const { useApi } = await import("@/hooks/use-api");
		const { result } = renderHook(() => useApi<unknown>("/api/test"));

		// Initial state before resolution
		expect(result.current.isLoading).toBe(true);

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});
	});

	it("sets isLoading false when path is null", async () => {
		const { useApi } = await import("@/hooks/use-api");
		const { result } = renderHook(() => useApi(null));

		expect(result.current.isLoading).toBe(false);
	});

	it("extracts message from non-Error thrown values", async () => {
		apiFetchMock.mockRejectedValueOnce("string error");

		const { useApi } = await import("@/hooks/use-api");
		const { result } = renderHook(() => useApi<unknown>("/api/fail2"));

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.error).toBe("데이터를 불러오지 못했어요");
	});
});
