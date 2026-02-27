"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { BRAND } from "@/lib/brand-assets";

/* ── Types ── */

interface ErrorBoundaryProps {
	children: ReactNode;
	/** Custom fallback UI. Receives the error and a reset function. */
	fallback?: ReactNode | ((props: { error: Error; reset: () => void }) => ReactNode);
	/** Callback fired when an error is caught. */
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

/* ── Error reporting ── */

function reportError(error: Error, componentStack: string | null) {
	const payload = {
		message: error.message,
		stack: error.stack ?? null,
		componentStack,
		url: typeof window !== "undefined" ? window.location.href : null,
		timestamp: new Date().toISOString(),
	};

	if (process.env.NODE_ENV === "production") {
		// Fire-and-forget; never block UI
		fetch("/api/analytics/errors", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		}).catch(() => {
			/* swallow — analytics must never throw */
		});
	} else {
		// SSR/test environment — analytics API not available
	}
}

/* ── Component ── */

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		reportError(error, errorInfo.componentStack ?? null);
		this.props.onError?.(error, errorInfo);
	}

	private handleReset = () => {
		this.setState({ hasError: false, error: null });
	};

	render() {
		if (this.state.hasError && this.state.error) {
			// Custom fallback (ReactNode or render-prop)
			if (this.props.fallback) {
				if (typeof this.props.fallback === "function") {
					return this.props.fallback({
						error: this.state.error,
						reset: this.handleReset,
					});
				}
				return this.props.fallback;
			}

			// Default error UI — matches project ErrorState / ErrorFallback pattern
			return (
				<div className={'flex min-h-[60dvh] items-center justify-center'}>
					<div className={'flex flex-col items-center justify-center px-5 py-16 text-center'}>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={BRAND.errorState}
							alt=""
							className={'mb-6 h-36 w-36 opacity-60'}
						/>
						<p className={'text-h2 font-semibold text-dotori-900'}>
							문제가 발생했어요
						</p>
						<p className={'mt-2 max-w-xs text-body leading-relaxed text-dotori-900/60'}>
							일시적인 오류가 발생했습니다. 아래 버튼을 눌러 다시 시도해주세요.
						</p>
						<button
							type="button"
							onClick={this.handleReset}
							className={'mt-5 rounded-3xl bg-dotori-400 px-7 py-4 text-body font-bold text-white transition-all active:scale-[0.97] hover:bg-dotori-600'}
						>
							다시 시도
						</button>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
