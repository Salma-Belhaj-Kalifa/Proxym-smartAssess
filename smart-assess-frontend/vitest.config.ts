import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'junit'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'src/main.tsx'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
      junit: {
        outputFile: './test-results/junit.xml',
        suiteName: 'Smart Assess Frontend Tests',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' > ',
        usePathForSuiteName: true
      }
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  reporters: ['verbose', 'html', 'junit'],
});
