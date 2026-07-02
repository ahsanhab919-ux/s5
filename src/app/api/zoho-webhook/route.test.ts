import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { POST } from './route';

// Mock axios
vi.mock('axios');

describe('Zoho Webhook API', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return 500 if ZOHO_WEBHOOK_URL is not defined', async () => {
    delete process.env.ZOHO_WEBHOOK_URL;

    const request = new Request('http://localhost/api/zoho-webhook', {
      method: 'POST',
      body: JSON.stringify({ event: { some: 'data' } }),
    });

    // We expect the implementation to fail if the env var is missing.
    // Currently it hardcodes it, so this test serves as a requirement for the fix.
    const response = await POST(request);

    // In the future implementation, this should return 500.
    // If the current implementation runs, it will likely succeed (200) because of hardcoded URL,
    // OR fail if I mock axios to fail for the hardcoded URL.
    // Since I want to verify the FIX, I will assert 500.
    expect(response.status).toBe(500);
  });

  it('should post to ZOHO_WEBHOOK_URL and return 200 on success', async () => {
    const mockUrl = 'https://mock-zoho.com/webhook';
    process.env.ZOHO_WEBHOOK_URL = mockUrl;

    (axios.post as any).mockResolvedValue({ data: { success: true } });

    const request = new Request('http://localhost/api/zoho-webhook', {
      method: 'POST',
      body: JSON.stringify({ event: { some: 'data' } }),
    });

    const response = await POST(request);

    // This assertion ensures we are NOT using the hardcoded URL anymore
    expect(axios.post).toHaveBeenCalledWith(
        mockUrl,
        expect.objectContaining({ event: { some: 'data' } })
    );
    expect(response.status).toBe(200);
  });
});
