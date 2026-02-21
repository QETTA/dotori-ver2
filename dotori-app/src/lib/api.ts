class ApiError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message);
		this.name = "ApiError";
	}
}

export async function apiFetch<T>(
	path: string,
	options?: RequestInit,
): Promise<T> {
	// 클라이언트: 상대 경로 사용 (CORS 방지), 서버: 절대 URL 필요
	const isServer = typeof window === "undefined";
	const baseUrl = isServer
		? (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
		: "";
	const url = path.startsWith("http") ? path : `${baseUrl}${path}`;

	const res = await fetch(url, {
		headers: {
			"Content-Type": "application/json",
			...options?.headers,
		},
		...options,
	});

	if (!res.ok) {
		const body = await res.text();
		let message = res.statusText;
		try {
			const parsed = JSON.parse(body);
			message = parsed.error || parsed.message || body;
		} catch {
			message = body || res.statusText;
		}
		throw new ApiError(res.status, message);
	}

	return res.json();
}
