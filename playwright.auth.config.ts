import base from "./playwright.config";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  ...base,
  outputDir: "test-results-auth",
  testMatch: "auth.spec.ts",
  testIgnore: [],
  use: { ...base.use, baseURL: "http://127.0.0.1:5174" },
  webServer: {
    command: "npm run dev -- --port 5174 --strictPort",
    url: "http://127.0.0.1:5174",
    reuseExistingServer: false,
    env: {
      VITE_SUPABASE_URL: "https://accounts.example.test",
      VITE_SUPABASE_ANON_KEY: "public-test-key",
      VITE_SUPABASE_PUBLISHABLE_KEY: "public-test-key",
      VITE_AUTH_EMAIL_ENABLED: "true",
    },
  },
});
