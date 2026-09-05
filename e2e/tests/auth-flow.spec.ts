import { test, expect } from '@playwright/test';

const uniqueEmail = `e2e-${Date.now()}@hack.dev`;
const password = 'TestPassword123!';

test.describe('Auth Flow E2E', () => {
  test('complete auth flow: register → login → dashboard → logout', async ({ page }) => {
    // ---- Step 1: Navigate to home ----
    await page.goto('/');
    await expect(page.locator('text=Hackathon 2026')).toBeVisible();

    // ---- Step 2: Navigate to register ----
    await page.click('#home-register-btn, #navbar-register');
    await expect(page).toHaveURL(/\/register/);

    // ---- Step 3: Register ----
    await page.fill('#register-email', uniqueEmail);
    await page.fill('#register-password', password);
    await page.fill('#register-confirm-password', password);
    await page.click('#register-submit');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.locator('#dashboard-title')).toHaveText('Dashboard');

    // ---- Step 4: Verify user info on dashboard ----
    await expect(page.locator('#dashboard-role')).toHaveText('USER');
    await expect(page.locator('#dashboard-status')).toHaveText('Active');

    // ---- Step 5: Logout ----
    await page.click('#navbar-logout');

    // Should redirect to login or show login state
    await page.waitForTimeout(1000);
    await expect(page.locator('#navbar-login, #home-login-btn')).toBeVisible();

    // ---- Step 6: Login with same credentials ----
    await page.goto('/login');
    await page.fill('#login-email', uniqueEmail);
    await page.fill('#login-password', password);
    await page.click('#login-submit');

    // Should redirect to dashboard again
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.locator('#dashboard-title')).toHaveText('Dashboard');

    // ---- Step 7: Try accessing admin (should be denied for USER role) ----
    await page.goto('/admin');
    await expect(page.locator('text=Access Denied')).toBeVisible();
  });
});
