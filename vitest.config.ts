import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/vitest-setup.ts'],
    deps: {
      optimizer: {
        web: {
          // ref: https://github.com/vitest-dev/vitest/discussions/2055
          include: ['@phosphor-icons/react'],
        },
      },
    },
  },
});
