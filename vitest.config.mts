import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    environment: "node",
    globalSetup: ["tests/setup/global-db.ts"],
    setupFiles: ["tests/setup/env.ts"],
    fileParallelism: false,
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      include: ["src/domain/**"],
      thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
    },
  },
});
