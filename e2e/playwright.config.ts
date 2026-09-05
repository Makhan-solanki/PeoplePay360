import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev -w backend',
      port: 3001,
      timeout: 30000,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: 'test',
        PORT: '3001',
        DATABASE_URL: 'postgresql://hackathon:hackathon_secret@localhost:5432/hackathon_db?schema=public',
        JWT_SECRET: 'e2e-test-jwt-secret-that-is-long-enough-32chars',
        JWT_REFRESH_SECRET: 'e2e-test-refresh-secret-that-is-long-enough-32chars',
        JWT_ACCESS_EXPIRY: '15m',
        JWT_REFRESH_EXPIRY: '7d',
        CORS_ORIGINS: 'http://localhost:3000',
        RATE_LIMIT_MAX: '100',
        RATE_LIMIT_WINDOW_MINUTES: '15',
      },
    },
    {
      command: 'npm run dev -w frontend',
      port: 3000,
      timeout: 30000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
