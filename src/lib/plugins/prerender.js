/* global process */
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { isDocsLayerIntended } from './docs-seo.js';

/**
 * Strips leading slashes and removes '..' segments from a path to prevent traversal.
 *
 * @param {string} raw - raw pathname (e.g. '/../etc/passwd' or '/assets/app.js')
 * @returns {string} sanitised relative path safe for joining with a base directory
 */
export function sanitizePath(raw) {
  return raw
    .replace(/^\/+/, '')
    .split('/')
    .filter((s) => s && s !== '..')
    .join('/');
}

/**
 * Computes the output file path for a given route inside the dist directory.
 * Routes are normalised so they always resolve under distDir.
 *
 * @param {string} distDir - absolute path to the dist/ directory
 * @param {string} route - route path to render (e.g. '/' or '/about')
 * @returns {string} absolute file path for the pre-rendered HTML
 */
export function routeToOutputPath(distDir, route) {
  const clean = sanitizePath(route);
  if (!clean || clean === 'index.html') {
    return join(distDir, 'index.html');
  }
  return join(distDir, clean, 'index.html');
}

/**
 * Attribute a view puts on the element it shows when its data failed to load.
 * A prerendered page that still carries it captured an error state instead of
 * its content, so the build refuses to ship it.
 */
export const PRERENDER_ERROR_MARKER = 'data-prerender-error';

/**
 * Match an intercepted page request against the build-time API snapshot by URL
 * PATHNAME only — origin-agnostic, because the runtime API origin baked into
 * the bundle can differ from the origin the snapshot was fetched from. GET only.
 *
 * @param {Record<string, { body: string, contentType: string }>|null|undefined} apiSnapshot
 *   pathname → response snapshot (built by docs-seo's `fetchDocsSnapshot`)
 * @param {string} url - the intercepted request's absolute URL
 * @param {string} method - the intercepted request's HTTP method
 * @returns {{ body: string, contentType: string }|null} the snapshot entry, or null
 */
export function matchSnapshot(apiSnapshot, url, method) {
  if (!apiSnapshot || method !== 'GET') return null;
  try {
    return apiSnapshot[new URL(url).pathname] ?? null;
  } catch {
    return null;
  }
}

/**
 * Vite plugin — pre-renders configured routes at build time using Puppeteer.
 * Captures fully rendered HTML so crawlers receive meaningful content
 * without waiting for JavaScript execution.
 *
 * When `config.app.seo.prerender.apiSnapshot` is present (built by docs-seo's
 * `fetchDocsSnapshot`), matching page API requests are served from that
 * snapshot via request interception — the capture never depends on the API
 * being reachable from the build environment.
 *
 * Only active when mode is 'production' AND config.app.seo.prerender.enabled is true.
 *
 * @param {object} config - app config object (src/config/index.js)
 * @param {string} mode - Vite build mode ('production' | 'development' | …)
 * @returns {import('vite').Plugin}
 */
export function prerenderPlugin(config, mode) {
  const prerender = config?.app?.seo?.prerender;
  const enabled = mode === 'production' && prerender?.enabled === true;

  return {
    name: 'prerender',
    apply: 'build',

    /**
     * Runs after the bundle is fully written to disk.
     * Spins up a static server, launches Puppeteer, captures each route,
     * and overwrites the corresponding HTML file in dist/.
     *
     * @returns {Promise<void>}
     */
    async closeBundle() {
      if (!enabled) return;

      const routes = prerender?.routes;
      if (!routes || routes.length === 0) return;

      let browser;
      let server;
      let distDir;
      // Docs layer switched off on purpose (no contentUrl): a capture that shows
      // the data error state is expected, so it is skipped instead of failing.
      const docsIntended = isDocsLayerIntended(config?.app?.seo?.docs);

      try {
        const puppeteer = await import('puppeteer');
        distDir = join(process.cwd(), 'dist');
        // Keep the built shell in memory: rendering '/' overwrites dist/index.html,
        // and every later route must boot from the clean shell, not from the
        // rendered home page (its head tags would leak into every capture).
        const shell = readFileSync(join(distDir, 'index.html'));

        // Spin up a lightweight static file server for the dist/ folder
        server = await startStaticServer(distDir, shell);
        const port = server.address().port;

        browser = await puppeteer.default.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        for (const route of routes) {
          try {
            await renderRoute(browser, port, route, distDir, prerender?.apiSnapshot, docsIntended);
          } catch (routeError) {
            console.warn(
              `[prerender] Failed to pre-render route "${route}":`,
              routeError instanceof Error ? routeError.message : String(routeError),
            );
          }
        }

        console.log(`[prerender] Successfully pre-rendered ${routes.length} route(s).`);
      } catch (err) {
        // Gracefully fail without breaking the build
        const message = err instanceof Error ? err.message : String(err);
        console.warn('[prerender] Pre-rendering failed, build continues without it:', message);
      } finally {
        if (browser) await browser.close().catch(() => {});
        if (server) await closeServer(server);
      }

      // Fail-hard build-time assert (#4502): re-read each written prerendered file and
      // refuse to ship a build that still references the local prerender-server origin.
      // Deliberately OUTSIDE the try/catch above — that block is fail-soft by design
      // (a puppeteer/render hiccup must never break unrelated builds), so a leak thrown
      // in there would be silently swallowed. Mirrors the docs fail-hard gate pattern:
      // fail-soft render step, then a separate check afterward that always propagates.
      if (distDir) {
        const leakPattern = /https?:\/\/(?:127\.0\.0\.1|localhost):\d+/;
        for (const route of routes) {
          const outputPath = routeToOutputPath(distDir, route);
          let written;
          try {
            written = readFileSync(outputPath, 'utf-8');
          } catch {
            continue; // route was never (re)written this run — nothing to assert on
          }
          if (written.includes(PRERENDER_ERROR_MARKER)) {
            throw new Error(
              `[prerender] FAIL-HARD: pre-rendered route "${route}" (${outputPath}) captured an error state ` +
                'instead of its content — the page could not load its data at build time. Make that data ' +
                'reachable from the build (for the API reference: enable app.seo.docs with a contentUrl so the ' +
                'OpenAPI spec is snapshotted) or remove the route from app.seo.prerender.routes.',
            );
          }
          if (leakPattern.test(written)) {
            throw new Error(
              `[prerender] FAIL-HARD: pre-rendered route "${route}" (${outputPath}) still contains ` +
                'a reference to the local prerender-server origin (127.0.0.1/localhost) — see #4502. ' +
                'Refusing to ship a build with a leaked internal URL.',
            );
          }
        }
      }
    },
  };
}

/**
 * Starts a lightweight Node HTTP server that serves static files from a directory.
 * Serves the in-memory built shell for '/', '/index.html' and every SPA route.
 *
 * @param {string} distDir - absolute path to the dist/ directory
 * @param {Buffer|string} shell - the built index.html, read before any route is rendered
 * @returns {Promise<import('node:http').Server>} running server instance
 */
export function startStaticServer(distDir, shell) {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const requestUrl = new URL(req.url || '/', 'http://localhost');
      let pathname = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
      pathname = sanitizePath(pathname);
      const filePath = join(distDir, pathname);

      if (!pathname || pathname === 'index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(shell);
        return;
      }

      try {
        const content = readFileSync(filePath);
        const ext = filePath.split('.').pop();
        const mimeTypes = {
          html: 'text/html',
          js: 'application/javascript',
          css: 'text/css',
          json: 'application/json',
          png: 'image/png',
          jpg: 'image/jpeg',
          svg: 'image/svg+xml',
          ico: 'image/x-icon',
          woff2: 'font/woff2',
          woff: 'font/woff',
          ttf: 'font/ttf',
        };
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(content);
      } catch {
        // SPA fallback — serve the built shell for any unresolved path
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(shell);
      }
    });

    server.listen(0, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
  });
}

/**
 * Renders a single route via Puppeteer and writes the captured HTML to disk.
 *
 * @param {import('puppeteer').Browser} browser - Puppeteer browser instance
 * @param {number} port - local server port
 * @param {string} route - route path to render (e.g. '/')
 * @param {string} distDir - absolute path to the dist/ directory
 * @param {Record<string, { body: string, contentType: string }>} [apiSnapshot]
 *   build-time API snapshot served to the page instead of live API calls
 * @param {boolean} [docsIntended=true] - false when the docs layer is off on purpose:
 *   a capture carrying the error marker is then not written (the route keeps the shell)
 * @returns {Promise<void>}
 */
async function renderRoute(browser, port, route, distDir, apiSnapshot, docsIntended = true) {
  const page = await browser.newPage();
  try {
    const url = `http://127.0.0.1:${port}${route}`;

    if (apiSnapshot && Object.keys(apiSnapshot).length > 0) {
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        // Answer CORS preflights for snapshot-covered paths ourselves — a
        // continue()d OPTIONS would depend on the real API being reachable,
        // which is exactly what the snapshot exists to avoid.
        if (req.method() === 'OPTIONS' && matchSnapshot(apiSnapshot, req.url(), 'GET')) {
          const preflightOrigin = req.headers()?.origin;
          req
            .respond({
              status: 204,
              headers: {
                'Access-Control-Allow-Origin': preflightOrigin || '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': req.headers()?.['access-control-request-headers'] || '*',
                ...(preflightOrigin ? { 'Access-Control-Allow-Credentials': 'true' } : {}),
              },
              body: '',
            })
            .catch(() => {});
          return;
        }
        const hit = matchSnapshot(apiSnapshot, req.url(), req.method());
        if (hit) {
          // Reflect the page origin instead of '*': the app's HTTP client may
          // send credentialed (withCredentials) requests, and browsers reject a
          // wildcard ACAO for those.
          const origin = req.headers()?.origin;
          req
            .respond({
              status: 200,
              contentType: hit.contentType,
              headers: {
                'Access-Control-Allow-Origin': origin || '*',
                ...(origin ? { 'Access-Control-Allow-Credentials': 'true' } : {}),
              },
              body: hit.body,
            })
            .catch(() => {});
          return;
        }
        req.continue().catch(() => {});
      });
    }

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30_000 });
    const html = await page.content();

    // Vite's __vitePreload absolutizes lazy-chunk deps via import.meta.resolve against
    // the local prerender server origin (#4502); static chunks stay relative, so
    // stripping the origin yields the same root-relative form.
    const sanitized = html.replace(new RegExp('https?://(?:127\\.0\\.0\\.1|localhost):' + port, 'g'), '');

    const outputPath = routeToOutputPath(distDir, route);

    if (!docsIntended && sanitized.includes(PRERENDER_ERROR_MARKER)) {
      console.warn(
        `[prerender] Skipped route "${route}": it captured an error state and the docs layer is off ` +
          '(app.seo.docs.enabled with a non-empty contentUrl). The route keeps the SPA shell.',
      );
      return;
    }

    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, sanitized, 'utf-8');
    console.log(`[prerender] Rendered: ${route} → ${outputPath}`);
  } finally {
    await page.close();
  }
}

/**
 * Gracefully closes the static server.
 *
 * @param {import('node:http').Server} server - server instance to close
 * @returns {Promise<void>}
 */
function closeServer(server) {
  return new Promise((resolve) => {
    server.close(() => resolve());
  });
}
