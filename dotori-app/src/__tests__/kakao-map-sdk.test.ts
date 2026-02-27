import { describe, expect, it } from "vitest";
import { evaluateKakaoMapSdkResponse } from "@/lib/kakao-map-sdk";

describe("evaluateKakaoMapSdkResponse", () => {
	it("returns ok when sdk script body is valid", () => {
		const result = evaluateKakaoMapSdkResponse({
			httpStatus: 200,
			bodyText: "window.kakao.maps.load(function(){});",
		});

		expect(result.status).toBe("ok");
	});

	it("returns unauthorized for OPEN_MAP_AND_LOCAL disabled response", () => {
		const result = evaluateKakaoMapSdkResponse({
			httpStatus: 404,
			bodyText: JSON.stringify({
				errorType: "NotAuthorizedError",
				message: "App disabled OPEN_MAP_AND_LOCAL service.",
			}),
		});

		expect(result.status).toBe("unauthorized");
		expect(result.message).toContain("Maps/Local");
	});

	it("returns invalid_key for invalid app key response", () => {
		const result = evaluateKakaoMapSdkResponse({
			httpStatus: 401,
			bodyText: JSON.stringify({
				errorType: "InvalidAppKeyError",
				message: "invalid app key",
			}),
		});

		expect(result.status).toBe("invalid_key");
	});
});
