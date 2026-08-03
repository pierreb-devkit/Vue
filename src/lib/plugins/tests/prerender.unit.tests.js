import { join } from 'node:path';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted runs before vi.mock hoisting — safe to reference in factories
const { mockPage, mockBrowser, mockCreateServer, mockFsFns } = vi.hoisted(() => {
  const mockPage = {
    goto: vi.fn().mockResolvedValue(undefined),
    content: vi.fn().mockResolvedValue('<html><body>rendered</body></html>'),
    close: vi.fn().mockResolvedValue(undefined),
    setRequestInterception: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
  };
  const mockBrowser = {
    newPage: vi.fn().mockResolvedValue(mockPage),
    close: vi.fn().mockResolvedValue(undefined),
  };
  const mockCreateServer = vi.fn(() => ({
    listen: vi.fn((_port, _host, cb) => cb()),
    address: vi.fn(() => ({ port: 54321 })),
    close: vi.fn((cb) => cb()),
    on: vi.fn(),
  }));
  const mockFsFns = {
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    readFileSync: vi.fn(() => '<html></html>'),
  };
  return { mockPage, mockBrowser, mockCreateServer, mockFsFns };
});

// NOTE: deliberately NOT using the `async (importOriginal) => { const actual = await
// importOriginal(); ... }` factory shape here. For these two Node builtins that pattern
// fails to intercept the *transitive* import inside prerender.js (readFileSync/
// writeFileSync/createServer silently fall through to the REAL implementations —
// verified by writing real files under dist/ during a plain unit test run). A
// synchronous factory that doesn't call importOriginal() intercepts correctly; since
// prerender.js only ever touches these explicitly-mocked functions, nothing is lost.
vi.mock('node:fs', () => ({
  ...mockFsFns,
  default: { ...mockFsFns },
}));

vi.mock('puppeteer', () => ({
  default: { launch: vi.fn().mockResolvedValue(mockBrowser) },
}));

vi.mock('node:http', () => ({
  createServer: mockCreateServer,
  default: { createServer: mockCreateServer },
}));

import { prerenderPlugin, sanitizePath, routeToOutputPath, matchSnapshot } from '../prerender.js';

describe('prerenderPlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPage.goto.mockResolvedValue(undefined);
    mockPage.content.mockResolvedValue('<html><body>rendered</body></html>');
    mockPage.close.mockResolvedValue(undefined);
    mockBrowser.newPage.mockResolvedValue(mockPage);
    mockBrowser.close.mockResolvedValue(undefined);
  });

  it('returns a vite plugin with correct name', () => {
    const plugin = prerenderPlugin({}, 'development');
    expect(plugin.name).toBe('prerender');
    expect(plugin.apply).toBe('build');
    expect(typeof plugin.closeBundle).toBe('function');
  });

  it('is a no-op when mode is not production', async () => {
    const plugin = prerenderPlugin(
      { app: { seo: { prerender: { enabled: true, routes: ['/'] } } } },
      'development',
    );
    await plugin.closeBundle();
  });

  it('is a no-op when prerender is disabled', async () => {
    const plugin = prerenderPlugin(
      { app: { seo: { prerender: { enabled: false, routes: ['/'] } } } },
      'production',
    );
    await plugin.closeBundle();
  });

  it('is a no-op when config is empty', async () => {
    const plugin = prerenderPlugin({}, 'production');
    await plugin.closeBundle();
  });

  it('is a no-op when routes array is empty', async () => {
    const plugin = prerenderPlugin(
      { app: { seo: { prerender: { enabled: true, routes: [] } } } },
      'production',
    );
    await plugin.closeBundle();
  });

  it('renders routes and closes browser/server on success', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const plugin = prerenderPlugin(
      { app: { seo: { prerender: { enabled: true, routes: ['/', '/about'] } } } },
      'production',
    );

    await plugin.closeBundle();

    expect(mockBrowser.newPage).toHaveBeenCalledTimes(2);
    expect(mockPage.goto).toHaveBeenCalledTimes(2);
    expect(mockPage.content).toHaveBeenCalledTimes(2);
    expect(mockPage.close).toHaveBeenCalledTimes(2);
    expect(mockBrowser.close).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('[prerender] Successfully pre-rendered 2 route(s)'),
    );
    logSpy.mockRestore();
  });

  it('closes page in finally block even when goto throws', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockPage.goto.mockRejectedValue(new Error('Navigation timeout'));

    const plugin = prerenderPlugin(
      { app: { seo: { prerender: { enabled: true, routes: ['/'] } } } },
      'production',
    );

    await plugin.closeBundle();

    // page.close is called via finally block despite goto failure
    expect(mockPage.close).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[prerender] Failed to pre-render route "/"'),
      'Navigation timeout',
    );
    warnSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('logs warning when puppeteer launch fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const puppeteer = await import('puppeteer');
    puppeteer.default.launch.mockRejectedValueOnce(new Error('No chromium'));

    const plugin = prerenderPlugin(
      { app: { seo: { prerender: { enabled: true, routes: ['/'] } } } },
      'production',
    );

    await plugin.closeBundle();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[prerender] Pre-rendering failed'),
      'No chromium',
    );
    warnSpy.mockRestore();
  });

  it('strips the local prerender-server origin from captured HTML before writing (#4502)', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockPage.content.mockResolvedValue(
      '<html><head><link rel="modulepreload" href="http://127.0.0.1:54321/assets/x.js"></head><body>rendered</body></html>',
    );

    const plugin = prerenderPlugin(
      { app: { seo: { prerender: { enabled: true, routes: ['/'] } } } },
      'production',
    );

    await plugin.closeBundle();

    const [, writtenHtml] = mockFsFns.writeFileSync.mock.calls[0];
    expect(writtenHtml).not.toContain('127.0.0.1');
    expect(writtenHtml).toContain('/assets/x.js');
    logSpy.mockRestore();
  });

  it('fails hard (#4502) when a written prerendered file still leaks the local prerender origin', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockFsFns.readFileSync.mockReturnValueOnce(
      '<html><body><link rel="modulepreload" href="http://127.0.0.1:54321/assets/x.js"></body></html>',
    );

    const plugin = prerenderPlugin(
      { app: { seo: { prerender: { enabled: true, routes: ['/'] } } } },
      'production',
    );

    await expect(plugin.closeBundle()).rejects.toThrow(/4502/);
    logSpy.mockRestore();
  });
});

describe('matchSnapshot', () => {
  const snapshot = {
    '/api/public/docs/': { body: '{"categories":[]}', contentType: 'application/json' },
    '/api/public/docs/welcome.md': { body: '# Welcome', contentType: 'text/markdown' },
  };

  it('matches a GET by pathname on ANY origin (origin-agnostic)', () => {
    expect(matchSnapshot(snapshot, 'https://api.example.com/api/public/docs/welcome.md', 'GET')).toEqual({
      body: '# Welcome',
      contentType: 'text/markdown',
    });
    expect(matchSnapshot(snapshot, 'https://other-origin.example.org/api/public/docs/welcome.md', 'GET')).toEqual({
      body: '# Welcome',
      contentType: 'text/markdown',
    });
  });

  it('never matches non-GET methods', () => {
    expect(matchSnapshot(snapshot, 'https://api.example.com/api/public/docs/', 'POST')).toBeNull();
  });

  it('returns null for an unknown pathname', () => {
    expect(matchSnapshot(snapshot, 'https://api.example.com/api/other', 'GET')).toBeNull();
  });

  it('returns null for a malformed URL or an absent snapshot', () => {
    expect(matchSnapshot(snapshot, 'not a url', 'GET')).toBeNull();
    expect(matchSnapshot(null, 'https://api.example.com/api/public/docs/', 'GET')).toBeNull();
    expect(matchSnapshot(undefined, 'https://api.example.com/api/public/docs/', 'GET')).toBeNull();
  });
});

describe('prerenderPlugin apiSnapshot interception', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPage.goto.mockResolvedValue(undefined);
    mockPage.content.mockResolvedValue('<html><body>rendered</body></html>');
    mockPage.close.mockResolvedValue(undefined);
    mockBrowser.newPage.mockResolvedValue(mockPage);
    mockBrowser.close.mockResolvedValue(undefined);
  });

  const snapshotConfig = () => ({
    app: {
      seo: {
        prerender: {
          enabled: true,
          routes: ['/docs'],
          apiSnapshot: {
            '/api/public/docs/': { body: '{"categories":[]}', contentType: 'application/json' },
          },
        },
      },
    },
  });

  it('enables request interception and wires a request handler when a snapshot is present', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await prerenderPlugin(snapshotConfig(), 'production').closeBundle();

    expect(mockPage.setRequestInterception).toHaveBeenCalledWith(true);
    expect(mockPage.on).toHaveBeenCalledWith('request', expect.any(Function));
    logSpy.mockRestore();
  });

  it('skips interception entirely when no snapshot is configured', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await prerenderPlugin(
      { app: { seo: { prerender: { enabled: true, routes: ['/docs'] } } } },
      'production',
    ).closeBundle();

    expect(mockPage.setRequestInterception).not.toHaveBeenCalled();
    expect(mockPage.on).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('the wired handler responds to snapshot hits and continues everything else', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await prerenderPlugin(snapshotConfig(), 'production').closeBundle();

    const handler = mockPage.on.mock.calls.find(([event]) => event === 'request')[1];

    const hit = {
      url: () => 'https://api.example.com/api/public/docs/',
      method: () => 'GET',
      headers: () => ({ origin: 'http://127.0.0.1:54321' }),
      respond: vi.fn(),
      continue: vi.fn().mockResolvedValue(undefined),
    };
    handler(hit);
    // Origin reflected (not '*') + credentials allowed: the app's HTTP client
    // may send credentialed requests, and browsers reject wildcard ACAO there.
    expect(hit.respond).toHaveBeenCalledWith({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Access-Control-Allow-Origin': 'http://127.0.0.1:54321',
        'Access-Control-Allow-Credentials': 'true',
      },
      body: '{"categories":[]}',
    });
    expect(hit.continue).not.toHaveBeenCalled();

    const hitNoOrigin = {
      url: () => 'https://api.example.com/api/public/docs/',
      method: () => 'GET',
      headers: () => ({}),
      respond: vi.fn(),
      continue: vi.fn().mockResolvedValue(undefined),
    };
    handler(hitNoOrigin);
    expect(hitNoOrigin.respond).toHaveBeenCalledWith({
      status: 200,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: '{"categories":[]}',
    });

    const miss = {
      url: () => 'https://api.example.com/api/unrelated',
      method: () => 'GET',
      headers: () => ({}),
      respond: vi.fn(),
      continue: vi.fn().mockResolvedValue(undefined),
    };
    handler(miss);
    expect(miss.respond).not.toHaveBeenCalled();
    expect(miss.continue).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('answers CORS preflights for snapshot-covered paths itself (204 + reflected origin)', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await prerenderPlugin(snapshotConfig(), 'production').closeBundle();
    const handler = mockPage.on.mock.calls.find(([event]) => event === 'request')[1];

    const preflight = {
      url: () => 'https://api.example.com/api/public/docs/',
      method: () => 'OPTIONS',
      headers: () => ({ origin: 'http://127.0.0.1:54321', 'access-control-request-headers': 'x-custom' }),
      respond: vi.fn(),
      continue: vi.fn().mockResolvedValue(undefined),
    };
    handler(preflight);
    expect(preflight.respond).toHaveBeenCalledWith({
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': 'http://127.0.0.1:54321',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'x-custom',
        'Access-Control-Allow-Credentials': 'true',
      },
      body: '',
    });
    expect(preflight.continue).not.toHaveBeenCalled();

    const preflightMiss = {
      url: () => 'https://api.example.com/api/unrelated',
      method: () => 'OPTIONS',
      headers: () => ({ origin: 'http://127.0.0.1:54321' }),
      respond: vi.fn(),
      continue: vi.fn().mockResolvedValue(undefined),
    };
    handler(preflightMiss);
    expect(preflightMiss.respond).not.toHaveBeenCalled();
    expect(preflightMiss.continue).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});

describe('sanitizePath', () => {
  it('strips leading slashes', () => {
    expect(sanitizePath('/assets/app.js')).toBe('assets/app.js');
  });

  it('strips multiple leading slashes', () => {
    expect(sanitizePath('///foo/bar')).toBe('foo/bar');
  });

  it('removes ".." segments to prevent traversal', () => {
    expect(sanitizePath('/../etc/passwd')).toBe('etc/passwd');
  });

  it('removes ".." segments in the middle', () => {
    expect(sanitizePath('/foo/../bar')).toBe('foo/bar');
  });

  it('handles root path', () => {
    expect(sanitizePath('/')).toBe('');
  });

  it('handles empty string', () => {
    expect(sanitizePath('')).toBe('');
  });

  it('handles path without leading slash', () => {
    expect(sanitizePath('assets/app.js')).toBe('assets/app.js');
  });

  it('filters empty segments from double slashes', () => {
    expect(sanitizePath('/foo//bar')).toBe('foo/bar');
  });
});

describe('routeToOutputPath', () => {
  const distDir = '/project/dist';

  it('maps "/" to dist/index.html', () => {
    expect(routeToOutputPath(distDir, '/')).toBe(join(distDir, 'index.html'));
  });

  it('maps "/about" to dist/about/index.html', () => {
    expect(routeToOutputPath(distDir, '/about')).toBe(join(distDir, 'about', 'index.html'));
  });

  it('maps "/blog/intro" to dist/blog/intro/index.html', () => {
    expect(routeToOutputPath(distDir, '/blog/intro')).toBe(
      join(distDir, 'blog', 'intro', 'index.html'),
    );
  });

  it('prevents path traversal with ".."', () => {
    const result = routeToOutputPath(distDir, '/../etc');
    expect(result).toBe(join(distDir, 'etc', 'index.html'));
    expect(result.startsWith(join(distDir))).toBe(true);
  });

  it('handles empty route as root', () => {
    expect(routeToOutputPath(distDir, '')).toBe(join(distDir, 'index.html'));
  });
});
