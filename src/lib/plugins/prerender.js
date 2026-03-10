/* global process */
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

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
 * Vite plugin — pre-renders configured routes at build time using Puppeteer.
 * Captures fully rendered HTML so crawlers receive meaningful content
 * without waiting for JavaScript execution.
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

      try {
        const puppeteer = await import('puppeteer');
        const distDir = join(process.cwd(), 'dist');

        // Spin up a lightweight static file server for the dist/ folder
        server = await startStaticServer(distDir);
        const port = server.address().port;

        browser = await puppeteer.default.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        for (const route of routes) {
          try {
            await renderRoute(browser, port, route, distDir);
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
    },
  };
}

/**
 * Starts a lightweight Node HTTP server that serves static files from a directory.
 * Falls back to index.html for SPA routes.
 *
 * @param {string} distDir - absolute path to the dist/ directory
 * @returns {Promise<import('node:http').Server>} running server instance
 */
function startStaticServer(distDir) {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const requestUrl = new URL(req.url || '/', 'http://localhost');
      let pathname = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
      pathname = sanitizePath(pathname);
      const filePath = join(distDir, pathname);

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
        // SPA fallback — serve index.html for any unresolved path
        try {
          const fallback = readFileSync(join(distDir, 'index.html'));
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(fallback);
        } catch {
          res.writeHead(404);
          res.end('Not Found');
        }
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
 * @returns {Promise<void>}
 */
async function renderRoute(browser, port, route, distDir) {
  const page = await browser.newPage();
  try {
    const url = `http://127.0.0.1:${port}${route}`;

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30_000 });
    const html = await page.content();

    const outputPath = routeToOutputPath(distDir, route);

    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, html, 'utf-8');
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
