import { describe, expect, it, vi } from "vitest";

import { subscribeToMediaQueryListChange } from "@/hooks/useTheme";

describe("subscribeToMediaQueryListChange", () => {
	it("uses addEventListener/removeEventListener when available", () => {
		const onChange = vi.fn();
		const addEventListener = vi.fn();
		const removeEventListener = vi.fn();

		const mql = {
			matches: false,
			addEventListener,
			removeEventListener,
		} as unknown as MediaQueryList;

		const unsubscribe = subscribeToMediaQueryListChange(mql, onChange);

		expect(addEventListener).toHaveBeenCalledTimes(1);
		expect(addEventListener).toHaveBeenCalledWith("change", expect.any(Function));

		const handler = addEventListener.mock.calls[0]?.[1] as (event: { matches: boolean }) => void;
		handler({ matches: true });
		expect(onChange).toHaveBeenCalledWith(true);

		unsubscribe();
		expect(removeEventListener).toHaveBeenCalledWith("change", handler);
	});

	it("falls back to addListener/removeListener when addEventListener is missing", () => {
		const onChange = vi.fn();
		const addListener = vi.fn();
		const removeListener = vi.fn();

		const mql = {
			matches: false,
			addListener,
			removeListener,
		} as unknown as MediaQueryList;

		const unsubscribe = subscribeToMediaQueryListChange(mql, onChange);

		expect(addListener).toHaveBeenCalledTimes(1);
		expect(addListener).toHaveBeenCalledWith(expect.any(Function));

		const handler = addListener.mock.calls[0]?.[0] as (event: { matches: boolean }) => void;
		handler({ matches: true });
		expect(onChange).toHaveBeenCalledWith(true);

		unsubscribe();
		expect(removeListener).toHaveBeenCalledWith(handler);
	});
});
