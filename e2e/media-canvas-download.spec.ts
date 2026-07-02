import { test, expect } from '@playwright/test';

// Mock data
const MOCK_PROJECT_ID = 'proj_123';
const MOCK_AD_ID = 'ad_456';
const MOCK_MEDIA_URL = 'https://v3.fal.media/files/monkey/U_ff2CG_OehqYE2YTsAHJ.jpeg';

test.describe('MediaCanvas Download', () => {
  test('should trigger download when button is clicked', async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
        localStorage.setItem('accessToken', 'mock-token');
    });

    // Mock API responses
    // Use Regex to be safer
    await page.route(/campaign\/data\/proj_123/, async route => {
      console.log('Mocking campaign data matched!');
      await route.fulfill({
        json: {
          data: {
            ads: [
              {
                id: MOCK_AD_ID,
                headline: 'Test Ad',
                format: 'IMAGE',
                imageUrl: MOCK_MEDIA_URL,
                imageUrls: [MOCK_MEDIA_URL]
              }
            ]
          }
        }
      });
    });

    await page.route(MOCK_MEDIA_URL, async route => {
        // Return a simple image blob
        const buffer = Buffer.from('fake image data');
        await route.fulfill({
            status: 200,
            contentType: 'image/jpeg',
            body: buffer
        });
    });

    // Navigate to the page
    await page.goto(`http://localhost:3000/marketing-automation/canvas/${MOCK_PROJECT_ID}/media/${MOCK_AD_ID}`);

    // Wait for the download button to appear
    const downloadButton = page.getByRole('button', { name: 'Download' });
    await expect(downloadButton).toBeVisible({ timeout: 10000 });

    // Setup download listener
    const downloadPromise = page.waitForEvent('download');

    // Click download
    await downloadButton.click();

    // Verify download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/Test Ad-media-1\.jpg/);

    // Take screenshot
    await page.screenshot({ path: 'download_test.png' });
  });
});
