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
    // Default for files with no `// @vitest-environment` pragma. Pure-logic
    // test files (src/utils, src/data) opt into `node` per-file to skip
    // jsdom construction, which otherwise dominates suite runtime (OQ-41).
    environment: 'jsdom',
    pool: 'vmThreads',
    setupFiles: './src/test/setup.js',
    globals: true,
    // .claude/worktrees/ holds full checkouts of other branches, made by the
    // local agent tooling. Collecting their test files would run a second
    // copy of the suite against code that is not this branch's.
    exclude: ['**/node_modules/**', 'e2e/**', '.claude/worktrees/**'],
  },
}))
