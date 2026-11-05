import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`.
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    // Юнит-тесты лежат рядом с исходниками; e2e живут в test/ и
    // запускаются отдельным конфигом (vitest.config.e2e.ts).
    include: ['src/**/*.spec.ts'],
  },
});
