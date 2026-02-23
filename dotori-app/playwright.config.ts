import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: ".",
	testMatch: ["e2e/**/*.spec.ts", "src/__tests__/e2e/**/*.spec.ts"],
	use: {
		baseURL: process.env.BASE_URL || "http://localhost:3000",
	},
	projects: [
		{
			name: "mobile",
			use: {
				viewport: { width: 375, height: 812 },
			},
		},
	],
	webServer: {
		command: "npm run start",
		port: 3000,
		reuseExistingServer: true,
	},
});
