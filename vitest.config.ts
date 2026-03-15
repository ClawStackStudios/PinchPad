import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',          // default
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/server/**', 'src/lib/**', 'src/services/**'],
      exclude: ['src/server/db.ts']
    }
  }
});
