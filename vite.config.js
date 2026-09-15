/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  plugins: [react()],
  // GitHub Pages serves this repo at /tower-workshop-paths/, not the domain
  // root -- applied to `vite build` and `vite preview` (which serves that
  // build's own output, so it needs the same base to resolve correctly),
  // but not the plain `vite`/`npm run dev` server, which keeps serving from
  // / as usual.
  base: command === 'build' || isPreview ? '/tower-workshop-paths/' : '/',
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    globals: true,
    exclude: ['**/node_modules/**', 'e2e/**'],
  },
}))
