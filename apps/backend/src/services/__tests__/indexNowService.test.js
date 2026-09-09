import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { notifyIndexNow } from '../indexNowService.js';

// IndexNow tells Bing/Yandex (and other participating engines) that a URL's
// content changed, so stale prices/stock don't get recommended. It is strictly
// fire-and-forget: a ping failure must NEVER fail the admin product update.

describe('notifyIndexNow', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.INDEXNOW_KEY;
    delete process.env.FRONTEND_URL;
    vi.restoreAllMocks();
  });

  it('does nothing when INDEXNOW_KEY is not configured', async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    await notifyIndexNow(['/products/grapheneos-pixel-7a']);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('pings the IndexNow API with the key, key location and absolute URLs', async () => {
    process.env.INDEXNOW_KEY = 'test-key-123';
    process.env.FRONTEND_URL = 'https://graphene-security.com';
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;

    await notifyIndexNow(['/products/grapheneos-pixel-7a', '/products']);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.indexnow.org/indexnow');
    expect(options.method).toBe('POST');
    const body = JSON.parse(options.body);
    expect(body).toEqual({
      host: 'graphene-security.com',
      key: 'test-key-123',
      keyLocation: 'https://graphene-security.com/test-key-123.txt',
      urlList: [
        'https://graphene-security.com/products/grapheneos-pixel-7a',
        'https://graphene-security.com/products'
      ]
    });
  });

  it('defaults the host to the production domain when FRONTEND_URL is unset', async () => {
    process.env.INDEXNOW_KEY = 'test-key-123';
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;

    await notifyIndexNow(['/products']);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.host).toBe('graphene-security.com');
    expect(body.urlList[0]).toContain('https://graphene-security.com/products');
  });

  it('swallows network failures (fire-and-forget)', async () => {
    process.env.INDEXNOW_KEY = 'test-key-123';
    global.fetch = vi.fn().mockRejectedValue(new Error('network down'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(notifyIndexNow(['/products'])).resolves.toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('ignores an empty URL list', async () => {
    process.env.INDEXNOW_KEY = 'test-key-123';
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    await notifyIndexNow([]);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
