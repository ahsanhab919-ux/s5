import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/Shothik/);
});

test('paraphrase page loads', async ({ page }) => {
    await page.goto('/paraphrase');

    // Expect the title to verify we are on the right page
    await expect(page).toHaveTitle(/Paraphrase/);
});
