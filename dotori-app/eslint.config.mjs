import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored UI kits
    "tailwind plus/**",
    // Non-production scripts
    "map-test.js",
    "scripts/**",
  ]),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  // Frontend/backend import boundary — prevent frontend from importing backend modules
  {
    files: [
      "src/components/**/*.{ts,tsx}",
      "src/hooks/**/*.{ts,tsx}",
      "src/app/(app)/**/*.{ts,tsx}",
      "src/app/(auth)/**/*.{ts,tsx}",
      "src/app/(landing)/**/*.{ts,tsx}",
      "src/app/(onboarding)/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/models/*",
                "@/lib/db",
                "@/lib/mongodb",
                "@/lib/api-handler",
                "@/lib/rate-limit",
                "@/lib/api-error",
                "@/lib/validations",
                "@/lib/cron-auth",
                "@/lib/cron-lock",
                "@/lib/chat-quota",
                "@/lib/services/*",
              ],
              message:
                "Frontend cannot import backend modules (models, db, services, api-handler). Use apiFetch() instead.",
            },
          ],
        },
      ],
    },
  },
  // Backend/frontend import boundary — prevent API routes from importing frontend modules
  {
    files: ["src/app/api/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/components/*",
                "@/lib/design-system/*",
                "@/lib/motion",
              ],
              message:
                "API routes cannot import frontend modules (components, design-system, motion).",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
