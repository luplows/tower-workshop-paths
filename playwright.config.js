import { defineConfig, devices } from '@playwright/test'

// Set by .claude/hooks/session-start.sh only when Claude Code on the web has a
// pre-installed chromium that is not the revision @playwright/test expects,
// and the sandbox blocks cdn.playwright.dev so the matching build cannot be
// downloaded. Unset on local machines and in CI, where Playwright's own
// managed browser is used as usual.
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5183',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(chromiumExecutable
          ? { launchOptions: { executablePath: chromiumExecutable } }
          : {}),
      },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 5183 --strictPort',
    url: 'http://localhost:5183',
    reuseExistingServer: !process.env.CI,
  },
})
