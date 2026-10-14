import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts', 'figbot/**/*.test.ts'],
    environment: 'node',
  },
});
