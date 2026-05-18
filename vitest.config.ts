import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',          // default
    setupFiles: ['./test/shared/setup.lobster.ts'],
    include: ['test/**/*.lobster.test.ts'],
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/server/**', 'src/shared/lib/**', 'src/services/**'],
    }
  }
});
