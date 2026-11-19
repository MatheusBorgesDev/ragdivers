import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    globals: true,
    environment: 'node',
    projects: [
      {
        // Server code and eval checks, in Node.
        extends: true,
        test: { name: 'unit', include: ['tests/unit/**/*.test.ts', 'evals/**/*.test.ts'] },
      },
      {
        // Browser-side code (src/), in a simulated browser.
        extends: true,
        test: {
          name: 'web',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          setupFiles: ['src/web/test/setup.ts'],
        },
      },
      {
        // Needs the local Supabase running (pnpm db:start).
        extends: true,
        test: { name: 'db', include: ['tests/db/**/*.test.ts'] },
      },
    ],
  },
})
