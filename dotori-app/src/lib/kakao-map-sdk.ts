export type KakaoMapSdkStatus =
	| "ok"
	| "missing_key"
	| "unauthorized"
	| "invalid_key"
	| "unavailable";

export interface KakaoMapSdkCheckResult {
	status: KakaoMapSdkStatus;
	message: string;
	upstreamStatus?: number;
	errorType?: string;
}

interface ParsedKakaoError {
	errorType?: string;
	message?: string;
}

interface EvaluateKakaoMapSdkResponseInput {
	httpStatus: number;
	bodyText: string;
}

function parseKakaoError(bodyText: string): ParsedKakaoError | null {
	try {
		const parsed = JSON.parse(bodyText) as ParsedKakaoError;
		if (parsed && typeof parsed === "object") {
			return parsed;
		}
		return null;
	} catch {
		return null;
	}
}

function isUnauthorizedMapService(errorType: string, message: string): boolean {
	return errorType === "NotAuthorizedError" || message.includes("OPEN_MAP_AND_LOCAL");
}

function isInvalidAppKey(message: string): boolean {
	return message.includes("invalid") && message.includes("app");
}

export function evaluateKakaoMapSdkResponse({
	httpStatus,
	bodyText,
}: EvaluateKakaoMapSdkResponseInput): KakaoMapSdkCheckResult {
	if (httpStatus === 200 && bodyText.includes("kakao.maps")) {
		return {
			status: "ok",
			message: "카카오 지도 SDK를 정상적으로 불러왔어요.",
			upstreamStatus: httpStatus,
		};
	}

	const parsedError = parseKakaoError(bodyText);
	const errorType = parsedError?.errorType || "";
	const message = parsedError?.message || "";
	const normalizedMessage = message.toLowerCase();

	if (isUnauthorizedMapService(errorType, message)) {
		return {
			status: "unauthorized",
			message:
				"카카오 지도 권한이 비활성화되어 있어요. Kakao Developers에서 Maps/Local 서비스를 활성화해주세요.",
			upstreamStatus: httpStatus,
			errorType,
		};
	}

	if (isInvalidAppKey(normalizedMessage)) {
		return {
			status: "invalid_key",
			message:
				"카카오 지도 앱 키가 올바르지 않아요. NEXT_PUBLIC_KAKAO_MAP_KEY 설정을 확인해주세요.",
			upstreamStatus: httpStatus,
			errorType,
		};
	}

	return {
		status: "unavailable",
		message: "카카오 지도 SDK를 확인할 수 없어요. 잠시 후 다시 시도해주세요.",
		upstreamStatus: httpStatus,
		errorType: errorType || undefined,
	};
}
