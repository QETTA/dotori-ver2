import type { Config } from "jest";

const config: Config = {
	testEnvironment: "node",
	transform: {
		"^.+\\.(ts|tsx)$": "ts-jest",
	},
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
	},
	testMatch: [
		"<rootDir>/src/lib/engine/__tests__/intent-classifier.test.ts",
		"<rootDir>/src/lib/engine/__tests__/response-builder.test.ts",
	],
};

export default config;
