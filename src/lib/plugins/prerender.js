/* global process */
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

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
          await renderRoute(browser, port, route, distDir);
        }

        console.log(`[prerender] Successfully pre-rendered ${routes.length} route(s).`);
      } catch (err) {
        // Gracefully fail without breaking the build
        console.warn('[prerender] Pre-rendering failed, build continues without it:', err.message);
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
      const url = req.url === '/' ? '/index.html' : req.url;
      const filePath = join(distDir, url);

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
  const url = `http://127.0.0.1:${port}${route}`;

  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30_000 });
  const html = await page.content();
  await page.close();

  // Determine output file path — e.g. '/' → 'dist/index.html', '/about' → 'dist/about/index.html'
  const outputPath =
    route === '/' ? join(distDir, 'index.html') : join(distDir, route, 'index.html');

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, html, 'utf-8');
  console.log(`[prerender] Rendered: ${route} → ${outputPath}`);
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
